(() => {
  const DISPLAY_ID = "watch-end-time-display";
  const UPDATE_INTERVAL_MS = 1000;
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

  function isPrimeTimeText(text) {
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

  function formatClock(date) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(date);
  }

  function getEndTimeState(video, adapter) {
    if (!video) {
      return { label: "", isActive: false, isVisible: false };
    }

    if (adapter?.isLive?.()) {
      return { label: "", isActive: false, isVisible: false };
    }

    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      return { label: "", isActive: false, isVisible: false };
    }

    if (video.ended || video.currentTime >= video.duration) {
      return { label: "Terminé", isActive: false };
    }

    const playbackRate = video.playbackRate || 1;
    const remainingSeconds = Math.max(video.duration - video.currentTime, 0) / playbackRate;
    const endDate = new Date(Date.now() + remainingSeconds * 1000);

    return {
      label: `Fin ${formatClock(endDate)}`,
      isActive: !video.paused
    };
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
      return findBestVideo();
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
      return findBestVideo();
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

  const platformAdapters = [
    youtubeAdapter,
    netflixAdapter,
    primeVideoAdapter
  ];

  function getActiveAdapter() {
    return platformAdapters.find((adapter) => adapter.matchesHost(location.hostname));
  }

  function getCurrentVideo() {
    return getActiveAdapter()?.findVideo() || null;
  }

  function createDisplay() {
    const element = document.createElement("span");
    element.id = DISPLAY_ID;
    element.className = "watch-end-time-display";
    element.dataset.state = "inactive";
    element.title = "Heure estimée de fin, ajustée à la vitesse de lecture";
    element.textContent = "Fin --:--:--";
    return element;
  }

  function attachDisplay() {
    const adapter = getActiveAdapter();

    if (!adapter) {
      return false;
    }

    if (!displayElement || !document.contains(displayElement)) {
      displayElement = createDisplay();
    }

    const wasPlaced = adapter.renderPlacement(displayElement);

    if (!wasPlaced) {
      displayElement.hidden = true;
    }

    return wasPlaced;
  }

  function renderState(state) {
    if (!attachDisplay()) {
      return;
    }

    displayElement.hidden = state.isVisible === false;

    if (displayElement.hidden) {
      return;
    }

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
    const video = getCurrentVideo();

    attachDisplay();

    if (video) {
      bindVideoEvents(video);
    }

    updateEndTime();
  }

  function bindVideoEvents(video) {
    if (!video || activeVideo === video) {
      return;
    }

    activeVideo = video;

    VIDEO_EVENTS.forEach((eventName) => {
      video.addEventListener(eventName, updateEndTime, { passive: true });
    });
  }

  function start() {
    sync();

    if (!updateTimer) {
      updateTimer = window.setInterval(sync, UPDATE_INTERVAL_MS);
    }
  }

  start();

  window.addEventListener("yt-navigate-finish", start);
  window.addEventListener("popstate", start);
  window.addEventListener("pageshow", start);
  document.addEventListener("visibilitychange", start);
})();
