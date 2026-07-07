# Focus Video Viewer

A super minimal, fullscreen web-view for a single playlist source.

## Run

```sh
npm start
```

Open `http://127.0.0.1:4173`.

The default source is:

```text
https://pl.pornhub.com/playlist/152025041
```

For local testing or a different official source:

```text
http://127.0.0.1:4173/?source=https://example.com
```

## Notes

- The app shell has no ads, trackers, analytics, or external scripts.
- Source providers can still enforce their own ads, embedding rules, DRM, cookies, region checks, or age gates.
- If a provider blocks iframe playback, use the small `open` control to launch the official source directly.
