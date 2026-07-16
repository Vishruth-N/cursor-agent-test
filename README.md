# Focus Video Viewer

A super minimal native playlist player for direct video sources.

## Run

```sh
npm start
```

Open `http://127.0.0.1:4173`.

Add videos you have the right to play in `playlist.json`:

```json
{
  "items": [
    {
      "title": "Example",
      "sources": [
        {
          "src": "https://example.com/video.mp4",
          "type": "video/mp4"
        }
      ]
    }
  ]
}
```

For local testing:

```text
http://127.0.0.1:4173/?playlist=fixtures/demo-playlist.json
```

## Notes

- The app shell has no ads, trackers, analytics, or external scripts.
- Native playback requires direct MP4/WebM/HLS sources that you have the right to use.
- The app does not scrape websites, extract protected streams, bypass ads, bypass DRM, or bypass access controls.
- Explicit `?source=https://example.com` iframe mode is still available for official embeds and shows an `open` fallback when blocked.
