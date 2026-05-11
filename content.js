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

  function formatClock(date) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(date);
  }

  function getEndTimeState(video, adapter) {
    if (!video) {
      return { label: "Fin --:--:--", isActive: false };
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

  const platformAdapters = [youtubeAdapter];

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

    return adapter.renderPlacement(displayElement);
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
    const video = getCurrentVideo();

    attachDisplay();

    if (video) {
      bindVideoEvents(video);
    }

    updateEndTime();

    if (!updateTimer) {
      updateTimer = window.setInterval(() => {
        attachDisplay();
        updateEndTime();
      }, UPDATE_INTERVAL_MS);
    }
  }

  start();

  window.addEventListener("yt-navigate-finish", start);
  window.addEventListener("popstate", start);
})();
