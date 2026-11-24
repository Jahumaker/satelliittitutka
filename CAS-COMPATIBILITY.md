# CAS startup compatibility — 24 November 2026

The supplied display photograph showed the untouched startup placeholders, including an unset clock. This establishes failure before normal initialization, not its precise cause. The configured URL was correct.

## Changes

- Bundle Leaflet 1.9.4, satellite.js 6.0.1 and application code into the site's own JavaScript file. No third-party CDN is needed at runtime.
- Serve Leaflet CSS locally. The application uses vector markers, not Leaflet's image markers.
- Compile JavaScript syntax to ES2015. Use a fallback for Unicode-property search expressions, ResizeObserver, AbortController and replaceChildren.
- Include an independent, ES5-syntax startup watchdog in the HTML. It reports script load errors, uncaught JavaScript errors and an unstarted clock after 45 seconds.
- Preserve the existing 1-second selected-object calculation and 30-second background calculation. No additional CelesTrak requests.

## Build and maintenance

`app.js` remains the source; the HTML runs `radar-cas-20261124.js`. **Rebuild the bundle after every application source change.**

Install the exact build dependencies in a clean working copy:

```
npm install --no-save --package-lock=false esbuild@0.28.2 leaflet@1.9.4 satellite.js@6.0.1
node scripts/build_cas_runtime.mjs
```

Commit both source and generated files. The Pages workflow stages the bundled runtime and local CSS.

## Verification and limitations

The generated bundle passes an ES2015 syntax parse. Automated Chromium tests with all third-party network access blocked load both selected objects, a 177-feature basemap, and advancing selected-object calculations without recalculating the background every second. The tests also pass with ResizeObserver, AbortController and replaceChildren removed. A blocked application script produces a visible error.

Tests use a historical orbit fixture at its own epoch, not as current orbital data. They simulate missing browser capabilities, not the actual CAS browser or device. The actual CAS failure cause and device stability remain unverified until the display is tested.
