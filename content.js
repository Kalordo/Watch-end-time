(() => {
  const DISPLAY_ID = "watch-end-time-display";
  const DEBUG_ID = "watch-end-time-debug";
  const UPDATE_INTERVAL_MS = 1000;
  const CONTROL_VISIBILITY_WINDOW_MS = 3000;
  const INSTANCE_CLEANUP_KEY = "__watchEndTimeCleanup";
  const VIDEO_EVENTS = [
    "durationchange",
    "emptied",
    "ended",
    "loadedmetadata",
    "pause",
    "play",
    "ratechange",
    "seeked",
    "timeupdate",
    "waiting"
  ];

  let displayElement = null;
  let updateTimer = null;
  let activeVideo = null;
  let lastUserActivityAt = Date.now();
  let activityUpdateFrame = null;
  const fullscreenRetryTimers = new Set();

  function canRunInFrame() {
    if (window.top === window) {
      return true;
    }

    return matchesDomain(location.hostname, ["vimeo.com", "dailymotion.com", "dai.ly", "twitch.tv"]);
  }

  if (!canRunInFrame()) {
    document.getElementById(DISPLAY_ID)?.remove();
    return;
  }

  window[INSTANCE_CLEANUP_KEY]?.();

  function getActivityContainer(adapter = getActiveAdapter()) {
    const video = adapter?.findVideo?.();

    if (!video) {
      return null;
    }

    if (adapter?.id === "twitch") {
      return findTwitchVideoContainer(video);
    }

    return findVideoContainer(video);
  }

  function isPointerInElement(event, element) {
    if (!element || typeof event.clientX !== "number" || typeof event.clientY !== "number") {
      return false;
    }

    const rect = element.getBoundingClientRect();

    return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  }

  function markUserActivity(event) {
    const adapter = getActiveAdapter();

    if (adapter?.hideWhenControlsInactive && event && "clientX" in event) {
      const activityContainer = getActivityContainer(adapter);

      if (!isPointerInElement(event, activityContainer)) {
        return;
      }
    }

    lastUserActivityAt = Date.now();

    if (!adapter?.hideWhenControlsInactive || activityUpdateFrame) {
      return;
    }

    activityUpdateFrame = window.requestAnimationFrame(() => {
      activityUpdateFrame = null;
      updateEndTime();
    });
  }

  function handlePointerOut(event) {
    const adapter = getActiveAdapter();

    if (adapter?.id !== "twitch") {
      return;
    }

    const activityContainer = getActivityContainer(adapter);

    if (!activityContainer || isPointerInElement(event, activityContainer)) {
      return;
    }

    lastUserActivityAt = 0;
    updateEndTime();
  }

  function hasRecentUserActivity() {
    const adapter = getActiveAdapter();
    const visibilityWindowMs = adapter?.controlVisibilityWindowMs || CONTROL_VISIBILITY_WINDOW_MS;

    return Date.now() - lastUserActivityAt < visibilityWindowMs;
  }

  function isDebugEnabled() {
    try {
      return localStorage.getItem("watchEndTimeDebug") === "1" || location.search.includes("watchEndTimeDebug=1");
    } catch (_) {
      return location.search.includes("watchEndTimeDebug=1");
    }
  }

  function isVisibleVideo(video) {
    const rect = video.getBoundingClientRect();

    return rect.width >= 120 && rect.height >= 90;
  }

  function isVisibleElement(element) {
    if (!element) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  function findBestVideo() {
    const videos = [...document.querySelectorAll("video")];

    return videos
      .filter((video) => isVisibleVideo(video))
      .sort((first, second) => {
        const firstRect = first.getBoundingClientRect();
        const secondRect = second.getBoundingClientRect();

        return secondRect.width * secondRect.height - firstRect.width * firstRect.height;
      })[0] || null;
  }

  function findPlayableVideo() {
    const videos = [...document.querySelectorAll("video")];

    return videos.find((video) => Number.isFinite(video.duration) && video.duration > 0) || videos[0] || null;
  }

  function matchesDomain(hostname, domains) {
    return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  }

  function findFirstVisible(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);

      if (isVisibleElement(element)) {
        return element;
      }
    }

    return null;
  }

  function findFirstVisibleDeep(selectors) {
    const elements = getSearchElements();

    for (const selector of selectors) {
      const element = elements.find((candidate) => candidate.matches?.(selector) && isVisibleElement(candidate));

      if (element) {
        return element;
      }
    }

    return null;
  }

  function getDirectText(element) {
    return [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent || "")
      .join(" ")
      .trim();
  }

  function isPrimeTimeText(text) {
    return /^\d{1,2}:\d{2}(?::\d{2})?\s*\/\s*\d{1,2}:\d{2}(?::\d{2})?$/.test(text.trim());
  }

  function isSlashTimeText(text) {
    return /^\d{1,2}:\d{2}(?::\d{2})?\s*\/\s*\d{1,2}:\d{2}(?::\d{2})?$/.test(text.trim());
  }

  function findPrimeTimeDisplay() {
    const elements = [...document.querySelectorAll("span, div, time")];

    return elements
      .filter((element) => isVisibleElement(element) && isPrimeTimeText(element.textContent || ""))
      .sort((first, second) => {
        const firstRect = first.getBoundingClientRect();
        const secondRect = second.getBoundingClientRect();

        return secondRect.top - firstRect.top || firstRect.left - secondRect.left;
      })[0] || null;
  }

  function findSlashTimeDisplay() {
    const elements = [...document.querySelectorAll("span, div, time")];

    return elements
      .filter((element) => isVisibleElement(element) && isSlashTimeText(element.textContent || ""))
      .sort((first, second) => {
        const firstRect = first.getBoundingClientRect();
        const secondRect = second.getBoundingClientRect();

        return secondRect.top - firstRect.top || firstRect.left - secondRect.left;
      })[0] || null;
  }

  function isSingleTimeText(text) {
    return /^\d{1,2}:\d{2}(?::\d{2})?$/.test(text.trim());
  }

  function parseClockText(text) {
    const clockText = extractClockText(text);

    if (!clockText) {
      return NaN;
    }

    const parts = clockText.split(":").map((part) => Number.parseInt(part, 10));

    if (parts.some((part) => Number.isNaN(part))) {
      return NaN;
    }

    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }

    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return NaN;
  }

  function extractClockText(text) {
    const normalizedText = text.replace(/[\u200e\u200f\u202a-\u202e]/g, "").trim();
    const matches = normalizedText.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g);

    return matches?.[matches.length - 1] || "";
  }

  function getSearchElements() {
    const elements = [];

    function collect(root) {
      const rootElements = [...root.querySelectorAll("*")];

      rootElements.forEach((element) => {
        elements.push(element);

        if (element.shadowRoot) {
          collect(element.shadowRoot);
        }
      });
    }

    collect(document);

    return elements;
  }

  function forEachSearchTextNode(callback) {
    function walk(root) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();

      while (node) {
        callback(node);
        node = walker.nextNode();
      }

      [...root.querySelectorAll("*")].forEach((element) => {
        if (element.shadowRoot) {
          walk(element.shadowRoot);
        }
      });
    }

    walk(document);
  }

  function getClockText(element) {
    const text = getDirectText(element) || (element.textContent || "").trim();

    return extractClockText(text);
  }

  function getAttributeClockText(element) {
    const attributes = ["aria-label", "aria-valuetext", "aria-description", "title"];

    for (const attribute of attributes) {
      const value = element.getAttribute(attribute) || "";
      const text = extractClockText(value);

      if (text) {
        return text;
      }
    }

    return "";
  }

  function isOwnElement(element) {
    return Boolean(element?.id === DISPLAY_ID || element?.id === DEBUG_ID || element?.closest?.(`#${DISPLAY_ID}, #${DEBUG_ID}`));
  }

  function isRightSideClockRect(rect, viewportWidth, viewportHeight) {
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.width <= 220 &&
      rect.height <= 100 &&
      rect.top >= 0 &&
      rect.bottom <= viewportHeight &&
      rect.right > viewportWidth * 0.55
    );
  }

  function isBottomLeftClockRect(rect, viewportWidth, viewportHeight) {
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.width <= 220 &&
      rect.height <= 100 &&
      rect.top > viewportHeight * 0.55 &&
      rect.left < viewportWidth * 0.35
    );
  }

  function findBottomRightTimeCandidate() {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const elements = getSearchElements();
    const candidates = [];

    elements.forEach((element) => {
      if (isOwnElement(element) || !isVisibleElement(element)) {
        return;
      }

      const text = getClockText(element) || getAttributeClockText(element);

      if (!text) {
        return;
      }

      const rect = element.getBoundingClientRect();

      if (isRightSideClockRect(rect, viewportWidth, viewportHeight)) {
        candidates.push({ element, rect, text });
      }
    });

    forEachSearchTextNode((node) => {
      const text = extractClockText(node.textContent || "");
      const element = node.parentElement;

      if (text && element && !isOwnElement(element) && isVisibleElement(element)) {
        const range = document.createRange();
        range.selectNodeContents(node);

        const rect = range.getBoundingClientRect();
        range.detach();

        if (isRightSideClockRect(rect, viewportWidth, viewportHeight)) {
          candidates.push({ element, rect, text });
        }
      }
    });

    return candidates
      .sort((first, second) => {
        const firstArea = first.rect.width * first.rect.height;
        const secondArea = second.rect.width * second.rect.height;

        return second.rect.right - first.rect.right || second.rect.bottom - first.rect.bottom || firstArea - secondArea;
      })[0] || null;
  }

  function findBottomRightTimeDisplay() {
    return findBottomRightTimeCandidate()?.element || null;
  }

  function findBottomLeftTimeDisplay() {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const elements = getSearchElements();
    const candidates = [];

    elements.forEach((element) => {
      if (isOwnElement(element) || !isVisibleElement(element)) {
        return;
      }

      const text = getClockText(element) || getAttributeClockText(element);

      if (!text) {
        return;
      }

      const rect = element.getBoundingClientRect();

      if (isBottomLeftClockRect(rect, viewportWidth, viewportHeight)) {
        candidates.push({ element, rect });
      }
    });

    return candidates
      .sort((first, second) => {
        const firstArea = first.rect.width * first.rect.height;
        const secondArea = second.rect.width * second.rect.height;

        return second.rect.bottom - first.rect.bottom || first.rect.left - second.rect.left || firstArea - secondArea;
      })[0]?.element || null;
  }

  function getVisibleBottomClockDurations() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const seen = new Set();
    const durations = [];

    getSearchElements().forEach((element) => {
      if (isOwnElement(element) || !isVisibleElement(element)) {
        return;
      }

      const text = getClockText(element) || getAttributeClockText(element);

      if (!text || seen.has(text)) {
        return;
      }

      const rect = element.getBoundingClientRect();

      if (rect.top <= viewportHeight * 0.5) {
        return;
      }

      const duration = parseClockText(text);

      if (Number.isFinite(duration)) {
        seen.add(text);
        durations.push(duration);
      }
    });

    return durations;
  }

  function getBottomRightDuration() {
    const candidate = findBottomRightTimeCandidate();

    if (!candidate) {
      return NaN;
    }

    return parseClockText(candidate.text);
  }

  function readNumericAttribute(element, attributes) {
    for (const attribute of attributes) {
      const value = Number.parseFloat(element.getAttribute(attribute) || "");

      if (Number.isFinite(value)) {
        return value;
      }
    }

    return NaN;
  }

  function getRemainingFromProgressControl() {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const controls = getSearchElements()
      .filter((element) => {
        if (isOwnElement(element) || !isVisibleElement(element)) {
          return false;
        }

        const rect = element.getBoundingClientRect();

        return (
          rect.top > viewportHeight * 0.35 &&
          rect.width > viewportWidth * 0.35 &&
          (
            element.matches('[role="slider"], input[type="range"], progress') ||
            element.hasAttribute("aria-valuenow") ||
            element.hasAttribute("aria-valuemax")
          )
        );
      })
      .sort((first, second) => {
        const firstRect = first.getBoundingClientRect();
        const secondRect = second.getBoundingClientRect();

        return secondRect.width - firstRect.width || secondRect.top - firstRect.top;
      });

    for (const control of controls) {
      const current = readNumericAttribute(control, ["aria-valuenow", "value"]);
      const total = readNumericAttribute(control, ["aria-valuemax", "max"]);

      if (Number.isFinite(current) && Number.isFinite(total) && total > 300 && current >= 0 && current < total) {
        return total - current;
      }
    }

    return NaN;
  }

  function findBottomProgressAnchor() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const elements = [
      ...document.querySelectorAll([
        '[role="slider"]',
        '[aria-valuemin][aria-valuemax]',
        "progress",
        'input[type="range"]',
        '[class*="progress"]',
        '[class*="Progress"]',
        '[class*="scrubber"]',
        '[class*="Scrubber"]',
        '[class*="seek"]',
        '[class*="Seek"]',
        '[class*="timeline"]',
        '[class*="Timeline"]',
        '[class*="slider"]',
        '[class*="Slider"]'
      ].join(","))
    ];

    const progressElement = elements
      .filter((element) => {
        if (!isVisibleElement(element)) {
          return false;
        }

        const rect = element.getBoundingClientRect();

        return rect.top > viewportHeight * 0.65 && rect.width > viewportWidth * 0.35;
      })
      .sort((first, second) => {
        const firstRect = first.getBoundingClientRect();
        const secondRect = second.getBoundingClientRect();

        return secondRect.width - firstRect.width || secondRect.top - firstRect.top;
      })[0];

    if (!progressElement) {
      return null;
    }

    return progressElement.parentElement || progressElement;
  }

  function findCommonPlayerAnchor(extraSelectors = []) {
    const timeDisplay = findSlashTimeDisplay();

    if (timeDisplay) {
      return timeDisplay;
    }

    return findFirstVisibleDeep([
      ...extraSelectors,
      ".vjs-control-bar",
      ".jw-controlbar",
      ".plyr__controls",
      ".media-control",
      '[class*="control-bar"]',
      '[class*="ControlBar"]',
      '[class*="player-controls"]',
      '[class*="PlayerControls"]'
    ]) || findBottomProgressAnchor();
  }

  function renderInlinePlayerPlacement(element, platformId, anchor) {
    if (!anchor) {
      return false;
    }

    element.dataset.platform = platformId;

    const anchorText = getDirectText(anchor) || (anchor.textContent || "").trim();

    if (isSlashTimeText(anchorText) || isSingleTimeText(anchorText)) {
      element.dataset.placement = "time";

      if (element.parentElement !== anchor.parentElement || element.previousElementSibling !== anchor) {
        anchor.insertAdjacentElement("afterend", element);
      }

      return true;
    }

    element.dataset.placement = "controls";
    anchor.classList.add("watch-end-time-anchor");

    if (element.parentElement !== anchor) {
      anchor.appendChild(element);
    }

    return true;
  }

  function renderCenteredOverlayPlacement(element, platformId, video, root = getOverlayRoot(video)) {
    const overlayRoot = root;

    element.dataset.platform = platformId;
    element.dataset.placement = "centerOverlay";
    overlayRoot.classList.add("watch-end-time-anchor");

    if (element.parentElement !== overlayRoot) {
      overlayRoot.appendChild(element);
    }

    return true;
  }

  function findTwitchVideoContainer(video) {
    if (document.fullscreenElement && document.fullscreenElement !== video) {
      return document.fullscreenElement;
    }

    const selectors = [
      '[data-a-target="video-player"]',
      '[data-a-target="player-overlay-click-handler"]',
      '[data-test-selector="video-player__video-container"]',
      ".video-player",
      ".persistent-player",
      '[class*="video-player"]',
      '[class*="persistent-player"]'
    ];

    let current = video?.parentElement || null;
    let best = null;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    while (current && current !== document.body) {
      if (selectors.some((selector) => current.matches?.(selector)) && isVisibleElement(current)) {
        return current;
      }

      const rect = current.getBoundingClientRect();

      if (isVisibleElement(current) && rect.width > viewportWidth * 0.45 && rect.height > viewportHeight * 0.3) {
        best = current;
      }

      current = current.parentElement;
    }

    return best;
  }

  function findVideoContainer(video) {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    let current = video?.parentElement || null;
    let best = null;

    while (current && current !== document.body) {
      const rect = current.getBoundingClientRect();

      if (isVisibleElement(current) && rect.width >= viewportWidth * 0.7 && rect.height >= viewportHeight * 0.7) {
        best = current;
      }

      current = current.parentElement;
    }

    if (best) {
      return best;
    }

    const candidates = [
      document.fullscreenElement,
      ...document.querySelectorAll([
        '[data-testid*="player"]',
        '[data-testid*="Player"]',
        '[class*="player"]',
        '[class*="Player"]',
        '[class*="video"]',
        '[class*="Video"]',
        "#app"
      ].join(","))
    ].filter(Boolean);

    return candidates
      .filter((element) => {
        if (!isVisibleElement(element)) {
          return false;
        }

        const rect = element.getBoundingClientRect();

        return rect.width >= viewportWidth * 0.7 && rect.height >= viewportHeight * 0.7;
      })
      .sort((first, second) => {
        const firstRect = first.getBoundingClientRect();
        const secondRect = second.getBoundingClientRect();

        return (secondRect.width * secondRect.height) - (firstRect.width * firstRect.height);
      })[0] || null;
  }

  function formatClock(date) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(date);
  }

  function getFiniteDuration(video) {
    if (Number.isFinite(video.duration) && video.duration > 0) {
      return video.duration;
    }

    const seekable = video.seekable;

    if (!seekable || seekable.length === 0) {
      return NaN;
    }

    for (let index = seekable.length - 1; index >= 0; index -= 1) {
      const end = seekable.end(index);

      if (Number.isFinite(end) && end > video.currentTime) {
        return end;
      }
    }

    return NaN;
  }

  function getEndTimeState(video, adapter) {
    if (!video) {
      return { label: "", isActive: false, isVisible: false };
    }

    if (adapter?.isLive?.()) {
      return { label: "", isActive: false, isVisible: false };
    }

    if (adapter?.hideWhenControlsInactive && !hasRecentUserActivity()) {
      return { label: "", isActive: false, isVisible: false };
    }

    const playbackRate = video.playbackRate || 1;
    const adapterRemainingSeconds = adapter?.getRemainingSeconds?.();

    if (Number.isFinite(adapterRemainingSeconds) && adapterRemainingSeconds >= 0) {
      if (video.ended || adapterRemainingSeconds === 0) {
        return { label: "Terminé", isActive: false };
      }

      const endDate = new Date(Date.now() + (adapterRemainingSeconds / playbackRate) * 1000);

      return {
        label: `Fin ${formatClock(endDate)}`,
        isActive: !video.paused
      };
    }

    if (adapter?.requiresVisibleRemainingTime) {
      return { label: "", isActive: false, isVisible: false };
    }

    const adapterDuration = adapter?.getDuration?.(video);
    const duration = Number.isFinite(adapterDuration) && adapterDuration > 0 ? adapterDuration : getFiniteDuration(video);

    if (!Number.isFinite(duration) || duration <= 0) {
      return { label: "", isActive: false, isVisible: false };
    }

    if (video.ended || video.currentTime >= duration) {
      return { label: "Terminé", isActive: false };
    }

    const remainingSeconds = Math.max(duration - video.currentTime, 0) / playbackRate;
    const endDate = new Date(Date.now() + remainingSeconds * 1000);

    return {
      label: `Fin ${formatClock(endDate)}`,
      isActive: !video.paused
    };
  }

  function renderDebug(adapter) {
    document.getElementById(DEBUG_ID)?.remove();
  }

  const youtubeAdapter = {
    id: "youtube",

    matchesHost(hostname) {
      return hostname === "www.youtube.com" || hostname === "youtube.com";
    },

    findVideo() {
      return document.querySelector("video.html5-main-video");
    },

    findTimeDisplay() {
      return document.querySelector(".ytp-time-display");
    },

    findAnchor() {
      return document.querySelector(".ytp-left-controls");
    },

    isLive() {
      const liveBadge = document.querySelector(".ytp-live-badge");

      return Boolean(liveBadge && liveBadge.offsetParent !== null);
    },

    renderPlacement(element) {
      element.dataset.platform = this.id;

      const timeDisplay = this.findTimeDisplay();

      if (!timeDisplay) {
        return false;
      }

      const controls = this.findAnchor();
      const anchor = controls?.contains(timeDisplay) ? controls : timeDisplay.parentElement;

      if (!anchor) {
        return false;
      }

      if (element.parentElement !== timeDisplay.parentElement || element.previousElementSibling !== timeDisplay) {
        timeDisplay.insertAdjacentElement("afterend", element);
      }

      return true;
    }
  };

  const netflixAdapter = {
    id: "netflix",

    matchesHost(hostname) {
      return matchesDomain(hostname, ["netflix.com"]);
    },

    findVideo() {
      return findPlayableVideo() || findBestVideo();
    },

    findAnchor() {
      return findFirstVisible([
        '[data-uia="video-title"]',
        '[data-uia="video-title-details"]',
        '[data-uia="title-metadata"]',
        ".ellipsize-text",
        '[class*="title-metadata"]',
        '[class*="video-title"]',
        '[class*="metadata"]',
        '[data-uia="player-controls-main"]',
        '[data-uia="player-controls-container"]',
        '[data-uia="controls-standard"]',
        ".watch-video--bottom-controls-container",
        ".PlayerControlsNeo__button-control-row",
        ".PlayerControlsNeo__bottom-controls",
        ".PlayerControlsNeo__controls",
        '[class*="PlayerControlsNeo__button-control-row"]',
        '[class*="PlayerControlsNeo__bottom-controls"]',
        '[class*="watch-video--bottom-controls-container"]'
      ]);
    },

    renderPlacement(element) {
      const anchor = this.findAnchor();

      if (!anchor) {
        return false;
      }

      element.dataset.platform = this.id;

      if (element.parentElement !== anchor) {
        anchor.appendChild(element);
      }

      return true;
    }
  };

  const primeVideoAdapter = {
    id: "primeVideo",

    matchesHost(hostname) {
      return matchesDomain(hostname, [
        "primevideo.com",
        "amazon.com",
        "amazon.co.uk",
        "amazon.de",
        "amazon.fr",
        "amazon.it",
        "amazon.es",
        "amazon.ca",
        "amazon.co.jp",
        "amazon.com.au",
        "amazon.in"
      ]);
    },

    findVideo() {
      return findPlayableVideo() || findBestVideo();
    },

    findAnchor() {
      const timeDisplay = findPrimeTimeDisplay();

      if (timeDisplay) {
        return timeDisplay;
      }

      return findFirstVisible([
        '[data-testid="atvwebplayersdk-bottompanel-container"]',
        '[data-testid="atvwebplayersdk-controls-container"]',
        ".atvwebplayersdk-bottompanel-container",
        ".atvwebplayersdk-controls-container",
        ".atvwebplayersdk-control-bar",
        '[class*="atvwebplayersdk-bottompanel"]',
        '[class*="atvwebplayersdk-controls"]',
        '[class*="webPlayerSDKUiContainer"]'
      ]);
    },

    renderPlacement(element) {
      const anchor = this.findAnchor();

      if (!anchor) {
        return false;
      }

      element.dataset.platform = this.id;

      if (isPrimeTimeText(anchor.textContent || "")) {
        if (element.parentElement !== anchor.parentElement || element.previousElementSibling !== anchor) {
          anchor.insertAdjacentElement("afterend", element);
        }

        return true;
      }

      if (element.parentElement !== anchor) {
        anchor.appendChild(element);
      }

      return true;
    }
  };

  const disneyPlusAdapter = {
    id: "disneyPlus",
    requiresVisibleRemainingTime: true,
    hideWhenControlsInactive: true,

    matchesHost(hostname) {
      return matchesDomain(hostname, ["disneyplus.com", "bamgrid.com", "disney-plus.net"]);
    },

    findVideo() {
      return findBestVideo();
    },

    findAnchor() {
      const footerAnchor = findFirstVisible([
        ".controls__footer",
        '[class*="controls__footer"]'
      ]);
      const controlsAnchor = findSlashTimeDisplay() || findBottomRightTimeDisplay() || footerAnchor || findBottomProgressAnchor();

      if (controlsAnchor) {
        return controlsAnchor;
      }

      if (!hasRecentUserActivity()) {
        return null;
      }

      return findVideoContainer(this.findVideo()) || document.body;
    },

    getDuration() {
      return NaN;
    },

    getRemainingSeconds() {
      const visibleRemaining = getBottomRightDuration();

      if (Number.isFinite(visibleRemaining)) {
        return visibleRemaining;
      }

      return getRemainingFromProgressControl();
    },

    renderPlacement(element) {
      const anchor = this.findAnchor();

      if (!anchor) {
        return false;
      }

      element.dataset.platform = this.id;

      const anchorText = getDirectText(anchor) || (anchor.textContent || "").trim();

      if (anchor.classList.contains("controls__footer") || String(anchor.className || "").includes("controls__footer")) {
        element.dataset.placement = "footer";
        anchor.classList.add("watch-end-time-anchor");

        if (element.parentElement !== anchor) {
          anchor.appendChild(element);
        }

        return true;
      }

      if (isSlashTimeText(anchorText) || isSingleTimeText(anchorText)) {
        element.dataset.placement = "time";

        const overlayRoot = getOverlayRoot();

        if (element.parentElement !== overlayRoot) {
          overlayRoot.appendChild(element);
        }

        return true;
      }

      if (anchor === document.body) {
        element.dataset.placement = "viewport";

        const overlayRoot = getOverlayRoot();

        if (element.parentElement !== overlayRoot) {
          overlayRoot.appendChild(element);
        }

        return true;
      }

      element.dataset.placement = "progress";
      anchor.classList.add("watch-end-time-anchor");

      if (element.parentElement !== anchor) {
        anchor.appendChild(element);
      }

      return true;
    }
  };

  const vimeoAdapter = {
    id: "vimeo",

    matchesHost(hostname) {
      return matchesDomain(hostname, ["vimeo.com"]);
    },

    findVideo() {
      return findPlayableVideo() || findBestVideo();
    },

    findAnchor() {
      return findCommonPlayerAnchor([
        ".vp-controls",
        ".vp-controls-wrapper",
        '[data-testid*="controls"]',
        '[class*="Controls_module_controls"]',
        '[class*="vp-controls"]'
      ]);
    },

    renderPlacement(element) {
      return renderInlinePlayerPlacement(element, this.id, this.findAnchor());
    }
  };

  const dailymotionAdapter = {
    id: "dailymotion",

    matchesHost(hostname) {
      return matchesDomain(hostname, ["dailymotion.com", "dai.ly"]);
    },

    findVideo() {
      return findPlayableVideo() || findBestVideo();
    },

    findAnchor() {
      return findCommonPlayerAnchor([
        '[class*="VideoControls"]',
        '[class*="videoControls"]',
        '[class*="PlayerControls"]',
        '[class*="playerControls"]'
      ]);
    },

    renderPlacement(element) {
      const video = this.findVideo();

      if (!video) {
        return false;
      }

      const videoContainer = findTwitchVideoContainer(video);

      if (!videoContainer) {
        return false;
      }

      return renderCenteredOverlayPlacement(element, this.id, video, videoContainer);
    }
  };

  const twitchAdapter = {
    id: "twitch",
    hideWhenControlsInactive: true,
    controlVisibilityWindowMs: 4000,
    lastDuration: NaN,

    matchesHost(hostname) {
      return matchesDomain(hostname, ["twitch.tv"]);
    },

    findVideo() {
      return findBestVideo() || findPlayableVideo();
    },

    isLive() {
      if (location.pathname.includes("/videos/") || location.hostname.startsWith("clips.")) {
        return false;
      }

      const liveBadge = document.querySelector('[data-a-target="player-live-badge"]');

      return Boolean(liveBadge && isVisibleElement(liveBadge));
    },

    findAnchor() {
      return findBottomLeftTimeDisplay() || findCommonPlayerAnchor([
        '[data-a-target="player-controls"]',
        '[data-a-target="player-seekbar"]',
        '[data-a-target="player-overlay-click-handler"]',
        ".player-controls",
        '[class*="player-controls"]'
      ]);
    },

    getDuration(video) {
      const currentTime = video?.currentTime || 0;
      const visibleDurations = getVisibleBottomClockDurations()
        .filter((duration) => duration > currentTime + 5)
        .sort((first, second) => second - first);

      if (visibleDurations[0]) {
        this.lastDuration = visibleDurations[0];
        return this.lastDuration;
      }

      if (Number.isFinite(this.lastDuration) && this.lastDuration > currentTime + 5) {
        return this.lastDuration;
      }

      return NaN;
    },

    renderPlacement(element) {
      const video = this.findVideo();

      if (!video) {
        return false;
      }

      const videoContainer = findTwitchVideoContainer(video);

      if (!videoContainer) {
        return false;
      }

      return renderCenteredOverlayPlacement(element, this.id, video, videoContainer);
    }
  };

  const platformAdapters = [
    youtubeAdapter,
    netflixAdapter,
    primeVideoAdapter,
    disneyPlusAdapter,
    vimeoAdapter,
    dailymotionAdapter,
    twitchAdapter
  ];

  function getActiveAdapter() {
    return platformAdapters.find((adapter) => adapter.matchesHost(location.hostname));
  }

  function getCurrentVideo() {
    return getActiveAdapter()?.findVideo() || null;
  }

  function getOverlayRoot(video = null) {
    const fullscreenElement = document.fullscreenElement;

    if (fullscreenElement && fullscreenElement.tagName !== "VIDEO") {
      return fullscreenElement;
    }

    return findVideoContainer(video) || document.body;
  }

  function removeDuplicateDisplays(keepElement = null) {
    const displays = new Set([
      ...document.querySelectorAll(`#${DISPLAY_ID}`),
      ...getSearchElements().filter((element) => element.id === DISPLAY_ID)
    ]);

    displays.forEach((element) => {
      if (element !== keepElement) {
        element.remove();
      }
    });
  }

  function createDisplay() {
    removeDuplicateDisplays();

    const element = document.createElement("span");
    element.id = DISPLAY_ID;
    element.className = "watch-end-time-display";
    element.dataset.state = "inactive";
    element.title = "Heure estimée de fin, ajustée à la vitesse de lecture";
    element.textContent = "";
    element.hidden = true;
    return element;
  }

  function attachDisplay() {
    const adapter = getActiveAdapter();

    if (!adapter) {
      return false;
    }

    if (!displayElement || !displayElement.isConnected) {
      displayElement = createDisplay();
    }

    removeDuplicateDisplays(displayElement);

    const wasPlaced = adapter.renderPlacement(displayElement);

    if (!wasPlaced) {
      displayElement.remove();
      displayElement.hidden = true;
    }

    return wasPlaced;
  }

  function renderState(state) {
    if (state.isVisible === false || !state.label) {
      if (displayElement) {
        displayElement.remove();
        displayElement.hidden = true;
      }

      return;
    }

    if (!attachDisplay()) {
      return;
    }

    displayElement.hidden = false;

    if (displayElement.textContent !== state.label) {
      displayElement.textContent = state.label;
    }

    displayElement.dataset.state = state.isActive ? "active" : "inactive";
  }

  function updateEndTime() {
    const adapter = getActiveAdapter();

    renderState(getEndTimeState(adapter?.findVideo() || null, adapter));
  }

  function sync() {
    const adapter = getActiveAdapter();
    const video = adapter?.findVideo() || null;

    renderDebug(adapter);

    if (video) {
      bindVideoEvents(video);
    }

    renderState(getEndTimeState(video, adapter));
  }

  function bindVideoEvents(video) {
    if (!video || activeVideo === video) {
      return;
    }

    if (activeVideo) {
      VIDEO_EVENTS.forEach((eventName) => {
        activeVideo.removeEventListener(eventName, updateEndTime);
      });
    }

    activeVideo = video;

    VIDEO_EVENTS.forEach((eventName) => {
      video.addEventListener(eventName, updateEndTime, { passive: true });
    });
  }

  function start() {
    removeDuplicateDisplays(displayElement);
    sync();

    if (!updateTimer) {
      updateTimer = window.setInterval(sync, UPDATE_INTERVAL_MS);
    }
  }

  function scheduleSync(delayMs) {
    const timer = window.setTimeout(() => {
      fullscreenRetryTimers.delete(timer);
      sync();
    }, delayMs);

    fullscreenRetryTimers.add(timer);
  }

  function handleFullscreenChange() {
    if (displayElement) {
      displayElement.remove();
      displayElement = null;
    }

    lastUserActivityAt = Date.now();
    sync();
    scheduleSync(250);
    scheduleSync(1000);
  }

  function cleanup() {
    if (updateTimer) {
      window.clearInterval(updateTimer);
      updateTimer = null;
    }

    fullscreenRetryTimers.forEach((timer) => window.clearTimeout(timer));
    fullscreenRetryTimers.clear();

    if (activityUpdateFrame) {
      window.cancelAnimationFrame(activityUpdateFrame);
      activityUpdateFrame = null;
    }

    if (activeVideo) {
      VIDEO_EVENTS.forEach((eventName) => {
        activeVideo.removeEventListener(eventName, updateEndTime);
      });
      activeVideo = null;
    }

    removeDuplicateDisplays();
    document.getElementById(DEBUG_ID)?.remove();
    window.removeEventListener("yt-navigate-finish", start);
    window.removeEventListener("popstate", start);
    window.removeEventListener("pageshow", start);
    window.removeEventListener("mousemove", markUserActivity);
    window.removeEventListener("mouseout", handlePointerOut);
    window.removeEventListener("mousedown", markUserActivity);
    window.removeEventListener("touchstart", markUserActivity);
    window.removeEventListener("keydown", markUserActivity);
    document.removeEventListener("visibilitychange", start);
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }

  window[INSTANCE_CLEANUP_KEY] = cleanup;

  start();

  window.addEventListener("yt-navigate-finish", start);
  window.addEventListener("popstate", start);
  window.addEventListener("pageshow", start);
  window.addEventListener("mousemove", markUserActivity, { passive: true });
  window.addEventListener("mouseout", handlePointerOut, { passive: true });
  window.addEventListener("mousedown", markUserActivity, { passive: true });
  window.addEventListener("touchstart", markUserActivity, { passive: true });
  window.addEventListener("keydown", markUserActivity);
  document.addEventListener("visibilitychange", start);
  document.addEventListener("fullscreenchange", handleFullscreenChange);
})();
