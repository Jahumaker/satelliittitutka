# Display memory fix — 25 November 2026

## Confirmed defect
`updateTrail()` created a new explicit Leaflet canvas renderer for every selected satellite on each trail refresh (45 seconds). Removing the old polylines did not remove their renderer layers from the map. These canvases accumulated throughout the session.

An accelerated regression test using two selected satellites and 150 trail refreshes reproduced growth from 3 to 303 map canvases in the previous version. The corrected version stayed at 2 canvases before and after the same test. This establishes the application defect, not the cause of physical device shutdown.

## Changes
- Reuse one trail renderer throughout the session.
- Refresh background positions every two minutes in batches of 60, yielding for 25 ms between batches. Positions describe the calculation timestamp, not live measurements.
- Selected satellite positions and pairwise distances continue at one second.
- Do not reconstruct orbital records when a downloaded catalog has the same generation timestamp.
- Cache-bust the locally bundled runtime from index.html.

## Tests
Automated Chromium 1080×1920: before/after renderer regression, background batch completion, selected propagation at 1 Hz, no extra background calculation in five seconds, nonempty pairwise distance, unchanged catalog reload skips record rebuilding, no vertical overflow, no uncaught page errors. Test date uses fixture generation time to avoid stale orbit exclusions.

Still requires testing on the actual CAS display device. CPU, thermal, power-supply, and OS causes of shutdown have not been measured or excluded.
