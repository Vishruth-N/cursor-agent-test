import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [html, js, css, playlist, demoPlaylist] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
  readFile(new URL("../playlist.json", import.meta.url), "utf8"),
  readFile(new URL("../fixtures/demo-playlist.json", import.meta.url), "utf8"),
]);

test("loads a native playlist manifest by default", () => {
  assert.match(js, /DEFAULT_PLAYLIST = "\.\/playlist\.json"/);
  assert.match(js, /loadNativePlaylist\(\)/);
  assert.deepEqual(JSON.parse(playlist), { items: [] });
});

test("uses local fixture videos for native playback demos", () => {
  const items = JSON.parse(demoPlaylist).items;

  assert.equal(items.length, 2);
  assert.equal(items[0].sources[0].src, "./fixtures/demo-01.mp4");
  assert.equal(items[1].sources[0].src, "./fixtures/demo-02.mp4");
});

test("keeps the app shell local and free of third-party scripts", () => {
  assert.doesNotMatch(html, /<script[^>]+src=["']https?:\/\//i);
  assert.match(html, /<script type="module" src="\.\/app\.js"><\/script>/);
});

test("renders a native player and keeps iframe mode explicit", () => {
  assert.match(html, /<video[\s\S]+id="native-player"[\s\S]+playsinline/);
  assert.match(html, /<div id="playlist" class="playlist"/);
  assert.match(js, /const requestedSource = toHttpUrl\(params\.get\("source"\) \|\| ""\)/);
  assert.match(js, /if \(requestedSource\) \{\n  loadEmbedSource\(requestedSource\);/);
});

test("keeps explicit iframe source mode restrained", () => {
  assert.match(html, /referrerpolicy="no-referrer"/);
  assert.match(
    html,
    /sandbox="allow-forms allow-presentation allow-same-origin allow-scripts"/,
  );
  assert.match(html, /allow="autoplay; fullscreen; encrypted-media; picture-in-picture"/);
});

test("limits source overrides to http and https URLs", () => {
  assert.match(js, /parsed\.protocol === "http:" \|\| parsed\.protocol === "https:"/);
  assert.match(js, /return DEFAULT_PLAYLIST;/);
  assert.match(js, /new URL\(playlistUrl\)\.origin === window\.location\.origin/);
});

test("keeps visible app chrome intentionally minimal", () => {
  const visibleControlLabels = html.match(/>\s*(reload|open|full)\s*</g) ?? [];

  assert.equal(visibleControlLabels.length, 4);
  assert.match(html, /<div class="control-zone" aria-hidden="true"><\/div>/);
  assert.match(css, /\.control-zone:hover \+ \.controls/);
  assert.match(css, /\.shell\.controls-visible \.controls/);
  assert.match(js, /controlZone\.addEventListener\("pointerdown", showControls\)/);
  assert.match(js, /controlZone\.addEventListener\("pointermove", showControls\)/);
  assert.doesNotMatch(js, /window\.addEventListener\(\s*"pointermove"/);
  assert.match(css, /opacity: 0;/);
});

test("shows a black official-source fallback for blocked remote embeds", () => {
  assert.match(js, /EMBED_FALLBACK_DELAY = 2500/);
  assert.match(js, /new URL\(source\)\.origin !== window\.location\.origin/);
  assert.match(js, /setTimeout\(showFallback, EMBED_FALLBACK_DELAY\)/);
  assert.match(css, /body\.fallback-visible \.embed-frame/);
  assert.match(css, /\.fallback \{\n  background: #000;/);
});
