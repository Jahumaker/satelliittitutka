"""Fetch CelesTrak once per group; stop and persist a pause on any error.
Only Python standard library. Run from the repository root.
"""
import json, os, sys, urllib.request, urllib.error
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
PAUSE = DATA / 'update-blocked.json'
TARGET = DATA / 'orbits.json'
GROUPS = ['stations', 'weather', 'resource', 'science', 'gps-ops', 'galileo']

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def now():
    return datetime.now(timezone.utc).isoformat()

def main():
    DATA.mkdir(exist_ok=True)
    resume = os.environ.get('RESUME_SOURCE', 'false').lower() == 'true'
    if PAUSE.exists() and not resume:
        print('Source requests paused. Inspect data/update-blocked.json, fix the cause, then run manually with resume_source enabled.', file=sys.stderr)
        return 1
    # Do not request the source again less than two hours after a successful fetch.
    if TARGET.exists():
        old = json.loads(TARGET.read_text())
        elapsed = (datetime.now(timezone.utc) - datetime.fromisoformat(old['generatedAt'].replace('Z', '+00:00'))).total_seconds()
        if elapsed < 7200 and not PAUSE.exists():
            print('Previous data is less than two hours old; no source request.')
            return 0
    opener = urllib.request.build_opener(NoRedirect)
    satellites, seen, counts = [], set(), {}
    url = ''
    try:
        for group in GROUPS:
            url = f'https://celestrak.org/NORAD/elements/gp.php?GROUP={group}&FORMAT=json'
            request = urllib.request.Request(url, headers={'User-Agent': 'NewsroomSatelliteRadar/1.0', 'Accept': 'application/json'})
            with opener.open(request, timeout=60) as response:
                if response.status != 200:
                    raise RuntimeError(f'HTTP {response.status}')
                rows = json.load(response)
            if not isinstance(rows, list) or not rows:
                raise ValueError('Expected a nonempty OMM array')
            for omm in rows:
                required = ['OBJECT_NAME', 'NORAD_CAT_ID', 'EPOCH', 'MEAN_MOTION', 'ECCENTRICITY', 'INCLINATION', 'RA_OF_ASC_NODE', 'ARG_OF_PERICENTER', 'MEAN_ANOMALY', 'BSTAR']
                if not all(k in omm for k in required):
                    raise ValueError('Missing required OMM fields')
                identifier = int(omm['NORAD_CAT_ID'])
                name = omm['OBJECT_NAME']
                if group == 'stations' and name not in ('ISS (ZARYA)', 'CSS (TIANHE)'):
                    continue
                if ' DEB' in name or ' R/B' in name or identifier in seen:
                    continue
                seen.add(identifier)
                satellites.append({'group': 'navigation' if group in ('gps-ops', 'galileo') else group, 'omm': omm})
                counts[group] = counts.get(group, 0) + 1
        result = {'generatedAt': now(), 'source': 'CelesTrak GP / OMM JSON', 'groups': GROUPS, 'counts': counts, 'satellites': satellites}
        temp = TARGET.with_suffix('.tmp')
        temp.write_text(json.dumps(result, separators=(',', ':')), encoding='utf-8')
        temp.replace(TARGET)
        PAUSE.unlink(missing_ok=True)
        print(f'Updated {len(satellites)} satellites: {counts}')
        return 0
    except Exception as exc:
        error = {'blockedAt': now(), 'url': url, 'error': str(exc), 'action': 'Investigate before manually resuming. No automatic source retries.'}
        PAUSE.write_text(json.dumps(error, indent=2), encoding='utf-8')
        print(json.dumps(error), file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())
