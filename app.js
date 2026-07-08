const DEFAULT_SOURCE = "https://pl.pornhub.com/playlist/152025041";

const frame = document.querySelector("#viewer-frame");
const reload = document.querySelector("#reload");
const fullscreen = document.querySelector("#fullscreen");
const openSource = document.querySelector("#open-source");
const fallback = document.querySelector("#source-fallback");
const fallbackOpen = document.querySelector("#fallback-open");
const shell = document.querySelector(".shell");
const controlZone = document.querySelector(".control-zone");
const EMBED_FALLBACK_DELAY = 2500;

const getSource = () => {
  const requestedSource = new URLSearchParams(window.location.search).get("source");

  if (!requestedSource) {
    return DEFAULT_SOURCE;
  }

  try {
    const parsed = new URL(requestedSource);

    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    // Fall through to the default source for malformed overrides.
  }

  return DEFAULT_SOURCE;
};

const source = getSource();

const setLinks = () => {
  openSource.href = source;
  fallbackOpen.href = source;
};

const showFallback = () => {
  fallback.hidden = false;
  document.body.classList.add("fallback-visible");
};

let controlsTimer;

const showControls = () => {
  shell.classList.add("controls-visible");
  clearTimeout(controlsTimer);
  controlsTimer = setTimeout(() => {
    shell.classList.remove("controls-visible");
  }, 2600);
};

setLinks();
frame.src = source;

frame.addEventListener("error", showFallback);

if (new URL(source).origin !== window.location.origin) {
  setTimeout(showFallback, EMBED_FALLBACK_DELAY);
}

controlZone.addEventListener("pointerdown", showControls);
controlZone.addEventListener("pointermove", showControls);

reload.addEventListener("click", () => {
  fallback.hidden = true;
  document.body.classList.remove("fallback-visible");
  frame.src = source;
  reload.blur();
  if (new URL(source).origin !== window.location.origin) {
    setTimeout(showFallback, EMBED_FALLBACK_DELAY);
  }
});

fullscreen.addEventListener("click", async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    fullscreen.blur();
    return;
  }

  await document.documentElement.requestFullscreen();
  fullscreen.blur();
});
