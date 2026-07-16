const DEFAULT_PLAYLIST = "./playlist.json";

const frame = document.querySelector("#viewer-frame");
const nativeView = document.querySelector("#native-view");
const nativePlayer = document.querySelector("#native-player");
const emptyState = document.querySelector("#empty-state");
const playlist = document.querySelector("#playlist");
const reload = document.querySelector("#reload");
const fullscreen = document.querySelector("#fullscreen");
const openSource = document.querySelector("#open-source");
const fallback = document.querySelector("#source-fallback");
const fallbackOpen = document.querySelector("#fallback-open");
const shell = document.querySelector(".shell");
const controlZone = document.querySelector(".control-zone");
const EMBED_FALLBACK_DELAY = 2500;

const params = new URLSearchParams(window.location.search);
let activeSource = "";
let activeIndex = 0;
let activeItems = [];

const toHttpUrl = (value, base = window.location.href) => {
  if (!value) {
    return "";
  }

  try {
    const parsed = new URL(value, base);

    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return "";
  }

  return "";
};

const getPlaylistUrl = () => {
  const requestedPlaylist = params.get("playlist");

  if (!requestedPlaylist) {
    return DEFAULT_PLAYLIST;
  }

  const playlistUrl = toHttpUrl(requestedPlaylist);

  if (playlistUrl && new URL(playlistUrl).origin === window.location.origin) {
    return playlistUrl;
  }

  return DEFAULT_PLAYLIST;
};

const setLinks = () => {
  if (!activeSource) {
    openSource.removeAttribute("href");
    fallbackOpen.removeAttribute("href");
    return;
  }

  openSource.href = activeSource;
  fallbackOpen.href = activeSource;
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

controlZone.addEventListener("pointerdown", showControls);
controlZone.addEventListener("pointermove", showControls);

reload.addEventListener("click", () => {
  if (frame.hidden) {
    nativePlayer.load();
  } else {
    fallback.hidden = true;
    document.body.classList.remove("fallback-visible");
    frame.src = activeSource;
    if (new URL(activeSource).origin !== window.location.origin) {
      setTimeout(showFallback, EMBED_FALLBACK_DELAY);
    }
  }

  reload.blur();
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

const normalizeItem = (item, index, baseUrl) => {
  const sources = Array.isArray(item?.sources)
    ? item.sources
        .map((source) => ({
          src: toHttpUrl(source?.src, baseUrl),
          type: source?.type || "",
        }))
        .filter((source) => source.src)
    : [];

  return {
    title: item?.title || String(index + 1).padStart(2, "0"),
    poster: item?.poster ? toHttpUrl(item.poster, baseUrl) : "",
    sources,
  };
};

const loadItem = (index) => {
  const item = activeItems[index];

  if (!item) {
    return;
  }

  activeIndex = index;
  activeSource = item.sources[0]?.src || "";
  nativePlayer.replaceChildren(
    ...item.sources.map((source) => {
      const sourceEl = document.createElement("source");
      sourceEl.src = source.src;

      if (source.type) {
        sourceEl.type = source.type;
      }

      return sourceEl;
    }),
  );
  nativePlayer.poster = item.poster;
  nativePlayer.load();
  setLinks();

  playlist.querySelectorAll("button").forEach((button, buttonIndex) => {
    button.classList.toggle("is-active", buttonIndex === activeIndex);
  });
};

const renderPlaylist = () => {
  playlist.replaceChildren(
    ...activeItems.map((item, index) => {
      const button = document.createElement("button");
      button.className = "playlist-item";
      button.type = "button";
      button.textContent = String(index + 1).padStart(2, "0");
      button.setAttribute("aria-label", item.title);
      button.addEventListener("click", () => loadItem(index));
      return button;
    }),
  );
};

const loadNativePlaylist = async () => {
  document.body.classList.add("native-mode");
  document.body.classList.remove("embed-mode");
  const playlistUrl = getPlaylistUrl();
  const response = await fetch(playlistUrl, { cache: "no-store" });
  const manifest = response.ok ? await response.json() : { items: [] };
  activeItems = (manifest.items || [])
    .map((item, index) => normalizeItem(item, index, playlistUrl))
    .filter((item) => item.sources.length);

  if (!activeItems.length) {
    emptyState.hidden = false;
    nativePlayer.hidden = true;
    setLinks();
    return;
  }

  emptyState.hidden = true;
  nativePlayer.hidden = false;
  renderPlaylist();
  loadItem(0);
};

const loadEmbedSource = (source) => {
  document.body.classList.add("embed-mode");
  document.body.classList.remove("native-mode");
  activeSource = source;
  nativeView.hidden = true;
  frame.hidden = false;
  setLinks();
  frame.src = source;
  frame.addEventListener("error", showFallback);

  if (new URL(source).origin !== window.location.origin) {
    setTimeout(showFallback, EMBED_FALLBACK_DELAY);
  }
};

const requestedSource = toHttpUrl(params.get("source") || "");

if (requestedSource) {
  loadEmbedSource(requestedSource);
} else {
  loadNativePlaylist().catch(() => {
    emptyState.hidden = false;
    nativePlayer.hidden = true;
  });
}
