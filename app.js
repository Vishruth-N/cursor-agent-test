const DEFAULT_PLAYLIST = "./playlist.json";

const frame = document.querySelector("#viewer-frame");
const nativeView = document.querySelector("#native-view");
const nativePlayer = document.querySelector("#native-player");
const emptyState = document.querySelector("#empty-state");
const sourcePanel = document.querySelector("#source-panel");
const sourceImport = document.querySelector("#source-import");
const sourceInput = document.querySelector("#source-input");
const sourceImportStatus = document.querySelector("#source-import-status");
const clearSources = document.querySelector("#clear-sources");
const playlist = document.querySelector("#playlist");
const reload = document.querySelector("#reload");
const fullscreen = document.querySelector("#fullscreen");
const manageSources = document.querySelector("#manage-sources");
const openSource = document.querySelector("#open-source");
const fallback = document.querySelector("#source-fallback");
const fallbackOpen = document.querySelector("#fallback-open");
const shell = document.querySelector(".shell");
const controlZone = document.querySelector(".control-zone");
const EMBED_FALLBACK_DELAY = 2500;
const LOCAL_PLAYLIST_KEY = "focus-video-viewer:playlist";
const MEDIA_TYPES = new Map([
  ["m3u8", "application/vnd.apple.mpegurl"],
  ["mp4", "video/mp4"],
  ["ogv", "video/ogg"],
  ["ogg", "video/ogg"],
  ["webm", "video/webm"],
]);

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

const inferMediaType = (src) => {
  const extension = new URL(src).pathname.split(".").pop()?.toLowerCase() || "";
  return MEDIA_TYPES.get(extension) || "";
};

const titleFromSource = (src) => {
  const parsed = new URL(src);
  const filename = parsed.pathname.split("/").filter(Boolean).at(-1);

  if (!filename) {
    return parsed.hostname;
  }

  try {
    return decodeURIComponent(filename);
  } catch {
    return filename;
  }
};

const readLocalPlaylistItems = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_PLAYLIST_KEY) || "{}");
    return Array.isArray(stored.items) ? stored.items : [];
  } catch {
    return [];
  }
};

const setImportStatus = (message) => {
  sourceImportStatus.textContent = message;
};

const getLocalSourceLines = () =>
  readLocalPlaylistItems()
    .flatMap((item) => item.sources || [])
    .map((source) => source.src)
    .filter(Boolean);

const syncImportForm = () => {
  const localSources = getLocalSourceLines();

  if (localSources.length && !sourceInput.value.trim()) {
    sourceInput.value = localSources.join("\n");
  }

  clearSources.hidden = !localSources.length;
  setImportStatus("Paste direct MP4/WebM/HLS URLs you have the right to play.");
};

const setSourcePanelVisible = (visible) => {
  sourcePanel.hidden = !visible;
  document.body.classList.toggle("source-panel-visible", visible);
};

const parseImportedItems = (value) => {
  const seen = new Set();

  return value
    .split(/\r?\n/)
    .map((line) => toHttpUrl(line.trim()))
    .filter((src) => {
      if (!src || seen.has(src)) {
        return false;
      }

      seen.add(src);
      return true;
    })
    .map((src) => ({
      title: titleFromSource(src),
      sources: [{ src, type: inferMediaType(src) }],
    }));
};

const saveLocalPlaylistItems = (items) => {
  localStorage.setItem(LOCAL_PLAYLIST_KEY, JSON.stringify({ items }));
};

const clearLocalPlaylistItems = () => {
  localStorage.removeItem(LOCAL_PLAYLIST_KEY);
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setSourcePanelVisible(false);
  }
});

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

sourceImport.addEventListener("submit", async (event) => {
  event.preventDefault();
  const items = parseImportedItems(sourceInput.value);

  if (!items.length) {
    setImportStatus("Paste at least one http(s) direct media URL.");
    return;
  }

  try {
    saveLocalPlaylistItems(items);
  } catch {
    setImportStatus("Could not save sources in this browser.");
    return;
  }

  setImportStatus(`Saved ${items.length} source${items.length === 1 ? "" : "s"}.`);
  await loadNativePlaylist();
});

clearSources.addEventListener("click", async () => {
  clearLocalPlaylistItems();
  sourceInput.value = "";
  await loadNativePlaylist();
  clearSources.blur();
});

manageSources.addEventListener("click", () => {
  syncImportForm();
  setSourcePanelVisible(sourcePanel.hidden);
  manageSources.blur();
});

const loadNativePlaylist = async () => {
  document.body.classList.add("native-mode");
  document.body.classList.remove("embed-mode");
  const playlistUrl = getPlaylistUrl();
  const response = await fetch(playlistUrl, { cache: "no-store" });
  const manifest = response.ok ? await response.json() : { items: [] };
  const localItems = params.has("playlist") ? [] : readLocalPlaylistItems();
  const manifestItems = Array.isArray(manifest.items) ? manifest.items : [];
  const sourceItems = localItems.length ? localItems : manifestItems;
  activeItems = sourceItems
    .map((item, index) =>
      normalizeItem(item, index, localItems.length ? window.location.href : playlistUrl),
    )
    .filter((item) => item.sources.length);

  if (!activeItems.length) {
    activeIndex = 0;
    activeSource = "";
    nativePlayer.replaceChildren();
    nativePlayer.removeAttribute("poster");
    renderPlaylist();
    syncImportForm();
    emptyState.hidden = false;
    setSourcePanelVisible(true);
    nativePlayer.hidden = true;
    setLinks();
    return;
  }

  emptyState.hidden = true;
  setSourcePanelVisible(false);
  nativePlayer.hidden = false;
  syncImportForm();
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
    syncImportForm();
    emptyState.hidden = false;
    nativePlayer.hidden = true;
  });
}
