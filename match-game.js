document.addEventListener("DOMContentLoaded", function () {
  const host = document.querySelector("#content");
  const galleryImgs = [...document.querySelectorAll("#gallery .grid-item img")];
  if (!host || galleryImgs.length < 6) return;

  const STORAGE_KEYS = {
    settings: "fp_settings_v5",
    leaderboard: "fp_lb_v5"
  };

  const DEFAULTS = {
    playerName: "",
    autoBackTimer: 0,
    roundTimerId: 0,
    idleRefreshTimerId: 0,
    firstCard: null,
    lockBoard: false,
    roundStartedAt: 0,
    deck: [],
    matchedPairs: 0,
    idlePreview: true,
    startPreview: true,
    winTarget: 1,
    startCountdown: 3,
    roundTime: 20,
    idleRefreshSeconds: 30,
    cardCount: 12,
    gameActive: false,
    adminUnlocked: false,
    adminPin: "1111",
    theme: {
      bg: "#0F1115",
      accent: "#FFFFFF",
      accentText: "#111111",
      card: "#151821",
      panel: "#1C1F27"
    },
    logoUrl: "https://theboothkit.com/wp-content/uploads/2026/02/Site-Logo.png",
    headerLogoUrl: "",
    bgImageUrl: ""
  };

  const state = JSON.parse(JSON.stringify(DEFAULTS));

  const app = document.createElement("div");
  app.id = "fp-game";
  app.innerHTML =
    '<div id="fp-wrap">' +
      '<div id="fp-top">' +
        '<div id="fp-brand">' +
          '<div id="fp-header-logo-wrap" class="hidden"><img id="fp-header-logo" alt="Header Logo"></div>' +
          '<div>' +
            '<div id="fp-title">Find the Match</div>' +
            '<div id="fp-player"></div>' +
          '</div>' +
        '</div>' +
        '<div id="fp-top-right">' +
          '<div id="fp-timer">20</div>' +
          '<button id="fp-admin" type="button" aria-label="Admin Settings">⚙</button>' +
        '</div>' +
      '</div>' +

      '<div id="fp-board-shell">' +
        '<div id="fp-board"></div>' +
        '<div id="fp-board-center-lane" aria-hidden="true"></div>' +
        '<button id="fp-play" type="button">Play</button>' +
      '</div>' +

      '<div id="fp-center" class="hidden">' +
        '<div id="fp-center-backdrop"></div>' +
        '<div id="fp-card">' +
          '<h2 id="fp-head">Find the Match</h2>' +
          '<p id="fp-copy">Enter your name, then tap start.</p>' +
          '<div id="fp-name">ENTER NAME</div>' +
          '<div id="fp-keys"></div>' +
          '<div id="fp-entry-actions">' +
            '<button id="fp-cancel" type="button" class="fp-secondary-action">Cancel</button>' +
            '<button id="fp-start" disabled>Tap to Start</button>' +
          '</div>' +
          '<button id="fp-replay" class="hidden">Start Over</button>' +
          '<div id="fp-leaderboard"></div>' +
        '</div>' +
      '</div>' +

      '<div id="fp-countdown" class="hidden">3</div>' +

      '<div id="fp-admin-modal" class="hidden">' +
        '<div id="fp-admin-backdrop"></div>' +
        '<div id="fp-admin-panel">' +

          '<div id="fp-admin-lock">' +
            '<div class="fp-admin-title">Admin Settings</div>' +
            '<p class="fp-admin-sub">Enter PIN to unlock settings.</p>' +
            '<input id="fp-admin-pin" type="password" inputmode="numeric" placeholder="PIN">' +
            '<div class="fp-admin-actions">' +
              '<button id="fp-admin-unlock" type="button">Unlock</button>' +
              '<button id="fp-admin-close-lock" type="button" class="fp-admin-secondary">Close</button>' +
            '</div>' +
          '</div>' +

          '<div id="fp-admin-ui" class="hidden">' +
            '<div class="fp-admin-header">' +
              '<div>' +
                '<div class="fp-admin-title">Admin Settings</div>' +
                '<p class="fp-admin-sub">Adjust gameplay, visuals, assets, refresh behavior, and security.</p>' +
              '</div>' +
              '<button id="fp-admin-close" type="button" class="fp-admin-icon">✕</button>' +
            '</div>' +

            '<div class="fp-admin-grid">' +

              '<div class="fp-admin-section">' +
                '<h3>Gameplay</h3>' +
                '<label class="fp-admin-label">Win Target</label>' +
                '<div id="fp-win-targets" class="fp-chip-group">' +
                  '<button type="button" class="fp-chip" data-win="1">1 Match</button>' +
                  '<button type="button" class="fp-chip" data-win="2">2 Matches</button>' +
                  '<button type="button" class="fp-chip" data-win="3">3 Matches</button>' +
                  '<button type="button" class="fp-chip" data-win="4">4 Matches</button>' +
                  '<button type="button" class="fp-chip" data-win="all">All</button>' +
                '</div>' +

                '<div class="fp-admin-row-3">' +
                  '<div>' +
                    '<label class="fp-admin-label" for="fp-setting-countdown">Countdown</label>' +
                    '<input id="fp-setting-countdown" class="fp-admin-number" type="number" min="0" max="10" step="1">' +
                  '</div>' +
                  '<div>' +
                    '<label class="fp-admin-label" for="fp-setting-timer">Round Timer</label>' +
                    '<input id="fp-setting-timer" class="fp-admin-number" type="number" min="5" max="120" step="1">' +
                  '</div>' +
                  '<div>' +
                    '<label class="fp-admin-label" for="fp-setting-idle-refresh">Idle Refresh (sec)</label>' +
                    '<input id="fp-setting-idle-refresh" class="fp-admin-number" type="number" min="0" max="600" step="1">' +
                  '</div>' +
                '</div>' +

                '<label class="fp-admin-label fp-admin-label-top">Card Layout</label>' +
                '<div id="fp-card-counts" class="fp-chip-group">' +
                  '<button type="button" class="fp-chip" data-card-count="6">6 Cards</button>' +
                  '<button type="button" class="fp-chip" data-card-count="8">8 Cards</button>' +
                  '<button type="button" class="fp-chip" data-card-count="10">10 Cards</button>' +
                  '<button type="button" class="fp-chip" data-card-count="12">12 Cards</button>' +
                  '<button type="button" class="fp-chip" data-card-count="16">16 Cards</button>' +
                '</div>' +

                '<div class="fp-toggle-row">' +
                  '<label class="fp-toggle">' +
                    '<input id="fp-setting-idle-preview" type="checkbox">' +
                    '<span>Idle photo preview</span>' +
                  '</label>' +
                  '<label class="fp-toggle">' +
                    '<input id="fp-setting-start-preview" type="checkbox">' +
                    '<span>Start photo preview</span>' +
                  '</label>' +
                '</div>' +
              '</div>' +

              '<div class="fp-admin-section">' +
                '<h3>Theme Presets</h3>' +
                '<div class="fp-chip-group">' +
                  '<button type="button" class="fp-chip fp-preset" data-preset="dark">Dark Default</button>' +
                  '<button type="button" class="fp-chip fp-preset" data-preset="purple">BoothKit Purple</button>' +
                  '<button type="button" class="fp-chip fp-preset" data-preset="gold">Gold Luxe</button>' +
                '</div>' +
              '</div>' +

              '<div class="fp-admin-section">' +
                '<h3>Brand Assets</h3>' +

                '<label class="fp-admin-label" for="fp-header-logo-upload">Header Logo Upload</label>' +
                '<input id="fp-header-logo-upload" type="file" accept="image/*" class="fp-admin-file">' +
                '<div id="fp-header-logo-status" class="fp-admin-note">No custom header logo loaded.</div>' +
                '<div class="fp-admin-actions">' +
                  '<button id="fp-remove-header-logo" type="button" class="fp-admin-secondary">Remove Header Logo</button>' +
                '</div>' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-logo-upload">Card Back Logo Upload</label>' +
                '<input id="fp-logo-upload" type="file" accept="image/*" class="fp-admin-file">' +
                '<div id="fp-logo-status" class="fp-admin-note">Using current saved card-back logo.</div>' +
                '<div class="fp-admin-actions">' +
                  '<button id="fp-remove-logo" type="button" class="fp-admin-secondary">Remove Card Back Logo</button>' +
                '</div>' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-bg-upload">Background Image Upload</label>' +
                '<input id="fp-bg-upload" type="file" accept="image/*" class="fp-admin-file">' +
                '<div id="fp-bg-status" class="fp-admin-note">Using color background only.</div>' +
                '<div class="fp-admin-actions">' +
                  '<button id="fp-remove-bg" type="button" class="fp-admin-secondary">Remove Background Image</button>' +
                '</div>' +
              '</div>' +

              '<div class="fp-admin-section">' +
                '<h3>Security</h3>' +
                '<label class="fp-admin-label" for="fp-current-pin">Current PIN</label>' +
                '<input id="fp-current-pin" class="fp-admin-text" type="password" inputmode="numeric" placeholder="Enter current PIN">' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-new-pin">New PIN</label>' +
                '<input id="fp-new-pin" class="fp-admin-text" type="password" inputmode="numeric" placeholder="Enter new PIN">' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-confirm-pin">Confirm New PIN</label>' +
                '<input id="fp-confirm-pin" class="fp-admin-text" type="password" inputmode="numeric" placeholder="Confirm new PIN">' +

                '<div class="fp-admin-actions">' +
                  '<button id="fp-save-pin" type="button">Change PIN</button>' +
                '</div>' +
                '<div id="fp-pin-status" class="fp-admin-note"></div>' +
              '</div>' +

              '<div class="fp-admin-section fp-admin-section-full">' +
                '<h3>Custom Colors</h3>' +

                '<div class="fp-color-grid">' +
                  '<div class="fp-color-row">' +
                    '<label>Background</label>' +
                    '<input type="color" id="fp-color-bg-picker">' +
                    '<input type="text" id="fp-color-bg-text" class="fp-admin-text" placeholder="#0F1115">' +
                  '</div>' +

                  '<div class="fp-color-row">' +
                    '<label>Accent / Buttons</label>' +
                    '<input type="color" id="fp-color-accent-picker">' +
                    '<input type="text" id="fp-color-accent-text" class="fp-admin-text" placeholder="#FFFFFF">' +
                  '</div>' +

                  '<div class="fp-color-row">' +
                    '<label>Accent Text</label>' +
                    '<input type="color" id="fp-color-accent-text-picker">' +
                    '<input type="text" id="fp-color-accent-text-text" class="fp-admin-text" placeholder="#111111">' +
                  '</div>' +

                  '<div class="fp-color-row">' +
                    '<label>Card Front</label>' +
                    '<input type="color" id="fp-color-card-picker">' +
                    '<input type="text" id="fp-color-card-text" class="fp-admin-text" placeholder="#151821">' +
                  '</div>' +

                  '<div class="fp-color-row">' +
                    '<label>Popup Panel</label>' +
                    '<input type="color" id="fp-color-panel-picker">' +
                    '<input type="text" id="fp-color-panel-text" class="fp-admin-text" placeholder="#1C1F27">' +
                  '</div>' +
                '</div>' +

                '<div class="fp-admin-actions fp-admin-actions-wrap">' +
                  '<button id="fp-apply-theme" type="button">Apply Colors</button>' +
                  '<button id="fp-reset-theme" type="button" class="fp-admin-secondary">Reset Theme</button>' +
                  '<button id="fp-reset-leaderboard" type="button" class="fp-admin-danger">Reset Leaderboard</button>' +
                  '<button id="fp-reset-all" type="button" class="fp-admin-danger">Reset All Settings</button>' +
                '</div>' +
              '</div>' +

            '</div>' +
          '</div>' +

        '</div>' +
      '</div>' +
    '</div>';

  host.appendChild(app);

  const el = {
    boardShell: app.querySelector("#fp-board-shell"),
    board: app.querySelector("#fp-board"),
    boardCenterLane: app.querySelector("#fp-board-center-lane"),
    timer: app.querySelector("#fp-timer"),
    center: app.querySelector("#fp-center"),
    centerBackdrop: app.querySelector("#fp-center-backdrop"),
    head: app.querySelector("#fp-head"),
    copy: app.querySelector("#fp-copy"),
    start: app.querySelector("#fp-start"),
    cancel: app.querySelector("#fp-cancel"),
    replay: app.querySelector("#fp-replay"),
    play: app.querySelector("#fp-play"),
    countdown: app.querySelector("#fp-countdown"),
    name: app.querySelector("#fp-name"),
    keys: app.querySelector("#fp-keys"),
    player: app.querySelector("#fp-player"),

    headerLogoWrap: app.querySelector("#fp-header-logo-wrap"),
    headerLogo: app.querySelector("#fp-header-logo"),

    adminButton: app.querySelector("#fp-admin"),
    leaderboard: app.querySelector("#fp-leaderboard"),

    adminModal: app.querySelector("#fp-admin-modal"),
    adminBackdrop: app.querySelector("#fp-admin-backdrop"),
    adminLock: app.querySelector("#fp-admin-lock"),
    adminUI: app.querySelector("#fp-admin-ui"),
    adminPin: app.querySelector("#fp-admin-pin"),
    adminUnlock: app.querySelector("#fp-admin-unlock"),
    adminCloseLock: app.querySelector("#fp-admin-close-lock"),
    adminClose: app.querySelector("#fp-admin-close"),

    winTargets: [...app.querySelectorAll("[data-win]")],
    cardCountButtons: [...app.querySelectorAll("[data-card-count]")],
    countdownInput: app.querySelector("#fp-setting-countdown"),
    roundTimerInput: app.querySelector("#fp-setting-timer"),
    idleRefreshInput: app.querySelector("#fp-setting-idle-refresh"),
    idlePreviewInput: app.querySelector("#fp-setting-idle-preview"),
    startPreviewInput: app.querySelector("#fp-setting-start-preview"),
    presetButtons: [...app.querySelectorAll(".fp-preset")],

    bgPicker: app.querySelector("#fp-color-bg-picker"),
    bgText: app.querySelector("#fp-color-bg-text"),
    accentPicker: app.querySelector("#fp-color-accent-picker"),
    accentText: app.querySelector("#fp-color-accent-text"),
    accentTextPicker: app.querySelector("#fp-color-accent-text-picker"),
    accentTextText: app.querySelector("#fp-color-accent-text-text"),
    cardPicker: app.querySelector("#fp-color-card-picker"),
    cardText: app.querySelector("#fp-color-card-text"),
    panelPicker: app.querySelector("#fp-color-panel-picker"),
    panelText: app.querySelector("#fp-color-panel-text"),

    applyTheme: app.querySelector("#fp-apply-theme"),
    resetTheme: app.querySelector("#fp-reset-theme"),
    resetLeaderboard: app.querySelector("#fp-reset-leaderboard"),
    resetAll: app.querySelector("#fp-reset-all"),

    logoUpload: app.querySelector("#fp-logo-upload"),
    logoStatus: app.querySelector("#fp-logo-status"),
    removeLogo: app.querySelector("#fp-remove-logo"),

    headerLogoUpload: app.querySelector("#fp-header-logo-upload"),
    headerLogoStatus: app.querySelector("#fp-header-logo-status"),
    removeHeaderLogo: app.querySelector("#fp-remove-header-logo"),

    bgUpload: app.querySelector("#fp-bg-upload"),
    bgStatus: app.querySelector("#fp-bg-status"),
    removeBg: app.querySelector("#fp-remove-bg"),

    currentPin: app.querySelector("#fp-current-pin"),
    newPin: app.querySelector("#fp-new-pin"),
    confirmPin: app.querySelector("#fp-confirm-pin"),
    savePin: app.querySelector("#fp-save-pin"),
    pinStatus: app.querySelector("#fp-pin-status")
  };

  function shuffle(arr) {
    for (let idx = arr.length - 1; idx > 0; idx--) {
      const rand = Math.floor(Math.random() * (idx + 1));
      [arr[idx], arr[rand]] = [arr[rand], arr[idx]];
    }
    return arr;
  }

  function getScores() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.leaderboard) || "[]");
  }

  function renderLeaderboard() {
    const scores = getScores();
    if (!scores.length) {
      el.leaderboard.innerHTML = "";
      return;
    }

    let html = "<h3>Leaderboard</h3>";
    scores.forEach(function (item, index) {
      html += "<div>" + (index + 1) + ". " + item.n + " – " + item.t.toFixed(2) + "s</div>";
    });
    el.leaderboard.innerHTML = html;
  }

  function saveScore(name, time) {
    let scores = getScores();
    scores.push({ n: name, t: time });
    scores.sort(function (a, b) { return a.t - b.t; });
    scores = scores.slice(0, 5);
    localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(scores));
    renderLeaderboard();
  }

  function clearLeaderboard() {
    localStorage.removeItem(STORAGE_KEYS.leaderboard);
    renderLeaderboard();
  }

  function hexToRgb(hex) {
    const clean = hex.replace("#", "").trim();
    const normalized = clean.length === 3
      ? clean.split("").map(function (c) { return c + c; }).join("")
      : clean;
    const intVal = parseInt(normalized, 16);
    return {
      r: (intVal >> 16) & 255,
      g: (intVal >> 8) & 255,
      b: intVal & 255
    };
  }

  function hexToRgba(hex, alpha) {
    const rgb = hexToRgb(hex);
    return "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + alpha + ")";
  }

  function isValidHex(value) {
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test((value || "").trim());
  }

  function normalizeHex(value, fallback) {
    const trimmed = (value || "").trim();
    if (!isValidHex(trimmed)) return fallback;
    if (trimmed.length === 4) {
      return (
        "#" +
        trimmed[1] + trimmed[1] +
        trimmed[2] + trimmed[2] +
        trimmed[3] + trimmed[3]
      ).toUpperCase();
    }
    return trimmed.toUpperCase();
  }

  function escapeForCssUrl(value) {
    return String(value).replace(/"/g, '\\"');
  }

  function persistSettings() {
    const payload = {
      winTarget: state.winTarget,
      startCountdown: state.startCountdown,
      roundTime: state.roundTime,
      idleRefreshSeconds: state.idleRefreshSeconds,
      cardCount: state.cardCount,
      idlePreview: state.idlePreview,
      startPreview: state.startPreview,
      adminPin: state.adminPin,
      theme: state.theme,
      logoUrl: state.logoUrl,
      headerLogoUrl: state.headerLogoUrl,
      bgImageUrl: state.bgImageUrl
    };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(payload));
  }

  function loadSettings() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || "null");
    if (!saved) return;

    if (saved.winTarget === "all" || [1, 2, 3, 4].indexOf(saved.winTarget) > -1) {
      state.winTarget = saved.winTarget;
    }
    if (typeof saved.startCountdown === "number") {
      state.startCountdown = Math.max(0, Math.min(10, saved.startCountdown));
    }
    if (typeof saved.roundTime === "number") {
      state.roundTime = Math.max(5, Math.min(120, saved.roundTime));
    }
    if (typeof saved.idleRefreshSeconds === "number") {
      state.idleRefreshSeconds = Math.max(0, Math.min(600, saved.idleRefreshSeconds));
    }
    if ([6, 8, 10, 12, 16].indexOf(saved.cardCount) > -1) {
      state.cardCount = saved.cardCount;
    }
    if (typeof saved.idlePreview === "boolean") state.idlePreview = saved.idlePreview;
    if (typeof saved.startPreview === "boolean") state.startPreview = saved.startPreview;
    if (typeof saved.adminPin === "string" && saved.adminPin.trim()) state.adminPin = saved.adminPin.trim();

    if (saved.theme && typeof saved.theme === "object") {
      state.theme = {
        bg: normalizeHex(saved.theme.bg, DEFAULTS.theme.bg),
        accent: normalizeHex(saved.theme.accent, DEFAULTS.theme.accent),
        accentText: normalizeHex(saved.theme.accentText, DEFAULTS.theme.accentText),
        card: normalizeHex(saved.theme.card, DEFAULTS.theme.card),
        panel: normalizeHex(saved.theme.panel, DEFAULTS.theme.panel)
      };
    }

    if (typeof saved.logoUrl === "string" && saved.logoUrl.trim()) {
      state.logoUrl = saved.logoUrl;
    }
    if (typeof saved.headerLogoUrl === "string") {
      state.headerLogoUrl = saved.headerLogoUrl;
    }
    if (typeof saved.bgImageUrl === "string") {
      state.bgImageUrl = saved.bgImageUrl;
    }
  }

  function applyLogo(url) {
    state.logoUrl = url || DEFAULTS.logoUrl;
    app.style.setProperty("--fp-logo-url", 'url("' + escapeForCssUrl(state.logoUrl) + '")');
    el.logoStatus.textContent = state.logoUrl === DEFAULTS.logoUrl
      ? "Using default card-back logo."
      : "Custom card-back logo loaded and saved.";
  }

  function applyHeaderLogo(url) {
    state.headerLogoUrl = url || "";
    if (state.headerLogoUrl) {
      el.headerLogo.src = state.headerLogoUrl;
      el.headerLogoWrap.classList.remove("hidden");
      el.headerLogoStatus.textContent = "Custom header logo loaded and saved.";
    } else {
      el.headerLogo.removeAttribute("src");
      el.headerLogoWrap.classList.add("hidden");
      el.headerLogoStatus.textContent = "No custom header logo loaded.";
    }
  }

  function applyBackgroundImage(url) {
    state.bgImageUrl = url || "";
    if (state.bgImageUrl) {
      app.style.setProperty("--fp-bg-image", 'url("' + escapeForCssUrl(state.bgImageUrl) + '")');
      el.bgStatus.textContent = "Custom background image loaded and saved.";
    } else {
      app.style.setProperty("--fp-bg-image", "none");
      el.bgStatus.textContent = "Using color background only.";
    }
  }

  function applyThemeColors(colors) {
    const bg = normalizeHex(colors.bg, DEFAULTS.theme.bg);
    const accent = normalizeHex(colors.accent, DEFAULTS.theme.accent);
    const accentText = normalizeHex(colors.accentText, DEFAULTS.theme.accentText);
    const card = normalizeHex(colors.card, DEFAULTS.theme.card);
    const panel = normalizeHex(colors.panel, DEFAULTS.theme.panel);

    state.theme = {
      bg: bg,
      accent: accent,
      accentText: accentText,
      card: card,
      panel: panel
    };

    app.style.setProperty("--fp-bg", bg);
    app.style.setProperty("--fp-text", "#FFFFFF");
    app.style.setProperty("--fp-panel", hexToRgba(panel, 0.88));
    app.style.setProperty("--fp-panel-border", hexToRgba(panel, 1));
    app.style.setProperty("--fp-panel-solid", panel);
    app.style.setProperty("--fp-card-front", card);
    app.style.setProperty("--fp-card-front-border", hexToRgba("#FFFFFF", 0.1));
    app.style.setProperty("--fp-chip-bg", hexToRgba("#FFFFFF", 0.1));
    app.style.setProperty("--fp-chip-border", hexToRgba("#FFFFFF", 0.18));
    app.style.setProperty("--fp-overlay", hexToRgba(bg, 0.48));
    app.style.setProperty("--fp-countdown-overlay", hexToRgba(bg, 0.72));
    app.style.setProperty("--fp-key-bg", hexToRgba("#FFFFFF", 0.08));
    app.style.setProperty("--fp-key-border", hexToRgba("#FFFFFF", 0.14));
    app.style.setProperty("--fp-accent", accent);
    app.style.setProperty("--fp-accent-text", accentText);
    app.style.setProperty("--fp-match-ring", hexToRgba(accent, 0.95));
    app.style.setProperty("--fp-match-glow", hexToRgba(accent, 0.45));

    syncColorInputsFromTheme();
    persistSettings();
  }

  function applyThemePreset(name) {
    if (name === "dark") {
      applyThemeColors({
        bg: "#0F1115",
        accent: "#FFFFFF",
        accentText: "#111111",
        card: "#151821",
        panel: "#1C1F27"
      });
    } else if (name === "purple") {
      applyThemeColors({
        bg: "#0D1320",
        accent: "#6852F4",
        accentText: "#FFFFFF",
        card: "#11182B",
        panel: "#1A2040"
      });
    } else if (name === "gold") {
      applyThemeColors({
        bg: "#101010",
        accent: "#D4AF37",
        accentText: "#111111",
        card: "#171717",
        panel: "#23201A"
      });
    }
  }

  function syncColorInputsFromTheme() {
    el.bgPicker.value = state.theme.bg;
    el.bgText.value = state.theme.bg;
    el.accentPicker.value = state.theme.accent;
    el.accentText.value = state.theme.accent;
    el.accentTextPicker.value = state.theme.accentText;
    el.accentTextText.value = state.theme.accentText;
    el.cardPicker.value = state.theme.card;
    el.cardText.value = state.theme.card;
    el.panelPicker.value = state.theme.panel;
    el.panelText.value = state.theme.panel;
  }

  function updateSettingsUI() {
    el.winTargets.forEach(function (btn) {
      btn.classList.toggle("active", String(state.winTarget) === btn.getAttribute("data-win"));
    });

    el.cardCountButtons.forEach(function (btn) {
      btn.classList.toggle("active", String(state.cardCount) === btn.getAttribute("data-card-count"));
    });

    el.countdownInput.value = state.startCountdown;
    el.roundTimerInput.value = state.roundTime;
    el.idleRefreshInput.value = state.idleRefreshSeconds;
    el.idlePreviewInput.checked = state.idlePreview;
    el.startPreviewInput.checked = state.startPreview;
    syncColorInputsFromTheme();

    el.logoStatus.textContent = state.logoUrl === DEFAULTS.logoUrl
      ? "Using default card-back logo."
      : "Custom card-back logo loaded and saved.";
    el.headerLogoStatus.textContent = state.headerLogoUrl
      ? "Custom header logo loaded and saved."
      : "No custom header logo loaded.";
    el.bgStatus.textContent = state.bgImageUrl
      ? "Custom background image loaded and saved."
      : "Using color background only.";

    el.currentPin.value = "";
    el.newPin.value = "";
    el.confirmPin.value = "";
    el.pinStatus.textContent = "";
  }

  function openAdmin() {
    el.adminModal.classList.remove("hidden");
    el.adminLock.classList.remove("hidden");
    el.adminUI.classList.add("hidden");
    el.adminPin.value = "";
    setTimeout(function () {
      el.adminPin.focus();
    }, 10);
  }

  function closeAdmin() {
    state.adminUnlocked = false;
    el.adminModal.classList.add("hidden");
    el.adminLock.classList.remove("hidden");
    el.adminUI.classList.add("hidden");
    el.adminPin.value = "";
  }

  function unlockAdmin() {
    if (el.adminPin.value === state.adminPin) {
      state.adminUnlocked = true;
      el.adminLock.classList.add("hidden");
      el.adminUI.classList.remove("hidden");
      updateSettingsUI();
    } else {
      el.adminPin.value = "";
      el.adminPin.placeholder = "Incorrect PIN";
    }
  }

  function getGridForCount(count) {
    if (window.innerWidth <= 640) {
      if (count === 6) return { cols: 3, rows: 2 };
      if (count === 8) return { cols: 4, rows: 2 };
      if (count === 10) return { cols: 5, rows: 2 };
      if (count === 12) return { cols: 3, rows: 4 };
      return { cols: 4, rows: 4 };
    }

    if (count === 6) return { cols: 3, rows: 2 };
    if (count === 8) return { cols: 4, rows: 2 };
    if (count === 10) return { cols: 5, rows: 2 };
    if (count === 12) return { cols: 4, rows: 3 };
    return { cols: 4, rows: 4 };
  }

  function updateBoardShellMode() {
    el.boardShell.classList.toggle("play-mode", !state.gameActive && el.center.classList.contains("hidden"));
    el.boardShell.classList.toggle("entry-open", !el.center.classList.contains("hidden"));
  }

  function applyBoardLayout() {
    const grid = getGridForCount(state.cardCount);
    el.board.style.gridTemplateColumns = "repeat(" + grid.cols + ", 1fr)";
    el.board.style.gridTemplateRows = "repeat(" + grid.rows + ", 1fr)";
    el.board.setAttribute("data-card-count", String(state.cardCount));
  }

  async function buildDeck() {
    const cacheBust = (location.href.indexOf("?") > -1 ? "&" : "?") + "t=" + Date.now();
    const html = await fetch(location.href + cacheBust, { cache: "no-store" })
      .then(function (response) { return response.text(); });

    const doc = new DOMParser().parseFromString(html, "text/html");
    const urls = [
      ...new Set(
        [...doc.querySelectorAll("#gallery .grid-item img")].map(function (img) {
          return img.src;
        }).filter(Boolean)
      )
    ];

    const pairCount = state.cardCount / 2;
    shuffle(urls);
    const chosen = urls.slice(0, pairCount);
    return shuffle(chosen.concat(chosen));
  }

  function setTimerDisplay(value) {
    el.timer.textContent = String(value);
  }

  function startRoundTimer() {
    let remaining = state.roundTime;
    setTimerDisplay(remaining);
    clearInterval(state.roundTimerId);

    state.roundTimerId = setInterval(function () {
      remaining -= 1;
      setTimerDisplay(remaining);

      if (remaining <= 0) {
        loseRound();
      }
    }, 1000);
  }

  function stopIdleRefreshTimer() {
    clearInterval(state.idleRefreshTimerId);
    state.idleRefreshTimerId = 0;
  }

  function startIdleRefreshTimer() {
    stopIdleRefreshTimer();
    if (state.idleRefreshSeconds <= 0) return;

    state.idleRefreshTimerId = setInterval(function () {
      if (state.gameActive) return;
      if (!el.adminModal.classList.contains("hidden")) return;
      if (!el.center.classList.contains("hidden")) return;

      prepareDeck(true);
    }, state.idleRefreshSeconds * 1000);
  }

  function updateNameUI() {
    el.name.textContent = state.playerName || "ENTER NAME";
    el.player.textContent = state.playerName ? "Player: " + state.playerName : "";
    el.start.disabled = state.playerName.length < 2;
  }

  function pressKey(value) {
    if (value === "←") {
      state.playerName = state.playerName.slice(0, -1);
    } else if (value === "CLEAR") {
      state.playerName = "";
    } else if (value === "SPACE") {
      if (
        state.playerName.length < 12 &&
        state.playerName.length &&
        state.playerName[state.playerName.length - 1] !== " "
      ) {
        state.playerName += " ";
      }
    } else if (state.playerName.length < 12) {
      state.playerName += value;
    }

    updateNameUI();
  }

  function buildKeyboard() {
    const keys = [
      "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P",
      "A", "S", "D", "F", "G", "H", "J", "K", "L", "←",
      "Z", "X", "C", "V", "B", "N", "M", "SPACE", "CLEAR"
    ];

    el.keys.innerHTML = "";

    keys.forEach(function (key) {
      const button = document.createElement("div");
      button.className = "fp-key" + ((key === "SPACE" || key === "CLEAR") ? " wide" : "");
      button.textContent = key === "←" ? "⌫" : key;
      button.onclick = function () {
        pressKey(key);
      };
      el.keys.appendChild(button);
    });
  }

  function shouldWinNow() {
    if (state.winTarget === "all") return state.matchedPairs >= state.deck.length / 2;
    return state.matchedPairs >= state.winTarget;
  }

  function renderBoard(showAll) {
    applyBoardLayout();
    el.board.innerHTML = "";

    state.deck.forEach(function (src) {
      const card = document.createElement("div");
      card.className = "fp-card" + (showAll ? " show" : "");
      card.dataset.k = src;
      card.innerHTML =
        '<div class="fp-inner">' +
          '<div class="fp-face fp-front"><span>Tap</span></div>' +
          '<div class="fp-face fp-back"><img src="' + src + '" alt=""></div>' +
        '</div>';

      el.board.appendChild(card);

      card.onclick = function () {
        if (!state.gameActive) return;
        if (!el.center.classList.contains("hidden")) return;
        if (!el.adminModal.classList.contains("hidden")) return;
        if (state.lockBoard || card.classList.contains("matched") || card === state.firstCard) return;

        card.classList.add("show");

        if (!state.firstCard) {
          state.firstCard = card;
          return;
        }

        state.lockBoard = true;

        if (state.firstCard.dataset.k === card.dataset.k) {
          state.firstCard.classList.add("matched");
          card.classList.add("matched");
          state.firstCard = null;
          state.matchedPairs += 1;

          if (shouldWinNow()) {
            setTimeout(winRound, 550);
          } else {
            state.lockBoard = false;
          }
        } else {
          const a = state.firstCard;
          const b = card;
          setTimeout(function () {
            a.classList.remove("show");
            b.classList.remove("show");
            state.firstCard = null;
            state.lockBoard = false;
          }, 700);
        }
      };
    });

    updateBoardShellMode();
  }

  function animateBoardRefresh(nextShowAll) {
    el.board.classList.add("fp-refresh-out");

    setTimeout(function () {
      renderBoard(nextShowAll);
      el.board.classList.remove("fp-refresh-out");
      el.board.classList.add("fp-refresh-in");

      setTimeout(function () {
        el.board.classList.remove("fp-refresh-in");
      }, 380);
    }, 220);
  }

  function showNameEntry() {
    clearTimeout(state.autoBackTimer);
    stopIdleRefreshTimer();
    el.head.textContent = "Find the Match";
    el.copy.textContent = "Enter your name, then tap start.";
    el.center.classList.remove("hidden");
    el.keys.style.display = "";
    el.name.style.display = "";
    el.start.classList.remove("hidden");
    el.cancel.classList.remove("hidden");
    el.replay.classList.add("hidden");
    renderLeaderboard();
    buildKeyboard();
    updateNameUI();
    updateBoardShellMode();
  }

  function showResult(title, text) {
    clearTimeout(state.autoBackTimer);
    el.head.textContent = title;
    el.copy.textContent = text;
    el.center.classList.remove("hidden");
    el.keys.style.display = "none";
    el.name.style.display = "none";
    el.start.classList.add("hidden");
    el.cancel.classList.add("hidden");
    el.replay.classList.remove("hidden");
    renderLeaderboard();
    updateBoardShellMode();

    state.autoBackTimer = setTimeout(function () {
      goIdle();
    }, 5000);
  }

  function getWinTargetLabel() {
    return state.winTarget === "all"
      ? "All Matches"
      : state.winTarget + " Match" + (state.winTarget > 1 ? "es" : "");
  }

  function winRound() {
    clearInterval(state.roundTimerId);
    state.gameActive = false;

    const elapsed = (Date.now() - state.roundStartedAt) / 1000;
    if (state.playerName) saveScore(state.playerName, elapsed);

    state.playerName = "";
    updateNameUI();
    showResult("You Found a Match!", "Target: " + getWinTargetLabel() + ". Starting over shortly...");
  }

  function loseRound() {
    clearInterval(state.roundTimerId);
    state.gameActive = false;
    state.playerName = "";
    updateNameUI();
    showResult("Time's Up!", "Starting over shortly...");
  }

  function goIdle() {
    clearTimeout(state.autoBackTimer);
    clearInterval(state.roundTimerId);

    setTimerDisplay(state.roundTime);
    el.player.textContent = "";
    state.playerName = "";
    state.firstCard = null;
    state.lockBoard = false;
    state.matchedPairs = 0;
    state.gameActive = false;

    el.center.classList.add("hidden");
    el.countdown.classList.add("hidden");

    updateNameUI();

    if (state.deck.length) {
      renderBoard(state.idlePreview);
    }

    el.play.classList.remove("hidden");
    updateBoardShellMode();
    startIdleRefreshTimer();
  }

  function runCountdown(done) {
    let value = state.startCountdown;

    if (value <= 0) {
      el.countdown.classList.add("hidden");
      done();
      return;
    }

    el.countdown.textContent = value;
    el.countdown.classList.remove("hidden");

    const id = setInterval(function () {
      value -= 1;
      if (value <= 0) {
        clearInterval(id);
        el.countdown.classList.add("hidden");
        done();
      } else {
        el.countdown.textContent = value;
      }
    }, 1000);
  }

  async function prepareDeck(withAnimation) {
    state.deck = await buildDeck();
    if (!state.gameActive) {
      if (withAnimation) {
        animateBoardRefresh(state.idlePreview);
      } else {
        renderBoard(state.idlePreview);
      }
    }
  }

  async function startGame() {
    if (state.playerName.length < 2) return;

    stopIdleRefreshTimer();

    state.deck = await buildDeck();
    state.matchedPairs = 0;
    state.gameActive = false;
    el.center.classList.add("hidden");
    el.play.classList.add("hidden");
    state.firstCard = null;
    state.lockBoard = true;

    renderBoard(state.startPreview);
    updateBoardShellMode();

    runCountdown(function () {
      [...el.board.children].forEach(function (card) {
        card.classList.remove("show");
      });

      state.roundStartedAt = Date.now();
      state.lockBoard = false;
      state.gameActive = true;
      updateBoardShellMode();
      startRoundTimer();
    });
  }

  function bindColorPair(picker, text, fallback) {
    picker.addEventListener("input", function () {
      text.value = picker.value.toUpperCase();
    });

    text.addEventListener("input", function () {
      const normalized = normalizeHex(text.value, fallback);
      if (isValidHex(text.value.trim())) {
        picker.value = normalized;
        text.value = normalized;
      }
    });
  }

  function resetAllSettings() {
    const confirmed = window.confirm("Are you sure you want to reset all settings, custom colors, custom images, logos, PIN, and leaderboard?");
    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEYS.settings);
    localStorage.removeItem(STORAGE_KEYS.leaderboard);

    state.winTarget = DEFAULTS.winTarget;
    state.startCountdown = DEFAULTS.startCountdown;
    state.roundTime = DEFAULTS.roundTime;
    state.idleRefreshSeconds = DEFAULTS.idleRefreshSeconds;
    state.cardCount = DEFAULTS.cardCount;
    state.idlePreview = DEFAULTS.idlePreview;
    state.startPreview = DEFAULTS.startPreview;
    state.adminPin = DEFAULTS.adminPin;
    state.theme = JSON.parse(JSON.stringify(DEFAULTS.theme));
    state.logoUrl = DEFAULTS.logoUrl;
    state.headerLogoUrl = DEFAULTS.headerLogoUrl;
    state.bgImageUrl = DEFAULTS.bgImageUrl;

    applyThemeColors(state.theme);
    applyLogo(state.logoUrl);
    applyHeaderLogo(state.headerLogoUrl);
    applyBackgroundImage(state.bgImageUrl);
    renderLeaderboard();
    updateSettingsUI();
    setTimerDisplay(state.roundTime);
    startIdleRefreshTimer();

    if (!state.gameActive && state.deck.length) {
      renderBoard(state.idlePreview);
    }
  }

  function handleImageUpload(file, onLoad) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const result = String(event.target.result || "");
      if (!result) return;

      try {
        onLoad(result);
        persistSettings();
      } catch (error) {
        console.error(error);
        alert("Could not save that image. Try a smaller image file.");
      }
    };
    reader.readAsDataURL(file);
  }

  function savePin() {
    const current = el.currentPin.value.trim();
    const next = el.newPin.value.trim();
    const confirm = el.confirmPin.value.trim();

    if (current !== state.adminPin) {
      el.pinStatus.textContent = "Current PIN is incorrect.";
      return;
    }

    if (!next || next.length < 4) {
      el.pinStatus.textContent = "New PIN must be at least 4 characters.";
      return;
    }

    if (next !== confirm) {
      el.pinStatus.textContent = "New PIN and confirmation do not match.";
      return;
    }

    state.adminPin = next;
    persistSettings();
    el.currentPin.value = "";
    el.newPin.value = "";
    el.confirmPin.value = "";
    el.pinStatus.textContent = "PIN updated successfully.";
  }

  el.play.onclick = showNameEntry;
  el.start.onclick = startGame;
  el.cancel.onclick = goIdle;
  el.replay.onclick = goIdle;

  el.adminButton.onclick = openAdmin;
  el.adminBackdrop.onclick = closeAdmin;
  el.adminCloseLock.onclick = closeAdmin;
  el.adminClose.onclick = closeAdmin;
  el.adminUnlock.onclick = unlockAdmin;

  el.adminPin.addEventListener("keydown", function (event) {
    if (event.key === "Enter") unlockAdmin();
  });

  el.savePin.onclick = savePin;

  el.winTargets.forEach(function (button) {
    button.onclick = function () {
      const value = button.getAttribute("data-win");
      state.winTarget = value === "all" ? "all" : parseInt(value, 10);
      updateSettingsUI();
      persistSettings();
    };
  });

  el.cardCountButtons.forEach(function (button) {
    button.onclick = function () {
      state.cardCount = parseInt(button.getAttribute("data-card-count"), 10);
      updateSettingsUI();
      persistSettings();
      prepareDeck(true);
    };
  });

  el.countdownInput.addEventListener("input", function () {
    const value = parseInt(el.countdownInput.value, 10);
    if (!isNaN(value)) {
      state.startCountdown = Math.max(0, Math.min(10, value));
      persistSettings();
    }
  });

  el.roundTimerInput.addEventListener("input", function () {
    const value = parseInt(el.roundTimerInput.value, 10);
    if (!isNaN(value)) {
      state.roundTime = Math.max(5, Math.min(120, value));
      if (!state.gameActive) setTimerDisplay(state.roundTime);
      persistSettings();
    }
  });

  el.idleRefreshInput.addEventListener("input", function () {
    const value = parseInt(el.idleRefreshInput.value, 10);
    if (!isNaN(value)) {
      state.idleRefreshSeconds = Math.max(0, Math.min(600, value));
      persistSettings();
      startIdleRefreshTimer();
    }
  });

  el.idlePreviewInput.addEventListener("change", function () {
    state.idlePreview = el.idlePreviewInput.checked;
    if (!state.gameActive && state.deck.length) renderBoard(state.idlePreview);
    persistSettings();
  });

  el.startPreviewInput.addEventListener("change", function () {
    state.startPreview = el.startPreviewInput.checked;
    persistSettings();
  });

  el.presetButtons.forEach(function (button) {
    button.onclick = function () {
      applyThemePreset(button.getAttribute("data-preset"));
    };
  });

  bindColorPair(el.bgPicker, el.bgText, DEFAULTS.theme.bg);
  bindColorPair(el.accentPicker, el.accentText, DEFAULTS.theme.accent);
  bindColorPair(el.accentTextPicker, el.accentTextText, DEFAULTS.theme.accentText);
  bindColorPair(el.cardPicker, el.cardText, DEFAULTS.theme.card);
  bindColorPair(el.panelPicker, el.panelText, DEFAULTS.theme.panel);

  el.applyTheme.onclick = function () {
    applyThemeColors({
      bg: el.bgText.value,
      accent: el.accentText.value,
      accentText: el.accentTextText.value,
      card: el.cardText.value,
      panel: el.panelText.value
    });
  };

  el.resetTheme.onclick = function () {
    applyThemePreset("dark");
  };

  el.resetLeaderboard.onclick = function () {
    const confirmed = window.confirm("Are you sure you want to reset the leaderboard?");
    if (!confirmed) return;
    clearLeaderboard();
  };

  el.resetAll.onclick = resetAllSettings;

  el.logoUpload.addEventListener("change", function () {
    const file = el.logoUpload.files && el.logoUpload.files[0];
    if (file) handleImageUpload(file, applyLogo);
    el.logoUpload.value = "";
  });

  el.headerLogoUpload.addEventListener("change", function () {
    const file = el.headerLogoUpload.files && el.headerLogoUpload.files[0];
    if (file) handleImageUpload(file, applyHeaderLogo);
    el.headerLogoUpload.value = "";
  });

  el.bgUpload.addEventListener("change", function () {
    const file = el.bgUpload.files && el.bgUpload.files[0];
    if (file) handleImageUpload(file, applyBackgroundImage);
    el.bgUpload.value = "";
  });

  el.removeLogo.addEventListener("click", function () {
    const confirmed = window.confirm("Remove the custom card-back logo and revert to the default logo?");
    if (!confirmed) return;
    applyLogo(DEFAULTS.logoUrl);
    persistSettings();
  });

  el.removeHeaderLogo.addEventListener("click", function () {
    const confirmed = window.confirm("Remove the custom header logo?");
    if (!confirmed) return;
    applyHeaderLogo("");
    persistSettings();
  });

  el.removeBg.addEventListener("click", function () {
    const confirmed = window.confirm("Remove the custom background image?");
    if (!confirmed) return;
    applyBackgroundImage("");
    persistSettings();
  });

  window.addEventListener("resize", function () {
    applyBoardLayout();
    updateBoardShellMode();
  });

  loadSettings();
  applyThemeColors(state.theme);
  applyLogo(state.logoUrl);
  applyHeaderLogo(state.headerLogoUrl);
  applyBackgroundImage(state.bgImageUrl);
  updateSettingsUI();

  prepareDeck(false).then(function () {
    setTimerDisplay(state.roundTime);
    goIdle();
  });
});
