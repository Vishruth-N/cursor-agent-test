const DEFAULT_SOURCE = "https://pl.pornhub.com/playlist/152025041";

const frame = document.querySelector("#viewer-frame");
const shell = document.querySelector(".shell");
const reload = document.querySelector("#reload");
const fullscreen = document.querySelector("#fullscreen");
const openSource = document.querySelector("#open-source");
const fallback = document.querySelector("#source-fallback");
const fallbackOpen = document.querySelector("#fallback-open");
const CONTROL_REVEAL_EDGE = 96;

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
};

setLinks();
frame.src = source;

frame.addEventListener("error", showFallback);

window.addEventListener(
  "pointermove",
  ({ clientY }) => {
    const isNearControls = window.innerHeight - clientY <= CONTROL_REVEAL_EDGE;
    shell.classList.toggle("controls-visible", isNearControls);
  },
  { passive: true },
);

window.addEventListener("pointerleave", () => {
  shell.classList.remove("controls-visible");
});

reload.addEventListener("click", () => {
  frame.src = source;
});

fullscreen.addEventListener("click", async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }

  await document.documentElement.requestFullscreen();
});
