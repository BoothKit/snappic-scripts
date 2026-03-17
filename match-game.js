document.addEventListener("DOMContentLoaded", function () {
    // Block only multi-touch gestures like pinch zoom
  function bindGameTouchLock() {
  const game = document.getElementById("fp-game");
  if (!game) return;

  const TOP_SAFE_ZONE = 120;

  function isInTopSafeZone(e) {
    const touch =
      (e.touches && e.touches[0]) ||
      (e.changedTouches && e.changedTouches[0]);

    if (!touch) return false;
    return touch.clientY <= TOP_SAFE_ZONE;
  }

  game.addEventListener("touchstart", function(e) {
    if (isInTopSafeZone(e)) return;
    if (e.touches && e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  game.addEventListener("touchmove", function(e) {
    if (isInTopSafeZone(e)) return;
    if (e.touches && e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  game.addEventListener("gesturestart", function(e) {
    if (isInTopSafeZone(e)) return;
    e.preventDefault();
  }, { passive: false });

  game.addEventListener("gesturechange", function(e) {
    if (isInTopSafeZone(e)) return;
    e.preventDefault();
  }, { passive: false });

  game.addEventListener("gestureend", function(e) {
    if (isInTopSafeZone(e)) return;
    e.preventDefault();
  }, { passive: false });
}
  function preventContext(e) { e.preventDefault(); }

  // ── Gallery mode: check FIRST before building the game ──────────────────────
  (function earlyGalleryCheck() {
    const urlParams = new URLSearchParams(window.location.search);
    const galleryParam = urlParams.get("gallery") === "1";
    if (!galleryParam) return;
    // Add CSS class to <html> — activates the gallery-mode rules in the CSS file
    document.documentElement.classList.add("fp-gallery-mode");
    // Also inject a style block as a belt-and-braces fallback
    if (!document.getElementById("fp-gallery-restore-styles")) {
      const s = document.createElement("style");
      s.id = "fp-gallery-restore-styles";
      s.textContent =
        "html,body{overflow:auto !important;overscroll-behavior:auto !important;" +
        "touch-action:auto !important;height:auto !important;" +
        "scrollbar-width:auto !important;-ms-overflow-style:auto !important;}" +
        "html::-webkit-scrollbar,body::-webkit-scrollbar{display:block !important;" +
        "width:auto !important;height:auto !important;}" +
        "#fp-game{display:none !important;}";
      document.head.appendChild(s);
    }
  })();

  document.addEventListener("contextmenu", preventContext);

  const host = document.querySelector("#content");
  const galleryImgs = [...document.querySelectorAll("#gallery .grid-item img")];
  if (!host || galleryImgs.length < 6) return;

    const STORAGE_KEYS = {
    settings: "fp_settings_v13",
    leaderboard: "fp_lb_v13",
    galleryMode: "fp_gallery_mode_v1",
    cachedGalleryUrls: "fp_cached_gallery_urls_v1",
    cachedLastDeck: "fp_cached_last_deck_v1"
  };

  const CARD_COUNTS = [6, 8, 10, 12, 16, 20, 30];
  const ROUND_DIFFICULTIES = ["same", "lessTime", "moreCards", "randomReshuffle", "moreMatches"];
  const COLUMN_OPTIONS = [2, 3, 4, 5, 6];

  const DEFAULTS = {
    playerName: "",
    autoBackTimer: 0,
    nameEntryTimer: 0,
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
    popupTimingSecs: 5,
    roundTransitionSecs: 2.4,
    cardCount: 12,
    columns: 4,
    boardWidthPercent: 100,
    boardMinHeight: 0,
    boardGap: 16,
    gameActive: false,
    adminUnlocked: false,
    adminPin: "1111",
    showCursor: true,
    hudOffsetY: 0,
    boardOffsetY: 0,
    rounds: 1,
    roundDifficulty: "same",
    currentRound: 1,
    roundResults: [],
    misses: 0,
    activeRoundTime: 20,
    activeCardCount: 12,
    activeWinTarget: 1,
    theme: {
  bg: "#0F1115",
  accent: "#FFFFFF",
  accentText: "#111111",
  card: "#151821",
  panel: "#1C1F27",
  text: "#FFFFFF"
},
    logoUrl: "https://theboothkit.com/wp-content/uploads/2026/02/Site-Logo.png",
    headerLogoUrl: "https://theboothkit.com/wp-content/uploads/2026/02/Site-Logo.png",
    headerLogoHeight: 56,
    headerLogoMaxWidth: 240,
    headerLogoOffsetY: 200,
    bgImageUrl: "",
    customFontDataUrl: "",
    customFontFileName: "",
    customFontFamily: ""
  };

  const state = JSON.parse(JSON.stringify(DEFAULTS));

  // ─────────────────────────────────────────────────────────────────────────────
  // Global styles injected at runtime
  // ─────────────────────────────────────────────────────────────────────────────
  function injectGlobalUiStyles() {
    if (document.getElementById("fp-runtime-ui-styles")) return;
    const style = document.createElement("style");
    style.id = "fp-runtime-ui-styles";
    style.textContent = `
      html, body {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      html::-webkit-scrollbar, body::-webkit-scrollbar {
        width: 0 !important; height: 0 !important;
        display: none !important; background: transparent !important;
      }

      /* ── Block long-press / callout / text selection on game elements ── */
      #fp-game, #fp-game * {
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      /* Re-allow selection inside admin panel inputs */
      #fp-admin-panel input,
      #fp-admin-panel textarea {
        -webkit-user-select: text !important;
        user-select: text !important;
      }

      #fp-admin-panel {
        scrollbar-width: auto !important;
        -ms-overflow-style: auto !important;
      }
      #fp-admin-panel::-webkit-scrollbar {
        width: 10px !important; height: 10px !important; display: block !important;
      }
      #fp-admin-panel::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,.18) !important; border-radius: 999px !important;
      }
      #fp-admin-panel::-webkit-scrollbar-track {
        background: rgba(255,255,255,.04) !important;
      }

      #fp-game, #fp-game * { cursor: none !important; }
      #fp-game.fp-show-cursor, #fp-game.fp-show-cursor * { cursor: auto !important; }

      #fp-head, #fp-copy, #fp-leaderboard, #fp-leaderboard h3, #fp-leaderboard div {
        text-align: center !important;
      }
      #fp-leaderboard { justify-items: center; }
      #fp-leaderboard div { width: min(100%, 420px); }
      #fp-live-leaderboard, #fp-live-leaderboard div { text-align: center !important; }

      /* ── PIN display ── */
      #fp-admin-pin { display: none !important; }
      #fp-admin-pin-display {
        margin: 18px 0 0;
        width: 100%; padding: 16px 18px; border-radius: 18px;
        background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14);
        font-size: 26px; font-weight: 800; letter-spacing: .18em;
        min-height: 62px; display: flex; align-items: center; justify-content: center;
        text-transform: uppercase; box-sizing: border-box; text-align: center;
      }
      #fp-admin-pin-display.empty { letter-spacing: .04em; font-size: 18px; opacity: .72; }
      #fp-admin-pin-keys {
        display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin: 16px 0 0;
      }
      .fp-admin-pin-key {
        padding: 14px 8px; border-radius: 14px;
        border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.08);
        color: #fff; font-size: 18px; font-weight: 800;
        text-align: center; cursor: pointer;
        user-select: none; -webkit-user-select: none;
      }

      /* ── Keyboard ── */
      #fp-keys {
        display: grid; grid-template-columns: repeat(10,1fr); gap: 10px; margin: 0 0 18px;
      }
      .fp-key {
        padding: 14px 8px; border-radius: 14px;
        border: 1px solid var(--fp-key-border); background: var(--fp-key-bg);
        color: var(--fp-text); font-size: 18px; font-weight: 800;
        text-align: center; cursor: pointer;
        user-select: none; -webkit-user-select: none;
        transition: background .1s ease, color .1s ease, border-color .1s ease, transform .1s ease;
      }
      .fp-key.fp-key-active {
        background: var(--fp-accent) !important;
        color: var(--fp-accent-text) !important;
        border-color: transparent !important;
        transform: scale(.94);
      }
      .fp-key.bottom-key { margin-top: 2px; }
      .fp-key.bottom-left, .fp-key.bottom-right { grid-column: span 5; }

      /* ── Status flash ── */
      #fp-status-flash {
        position: fixed;
        z-index: 90;
        min-width: min(86vw, 420px); max-width: min(90vw, 520px);
        padding: 20px 26px; border-radius: 28px;
        background: linear-gradient(135deg, rgba(0,0,0,.88), rgba(20,20,20,.96));
        border: 1px solid rgba(255,255,255,.18);
        box-shadow: 0 30px 80px rgba(0,0,0,.55), 0 0 26px rgba(255,255,255,.12);
        text-align: center; opacity: 0; pointer-events: none;
        transition: opacity .22s ease, transform .22s ease; display: none;
        /* left/top set by JS to board center; transform handles scale + centering */
        transform: translate(-50%,-50%) scale(.72);
      }
      #fp-status-flash.show { opacity: 1; transform: translate(-50%,-50%) scale(1); }
      #fp-status-flash.hidden { display: none; }
      #fp-status-flash .fp-status-line-1 {
        display: block; font-size: 28px; font-weight: 900;
        letter-spacing: .16em; text-transform: uppercase; line-height: 1;
      }
      #fp-status-flash .fp-status-line-2 {
        display: block; margin-top: 8px; font-size: 15px; font-weight: 800;
        letter-spacing: .28em; text-transform: uppercase; opacity: .84; line-height: 1.1;
      }

      @keyframes fpCountdownPulse {
        0%   { transform: scale(1.15); opacity: 0; }
        15%  { transform: scale(1);    opacity: 1; }
        80%  { transform: scale(1);    opacity: 1; }
        100% { transform: scale(.82);  opacity: 0; }
      }
      /* fp-countdown-inner handles translateXY positioning (set by JS) */
      /* fp-countdown-pulse handles scale/opacity animation only */
      .fp-countdown-inner { display: block; }
      .fp-countdown-pulse {
        display: block;
      }
      .fp-countdown-pulse.fp-tick {
        animation: fpCountdownPulse .85s ease forwards;
      }

      #fp-top-right {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px; /* ⬅ increased from 8px */
}

#fp-live-leaderboard {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: normal;
  width: 100%;
}

#fp-top-meta {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 16px; /* ⬅ increased from 10px */
  flex-wrap: wrap;
}

/* ── Bigger timer ── */
#fp-timer {
  font-size: 64px !important;
  font-weight: 900 !important;
  line-height: 1;
}

@keyframes fpShuffleShake {
  0% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(6px); }
  100% { transform: translateX(0); }
}

@keyframes fpTimerDangerBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: .35; }
}

#fp-timer.fp-danger {
  color: #ff3b30 !important;
  animation: fpTimerDangerBlink .9s linear infinite;
}

#fp-board.fp-reshuffle { animation: fpShuffleShake .35s ease; }

      /* ── COUNTDOWN: full-page tint, number centered over board via JS padding ── */
      #fp-countdown {
        position: fixed !important;
        top: 0 !important; left: 0 !important;
        right: 0 !important; bottom: 0 !important;
        width: 100vw !important; height: 100vh !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 86 !important;
        pointer-events: none;
        transition: opacity .22s ease;
        /* padding-top is set by JS to shift the flex center to the board center */
      }
      #fp-countdown.hidden { display: none !important; }

      /* ── ROUND TRANSITION: full-page frosted backdrop, card centered over board via JS padding ── */
      #fp-round-transition {
        position: fixed !important;
        top: 0 !important; left: 0 !important;
        right: 0 !important; bottom: 0 !important;
        width: 100vw !important; height: 100vh !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 24px !important;
        background: rgba(0,0,0,.58) !important;
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
        z-index: 85 !important;
        opacity: 0;
        pointer-events: none;
        transition: opacity .28s ease;
      }
      #fp-round-transition.hidden { display: none !important; }
      #fp-round-transition.show { opacity: 1; pointer-events: auto; }
      #fp-round-transition-card {
        width: min(92vw, 540px) !important;
        max-width: min(92vw, 540px) !important;
        margin: 0 auto !important;
        background: var(--fp-panel) !important;
        border: 1px solid rgba(255,255,255,.14) !important;
        border-radius: 26px !important;
        padding: 28px 24px !important;
        text-align: center !important;
        box-shadow: 0 28px 80px rgba(0,0,0,.34) !important;
      }

      /* ── Slider preview: fade out admin panel, show confirm bar ── */
      #fp-admin-modal.fp-slider-active #fp-admin-backdrop {
        background: rgba(0,0,0,.08) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        transition: background .3s ease, backdrop-filter .3s ease;
      }
      #fp-admin-modal.fp-slider-active #fp-admin-panel {
        opacity: 0 !important;
        pointer-events: none !important;
        transition: opacity .3s ease;
      }
      #fp-admin-modal #fp-admin-backdrop {
        transition: background .3s ease, backdrop-filter .3s ease;
      }
      #fp-admin-modal #fp-admin-panel {
        opacity: 1;
        pointer-events: auto;
        transition: opacity .3s ease;
      }
      /* Floating confirm bar */
      #fp-slider-confirm-bar {
        position: fixed;
        bottom: 32px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 20px;
        border-radius: 999px;
        background: rgba(20,22,28,.96);
        border: 1px solid rgba(255,255,255,.18);
        box-shadow: 0 16px 48px rgba(0,0,0,.55);
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: 700;
        color: #fff;
        letter-spacing: .04em;
        opacity: 0;
        pointer-events: none;
        transition: opacity .25s ease, transform .25s ease;
      }
      #fp-slider-confirm-bar.show {
        opacity: 1;
        pointer-events: auto;
        transform: translateX(-50%) translateY(0);
      }
      #fp-slider-confirm-bar .fp-scb-label {
        opacity: .7;
        white-space: nowrap;
      }
      #fp-slider-confirm-apply {
        padding: 10px 20px;
        border-radius: 999px;
        border: none;
        background: #fff;
        color: #111;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        letter-spacing: .04em;
      }
      #fp-slider-confirm-cancel {
        padding: 10px 18px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.22);
        background: rgba(255,255,255,.08);
        color: #fff;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        letter-spacing: .04em;
      }

      /* ── Slider value readout style ── */
      .fp-slider-row {
        display: flex; flex-direction: column; gap: 4px; margin-top: 0;
      }
      .fp-slider-value {
        font-size: 13px; font-weight: 700; opacity: .72;
        text-align: right; letter-spacing: .04em;
      }
      input[type="range"].fp-admin-number {
        -webkit-appearance: none; appearance: none;
        width: 100%; height: 6px; border-radius: 999px;
        background: rgba(255,255,255,.14); outline: none;
        border: none; padding: 0; cursor: pointer;
        margin-top: 4px;
      }
      input[type="range"].fp-admin-number::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 20px; height: 20px; border-radius: 50%;
        background: #fff; cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,.35);
      }
      input[type="range"].fp-admin-number::-moz-range-thumb {
        width: 20px; height: 20px; border-radius: 50%;
        background: #fff; cursor: pointer; border: none;
        box-shadow: 0 2px 8px rgba(0,0,0,.35);
      }

      /* ── Card edge fix: overflow visible up the tree so glows/flips aren't clipped ── */
      #fp-wrap {
        overflow: visible !important;
        width: 96vw !important;
        max-width: none !important;
      }
      #fp-board-shell {
        overflow: visible !important;
      }
      #fp-board {
        overflow: visible !important;
      }
      .fp-card {
        overflow: visible !important;
      }
      .fp-inner {
        overflow: visible !important;
      }
      /* ── Invisible top-right admin hotspot ── */
#fp-admin {
  position: fixed !important;
  top: 10px !important;
  right: 10px !important;
  width: 96px !important;
  height: 96px !important;
  z-index: 999998 !important;

  /* invisible but clickable */
  opacity: 0 !important;
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  color: transparent !important;

  /* ensure interaction */
  pointer-events: auto !important;
  touch-action: manipulation !important;
}

      @media (orientation: portrait) {
        #fp-keys { grid-template-columns: repeat(10,1fr) !important; }
        .fp-key.bottom-left, .fp-key.bottom-right { grid-column: span 5 !important; }
      }
    `;
    document.head.appendChild(style);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Build HTML
  // ─────────────────────────────────────────────────────────────────────────────
  const app = document.createElement("div");
  app.id = "fp-game";
  app.innerHTML =
    '<div id="fp-first-place-banner"></div>' +
    '<div id="fp-wrap">' +
      '<div id="fp-top">' +
        '<div id="fp-brand">' +
          '<div id="fp-header-logo-wrap"><img id="fp-header-logo" alt="Header Logo"></div>' +
          '<div id="fp-title-block">' +
            '<div id="fp-title">Find the Match</div>' +
            '<div id="fp-player"></div>' +
          '</div>' +
        '</div>' +
        '<div id="fp-top-right">' +
          '<div id="fp-live-leaderboard"></div>' +
          '<div id="fp-top-meta">' +
            '<div id="fp-round-pill" class="hidden"></div>' +
            '<div id="fp-timer">20</div>' +
            '<button id="fp-admin" type="button" aria-label="Admin Settings">⚙</button>' +
          '</div>' +
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
      '<div id="fp-status-flash" class="hidden"></div>' +

      '<div id="fp-round-transition" class="hidden">' +
        '<div id="fp-round-transition-card">' +
          '<div id="fp-round-transition-kicker">Get Ready</div>' +
          '<div id="fp-round-transition-title">Round 1</div>' +
          '<div id="fp-round-transition-copy"></div>' +
        '</div>' +
      '</div>' +

      '<div id="fp-admin-modal" class="hidden">' +
        '<div id="fp-admin-backdrop"></div>' +
        '<div id="fp-admin-panel">' +

          '<div id="fp-admin-lock">' +
            '<div class="fp-admin-title">Admin Settings</div>' +
            '<p class="fp-admin-sub">Enter PIN to unlock settings.</p>' +
            '<input id="fp-admin-pin" type="password" inputmode="numeric" placeholder="PIN">' +
            '<div id="fp-admin-pin-display" class="empty">ENTER PIN</div>' +
            '<div id="fp-admin-pin-keys"></div>' +
            '<div class="fp-admin-actions">' +
              '<button id="fp-admin-unlock" type="button">Unlock</button>' +
              '<button id="fp-admin-close-lock" type="button" class="fp-admin-secondary">Close</button>' +
            '</div>' +
          '</div>' +

          '<div id="fp-admin-ui" class="hidden">' +
            '<div class="fp-admin-header">' +
              '<div>' +
                '<div class="fp-admin-title">Admin Settings</div>' +
                '<p class="fp-admin-sub">Adjust gameplay, rounds, visuals, assets, refresh behavior, and security.</p>' +
              '</div>' +
              '<button id="fp-admin-close" type="button" class="fp-admin-icon">✕</button>' +
            '</div>' +

            '<div class="fp-admin-grid">' +

              // ── Gameplay ──
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
                '<div id="fp-win-target-override-note" class="fp-admin-note">More Matches Required overrides the Win Target setting and uses round-based targets automatically.</div>' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-setting-countdown">Countdown (sec)</label>' +
                '<input id="fp-setting-countdown" class="fp-admin-number" type="range" min="0" max="10" step="1">' +
                '<div id="fp-countdown-value" class="fp-admin-note">3s</div>' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-setting-timer">Base Timer (sec)</label>' +
                '<input id="fp-setting-timer" class="fp-admin-number" type="range" min="5" max="120" step="1">' +
                '<div id="fp-timer-value" class="fp-admin-note">20s</div>' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-setting-idle-refresh">Idle Refresh (sec)</label>' +
                '<input id="fp-setting-idle-refresh" class="fp-admin-number" type="range" min="0" max="600" step="5">' +
                '<div id="fp-idle-refresh-value" class="fp-admin-note">30s</div>' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-setting-round-transition">Round Popup Duration (sec)</label>' +
                '<input id="fp-setting-round-transition" class="fp-admin-number" type="range" min="1" max="8" step="1">' +
                '<div id="fp-round-transition-value" class="fp-admin-note">2.4s</div>' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-setting-popup-timing">Result Popup Duration (sec)</label>' +
                '<input id="fp-setting-popup-timing" class="fp-admin-number" type="range" min="2" max="15" step="1">' +
                '<div id="fp-popup-timing-value" class="fp-admin-note">5s</div>' +

                '<label class="fp-admin-label fp-admin-label-top">Columns</label>' +
                '<div id="fp-column-counts" class="fp-chip-group">' +
                  '<button type="button" class="fp-chip" data-columns="2">2 Columns</button>' +
                  '<button type="button" class="fp-chip" data-columns="3">3 Columns</button>' +
                  '<button type="button" class="fp-chip" data-columns="4">4 Columns</button>' +
                  '<button type="button" class="fp-chip" data-columns="5">5 Columns</button>' +
                  '<button type="button" class="fp-chip" data-columns="6">6 Columns</button>' +
                '</div>' +
                '<div class="fp-admin-note">Choose how many columns the board uses.</div>' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-board-width-range">Card Area Width (%)</label>' +
                '<input id="fp-board-width-range" class="fp-admin-number" type="range" min="60" max="100" step="1">' +
                '<div id="fp-board-width-value" class="fp-admin-note">100%</div>' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-board-height-range">Card Area Min Height (px)</label>' +
                '<input id="fp-board-height-range" class="fp-admin-number" type="range" min="0" max="1400" step="10">' +
                '<div id="fp-board-height-value" class="fp-admin-note">0px</div>' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-board-gap-range">Card Gap</label>' +
                '<input id="fp-board-gap-range" class="fp-admin-number" type="range" min="6" max="30" step="1">' +
                '<div id="fp-board-gap-value" class="fp-admin-note">16px</div>' +

                '<label class="fp-admin-label fp-admin-label-top">Card Layout</label>' +
                '<div id="fp-card-counts" class="fp-chip-group">' +
                  '<button type="button" class="fp-chip" data-card-count="6">6 Cards</button>' +
                  '<button type="button" class="fp-chip" data-card-count="8">8 Cards</button>' +
                  '<button type="button" class="fp-chip" data-card-count="10">10 Cards</button>' +
                  '<button type="button" class="fp-chip" data-card-count="12">12 Cards</button>' +
                  '<button type="button" class="fp-chip" data-card-count="16">16 Cards</button>' +
                  '<button type="button" class="fp-chip" data-card-count="20">20 Cards</button>' +
                  '<button type="button" class="fp-chip" data-card-count="30">30 Cards</button>' +
                '</div>' +

                '<label class="fp-admin-label fp-admin-label-top">Rounds</label>' +
                '<div id="fp-round-counts" class="fp-chip-group">' +
                  '<button type="button" class="fp-chip" data-rounds="1">1 Round</button>' +
                  '<button type="button" class="fp-chip" data-rounds="2">2 Rounds</button>' +
                  '<button type="button" class="fp-chip" data-rounds="3">3 Rounds</button>' +
                  '<button type="button" class="fp-chip" data-rounds="5">5 Rounds</button>' +
                  '<button type="button" class="fp-chip" data-rounds="endless">Endless</button>' +
                '</div>' +

                '<label class="fp-admin-label fp-admin-label-top">Round Difficulty Style</label>' +
                '<div id="fp-round-difficulty" class="fp-chip-group">' +
                  '<button type="button" class="fp-chip" data-difficulty="same">Same Each Round</button>' +
                  '<button type="button" class="fp-chip" data-difficulty="lessTime">Less Time</button>' +
                  '<button type="button" class="fp-chip" data-difficulty="moreCards">More Cards</button>' +
                  '<button type="button" class="fp-chip" data-difficulty="randomReshuffle">Random Reshuffle</button>' +
                  '<button type="button" class="fp-chip" data-difficulty="moreMatches">More Matches Required</button>' +
                '</div>' +

                '<div class="fp-toggle-row">' +
                  '<label class="fp-toggle"><input id="fp-setting-idle-preview" type="checkbox"><span>Idle photo preview</span></label>' +
                  '<label class="fp-toggle"><input id="fp-setting-start-preview" type="checkbox"><span>Start photo preview</span></label>' +
                  '<label class="fp-toggle"><input id="fp-setting-show-cursor" type="checkbox"><span>Show mouse cursor</span></label>' +
                '</div>' +
              '</div>' +

              // ── Theme Presets (MOVED ABOVE Custom Colors) ──
              '<div class="fp-admin-section">' +
                '<h3>Theme Presets</h3>' +
                '<div class="fp-chip-group">' +
                  '<button type="button" class="fp-chip fp-preset" data-preset="dark">Dark Default</button>' +
                  '<button type="button" class="fp-chip fp-preset" data-preset="purple">BoothKit Purple</button>' +
                  '<button type="button" class="fp-chip fp-preset" data-preset="gold">Gold Luxe</button>' +
                '</div>' +
              '</div>' +

              // ── Custom Colors ──
              '<div class="fp-admin-section fp-admin-section-full">' +
  '<h3>Custom Colors</h3>' +
  '<div class="fp-color-grid">' +
    '<div class="fp-color-row"><label>Background</label><input type="color" id="fp-color-bg-picker"><input type="text" id="fp-color-bg-text" class="fp-admin-text" placeholder="#0F1115"></div>' +
    '<div class="fp-color-row"><label>Main Text</label><input type="color" id="fp-color-text-picker"><input type="text" id="fp-color-text-text" class="fp-admin-text" placeholder="#FFFFFF"></div>' +
    '<div class="fp-color-row"><label>Accent / Buttons</label><input type="color" id="fp-color-accent-picker"><input type="text" id="fp-color-accent-text" class="fp-admin-text" placeholder="#FFFFFF"></div>' +
    '<div class="fp-color-row"><label>Accent Text</label><input type="color" id="fp-color-accent-text-picker"><input type="text" id="fp-color-accent-text-text" class="fp-admin-text" placeholder="#111111"></div>' +
    '<div class="fp-color-row"><label>Card Front</label><input type="color" id="fp-color-card-picker"><input type="text" id="fp-color-card-text" class="fp-admin-text" placeholder="#151821"></div>' +
    '<div class="fp-color-row"><label>Popup Panel</label><input type="color" id="fp-color-panel-picker"><input type="text" id="fp-color-panel-text" class="fp-admin-text" placeholder="#1C1F27"></div>' +
  '</div>' +
  '<div class="fp-admin-actions fp-admin-actions-wrap">' +
    '<button id="fp-apply-theme" type="button">Apply Colors</button>' +
    '<button id="fp-reset-theme" type="button" class="fp-admin-secondary">Reset Theme</button>' +
    '<button id="fp-reset-leaderboard" type="button" class="fp-admin-danger">Reset Leaderboard</button>' +
    '<button id="fp-reset-all" type="button" class="fp-admin-danger">Reset All Settings</button>' +
  '</div>' +
'</div>' +

              // ── Brand Assets ──
              '<div class="fp-admin-section">' +
                '<h3>Brand Assets</h3>' +

                '<label class="fp-admin-label" for="fp-header-logo-upload">Header Logo Upload</label>' +
                '<input id="fp-header-logo-upload" type="file" accept="image/*" class="fp-admin-file">' +
                '<div id="fp-header-logo-status" class="fp-admin-note">Using default header logo.</div>' +
                '<div class="fp-admin-actions"><button id="fp-remove-header-logo" type="button" class="fp-admin-secondary">Reset Header Logo</button></div>' +

                // Header Logo Size → SLIDER
                '<label class="fp-admin-label fp-admin-label-top" for="fp-header-logo-size">Header Logo Size</label>' +
                '<input id="fp-header-logo-size" class="fp-admin-number" type="range" min="24" max="220" step="1">' +
                '<div id="fp-header-logo-size-value" class="fp-admin-note">56px</div>' +

                // Header Logo Move Up → SLIDER
                '<label class="fp-admin-label fp-admin-label-top" for="fp-header-logo-offset">Header Logo Move Up</label>' +
                '<input id="fp-header-logo-offset" class="fp-admin-number" type="range" min="0" max="500" step="1">' +
                '<div id="fp-header-logo-offset-value" class="fp-admin-note">200px</div>' +
                '<div class="fp-admin-note" style="margin-top:4px">Use larger values to move the header logo upward.</div>' +

                // Move Header / HUD → SLIDER
                '<label class="fp-admin-label fp-admin-label-top" for="fp-hud-offset">Move Header / HUD Up or Down</label>' +
                '<input id="fp-hud-offset" class="fp-admin-number" type="range" min="-500" max="500" step="1">' +
                '<div id="fp-hud-offset-value" class="fp-admin-note">0px</div>' +
                '<div class="fp-admin-note" style="margin-top:4px">Negative moves the title, timer, leaderboard, and settings row up. Positive moves it down.</div>' +

                // Move Card Area → SLIDER
                '<label class="fp-admin-label fp-admin-label-top" for="fp-board-offset">Move Card Area Up or Down</label>' +
                '<input id="fp-board-offset" class="fp-admin-number" type="range" min="-500" max="500" step="1">' +
                '<div id="fp-board-offset-value" class="fp-admin-note">0px</div>' +
                '<div class="fp-admin-note" style="margin-top:4px">Negative moves the cards up. Positive moves them down.</div>' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-logo-upload">Card Back Logo Upload</label>' +
                '<input id="fp-logo-upload" type="file" accept="image/*" class="fp-admin-file">' +
                '<div id="fp-logo-status" class="fp-admin-note">Using current saved card-back logo.</div>' +
                '<div class="fp-admin-actions"><button id="fp-remove-logo" type="button" class="fp-admin-secondary">Remove Card Back Logo</button></div>' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-bg-upload">Background Image Upload</label>' +
                '<input id="fp-bg-upload" type="file" accept="image/*" class="fp-admin-file">' +
                '<div id="fp-bg-status" class="fp-admin-note">Using color background only.</div>' +
                '<div class="fp-admin-actions"><button id="fp-remove-bg" type="button" class="fp-admin-secondary">Remove Background Image</button></div>' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-font-upload">Custom Font Upload</label>' +
                '<input id="fp-font-upload" type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" class="fp-admin-file">' +
                '<div id="fp-font-status" class="fp-admin-note">Using default font.</div>' +
                '<div class="fp-admin-actions"><button id="fp-remove-font" type="button" class="fp-admin-secondary">Remove Custom Font</button></div>' +

                '<label class="fp-admin-label fp-admin-label-top">Settings Transfer</label>' +
                '<input id="fp-import-settings-file" type="file" accept="application/json,.json">' +
                '<div id="fp-settings-transfer-status" class="fp-admin-note">Export your settings to move them to another monitor, then import that JSON there.</div>' +
                '<div class="fp-admin-actions">' +
                  '<button id="fp-export-settings" type="button">Export Settings JSON</button>' +
                  '<button id="fp-import-settings" type="button" class="fp-admin-secondary">Import Settings JSON</button>' +
                '</div>' +
              '</div>' +

              // ── Gallery Mode ──
              '<div class="fp-admin-section fp-admin-section-full">' +
                '<h3>Gallery Mode</h3>' +
                '<p class="fp-admin-sub" style="margin:0 0 14px">Switch to the normal photo gallery so clients can browse photos after the event. To return to game mode, reload the page from your event dashboard.</p>' +
                '<div class="fp-admin-actions">' +
                  '<button id="fp-enter-gallery" type="button" class="fp-admin-secondary">View Gallery</button>' +
                '</div>' +
              '</div>' +

              // ── Security ──
              '<div class="fp-admin-section">' +
                '<h3>Security</h3>' +
                '<label class="fp-admin-label" for="fp-current-pin">Current PIN</label>' +
                '<input id="fp-current-pin" class="fp-admin-text" type="password" inputmode="numeric" placeholder="Enter current PIN">' +
                '<label class="fp-admin-label fp-admin-label-top" for="fp-new-pin">New PIN</label>' +
                '<input id="fp-new-pin" class="fp-admin-text" type="password" inputmode="numeric" placeholder="Enter new PIN">' +
                '<label class="fp-admin-label fp-admin-label-top" for="fp-confirm-pin">Confirm New PIN</label>' +
                '<input id="fp-confirm-pin" class="fp-admin-text" type="password" inputmode="numeric" placeholder="Confirm new PIN">' +
                '<div class="fp-admin-actions"><button id="fp-save-pin" type="button">Change PIN</button></div>' +
                '<div id="fp-pin-status" class="fp-admin-note"></div>' +
              '</div>' +

            '</div>' +
          '</div>' +

        '</div>' +
      '</div>' +
    '</div>';

  host.appendChild(app);
  injectGlobalUiStyles();
  bindGameTouchLock();
  
  // ── Emergency recovery: triple-tap top-left corner ─────────────────
(function setupEmergencyCornerReset() {
  let tapCount = 0;
  let lastTapTime = 0;

  function inHotspot(clientX, clientY) {
    return clientX <= 120 && clientY <= 120;
  }

  function triggerEmergencyReset() {
    tapCount = 0;

    if (!window.confirm("Emergency reset all settings and reload?")) return;

    localStorage.removeItem(STORAGE_KEYS.settings);
    localStorage.removeItem(STORAGE_KEYS.leaderboard);
    location.reload();
  }

  function handleTap(clientX, clientY) {
    if (!inHotspot(clientX, clientY)) {
      tapCount = 0;
      return;
    }

    const now = Date.now();

    if (now - lastTapTime > 700) {
      tapCount = 0;
    }

    tapCount += 1;
    lastTapTime = now;

    if (tapCount >= 3) {
      triggerEmergencyReset();
    }
  }

  document.addEventListener("touchstart", function(e) {
    const t = e.touches && e.touches[0];
    if (!t) return;
    handleTap(t.clientX, t.clientY);
  }, { passive: true });

  document.addEventListener("click", function(e) {
    handleTap(e.clientX, e.clientY);
  });
})();

  // ─────────────────────────────────────────────────────────────────────────────
  // Element refs
  // ─────────────────────────────────────────────────────────────────────────────
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
    statusFlash: app.querySelector("#fp-status-flash"),
    roundPill: app.querySelector("#fp-round-pill"),
    roundTransition: app.querySelector("#fp-round-transition"),
    roundTransitionKicker: app.querySelector("#fp-round-transition-kicker"),
    roundTransitionTitle: app.querySelector("#fp-round-transition-title"),
    roundTransitionCopy: app.querySelector("#fp-round-transition-copy"),
    name: app.querySelector("#fp-name"),
    keys: app.querySelector("#fp-keys"),
    player: app.querySelector("#fp-player"),
    liveLeaderboard: app.querySelector("#fp-live-leaderboard"),
    firstPlaceBanner: app.querySelector("#fp-first-place-banner"),
    headerLogoWrap: app.querySelector("#fp-header-logo-wrap"),
    headerLogo: app.querySelector("#fp-header-logo"),
    adminButton: app.querySelector("#fp-admin"),
    leaderboard: app.querySelector("#fp-leaderboard"),
    adminModal: app.querySelector("#fp-admin-modal"),
    adminBackdrop: app.querySelector("#fp-admin-backdrop"),
    adminLock: app.querySelector("#fp-admin-lock"),
    adminUI: app.querySelector("#fp-admin-ui"),
    adminPin: app.querySelector("#fp-admin-pin"),
    adminPinDisplay: app.querySelector("#fp-admin-pin-display"),
    adminPinKeys: app.querySelector("#fp-admin-pin-keys"),
    adminUnlock: app.querySelector("#fp-admin-unlock"),
    adminCloseLock: app.querySelector("#fp-admin-close-lock"),
    adminClose: app.querySelector("#fp-admin-close"),
    winTargetsWrap: app.querySelector("#fp-win-targets"),
    winTargets: [...app.querySelectorAll("[data-win]")],
    columnButtons: [...app.querySelectorAll("[data-columns]")],
    cardCountButtons: [...app.querySelectorAll("[data-card-count]")],
    roundButtons: [...app.querySelectorAll("[data-rounds]")],
    difficultyButtons: [...app.querySelectorAll("[data-difficulty]")],
    countdownInput: app.querySelector("#fp-setting-countdown"),
    countdownValue: app.querySelector("#fp-countdown-value"),
    roundTimerInput: app.querySelector("#fp-setting-timer"),
    roundTimerValue: app.querySelector("#fp-timer-value"),
    idleRefreshInput: app.querySelector("#fp-setting-idle-refresh"),
    idleRefreshValue: app.querySelector("#fp-idle-refresh-value"),
    roundTransitionInput: app.querySelector("#fp-setting-round-transition"),
    roundTransitionValue: app.querySelector("#fp-round-transition-value"),
    popupTimingInput: app.querySelector("#fp-setting-popup-timing"),
    popupTimingValue: app.querySelector("#fp-popup-timing-value"),
    idlePreviewInput: app.querySelector("#fp-setting-idle-preview"),
    startPreviewInput: app.querySelector("#fp-setting-start-preview"),
    showCursorInput: app.querySelector("#fp-setting-show-cursor"),
    presetButtons: [...app.querySelectorAll(".fp-preset")],
    winTargetOverrideNote: app.querySelector("#fp-win-target-override-note"),
    boardWidthRange: app.querySelector("#fp-board-width-range"),
    boardWidthValue: app.querySelector("#fp-board-width-value"),
    boardHeightRange: app.querySelector("#fp-board-height-range"),
    boardHeightValue: app.querySelector("#fp-board-height-value"),
    boardGapRange: app.querySelector("#fp-board-gap-range"),
    boardGapValue: app.querySelector("#fp-board-gap-value"),
    bgPicker: app.querySelector("#fp-color-bg-picker"),
bgText: app.querySelector("#fp-color-bg-text"),
textPicker: app.querySelector("#fp-color-text-picker"),
textText: app.querySelector("#fp-color-text-text"),
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
    headerLogoSizeInput: app.querySelector("#fp-header-logo-size"),
    headerLogoSizeValue: app.querySelector("#fp-header-logo-size-value"),
    headerLogoOffsetInput: app.querySelector("#fp-header-logo-offset"),
    headerLogoOffsetValue: app.querySelector("#fp-header-logo-offset-value"),
    hudOffsetInput: app.querySelector("#fp-hud-offset"),
    hudOffsetValue: app.querySelector("#fp-hud-offset-value"),
    boardOffsetInput: app.querySelector("#fp-board-offset"),
    boardOffsetValue: app.querySelector("#fp-board-offset-value"),
    bgUpload: app.querySelector("#fp-bg-upload"),
    bgStatus: app.querySelector("#fp-bg-status"),
    fontUpload: app.querySelector("#fp-font-upload"),
    fontStatus: app.querySelector("#fp-font-status"),
    removeBg: app.querySelector("#fp-remove-bg"),
    removeFont: app.querySelector("#fp-remove-font"),
    exportSettings: app.querySelector("#fp-export-settings"),
    importSettings: app.querySelector("#fp-import-settings"),
    importSettingsFile: app.querySelector("#fp-import-settings-file"),
    settingsTransferStatus: app.querySelector("#fp-settings-transfer-status"),
    currentPin: app.querySelector("#fp-current-pin"),
    newPin: app.querySelector("#fp-new-pin"),
    confirmPin: app.querySelector("#fp-confirm-pin"),
    savePin: app.querySelector("#fp-save-pin"),
    pinStatus: app.querySelector("#fp-pin-status"),
    enterGallery: app.querySelector("#fp-enter-gallery")
  };

  if (el.winTargetOverrideNote) {
    el.winTargetOverrideNote.style.display = "";
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Slider preview — fade admin, show floating confirm bar
  // ─────────────────────────────────────────────────────────────────────────────

  // Inject confirm bar into DOM once
  (function buildConfirmBar() {
    if (document.getElementById("fp-slider-confirm-bar")) return;
    const bar = document.createElement("div");
    bar.id = "fp-slider-confirm-bar";
    bar.innerHTML =
      '<span class="fp-scb-label">Looking good? Apply this change?</span>' +
      '<button id="fp-slider-confirm-apply" type="button">Apply</button>' +
      '<button id="fp-slider-confirm-cancel" type="button">Cancel</button>';
    document.body.appendChild(bar);
  })();

  // Snapshot of state before a slider drag starts so we can revert on cancel
  let sliderSnapshot = null;
  let activeSliderInput = null;

  function takeSliderSnapshot() {
    sliderSnapshot = {
      boardWidthPercent: state.boardWidthPercent,
      boardMinHeight: state.boardMinHeight,
      boardGap: state.boardGap,
      hudOffsetY: state.hudOffsetY,
      boardOffsetY: state.boardOffsetY,
      headerLogoHeight: state.headerLogoHeight,
      headerLogoMaxWidth: state.headerLogoMaxWidth,
      headerLogoOffsetY: state.headerLogoOffsetY
    };
  }

  function revertToSnapshot() {
    if (!sliderSnapshot) return;
    Object.assign(state, sliderSnapshot);
    applyBoardAreaSizing();
    applyHudOffset();
    applyBoardOffset();
    applyHeaderLogoLayout();
    updateSettingsUI();
    rerenderBoardForColumnChange();
  }

  function setSliderActive(active, input) {
    el.adminModal.classList.toggle("fp-slider-active", active);
    const bar = document.getElementById("fp-slider-confirm-bar");
    if (!bar) return;
    if (active) {
      bar.classList.add("show");
      activeSliderInput = input || null;
    } else {
      bar.classList.remove("show");
      activeSliderInput = null;
    }
  }

  // Wire up confirm/cancel buttons
  document.addEventListener("click", function(e) {
    if (e.target && e.target.id === "fp-slider-confirm-apply") {
      persistSettings();
      setSliderActive(false);
      sliderSnapshot = null;
    }
    if (e.target && e.target.id === "fp-slider-confirm-cancel") {
      revertToSnapshot();
      setSliderActive(false);
      sliderSnapshot = null;
    }
  });

  function bindSliderFrost(input) {
    if (!input) return;
    function onStart() {
      takeSliderSnapshot();
      setSliderActive(true, input);
    }
    input.addEventListener("mousedown", onStart);
    input.addEventListener("touchstart", onStart, { passive: true });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utility helpers
  // ─────────────────────────────────────────────────────────────────────────────
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[r]] = [arr[r], arr[i]];
    }
    return arr;
  }

  function saveCachedGalleryUrls(urls) {
    try {
      localStorage.setItem(STORAGE_KEYS.cachedGalleryUrls, JSON.stringify(urls || []));
    } catch (err) {
      console.warn("Could not save cached gallery URLs", err);
    }
  }

  function getCachedGalleryUrls() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.cachedGalleryUrls) || "[]");
      return Array.isArray(raw) ? raw.filter(Boolean) : [];
    } catch (err) {
      return [];
    }
  }

  function saveCachedLastDeck(deck) {
    try {
      localStorage.setItem(STORAGE_KEYS.cachedLastDeck, JSON.stringify(deck || []));
    } catch (err) {
      console.warn("Could not save cached last deck", err);
    }
  }

  function getCachedLastDeck() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.cachedLastDeck) || "[]");
      return Array.isArray(raw) ? raw.filter(Boolean) : [];
    } catch (err) {
      return [];
    }
  }

    function seedCachedGalleryUrlsFromCurrentPage() {
    try {
      const currentUrls = [...new Set(
        [...document.querySelectorAll("#gallery .grid-item img")]
          .map(function(img) { return img.src; })
          .filter(Boolean)
      )];

      if (currentUrls.length) {
        saveCachedGalleryUrls(currentUrls);
      }
    } catch (err) {
      console.warn("Could not seed cached gallery URLs from current page", err);
    }
  }
  
  function buildDeckFromUrls(urls, deckSize) {
    const cleanUrls = [...new Set((urls || []).filter(Boolean))];
    if (!cleanUrls.length) return [];

    const pairsNeeded = deckSize / 2;
    const shuffledUrls = shuffle(cleanUrls.slice());
    let pool = shuffledUrls.slice();

    while (pool.length < pairsNeeded) {
      const extra = shuffle(cleanUrls.slice());
      pool = pool.concat(extra);
    }

    const chosen = pool.slice(0, pairsNeeded);
    return shuffle(chosen.concat(chosen));
  }
  
  function preloadDeckImages(deck) {
  if (!Array.isArray(deck) || !deck.length) return Promise.resolve();

  const uniqueUrls = [...new Set(deck.filter(Boolean))];

  return Promise.all(
    uniqueUrls.map(function(src) {
      return new Promise(function(resolve) {
        const img = new Image();

        function done() {
          resolve();
        }

        img.onload = done;
        img.onerror = done;

        img.src = src;

        if (img.complete) {
          resolve();
        }
      });
    })
  );
}

  function slugifyFontName(name) {
    return String(name || "Custom Font")
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9]+/gi, " ")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "") || "custom-font";
  }

  function getFontFormatFromName(name) {
    const lower = String(name || "").toLowerCase();
    if (lower.endsWith(".woff2")) return "woff2";
    if (lower.endsWith(".woff"))  return "woff";
    if (lower.endsWith(".otf"))   return "opentype";
    return "truetype";
  }

  function isSurvivalMode() {
    return state.rounds === "endless" || Number(state.rounds) > 1;
  }

  function isWinTargetOverridden() {
    return state.roundDifficulty === "moreMatches";
  }

  function getCardAspectRatio() { return "4 / 3"; }

  function setWinTargetDisabledUi(disabled) {
    if (el.winTargetsWrap) {
      el.winTargetsWrap.classList.toggle("is-disabled", disabled);
      el.winTargetsWrap.setAttribute("aria-disabled", disabled ? "true" : "false");
    }
    el.winTargets.forEach(function(btn) {
      btn.classList.toggle("disabled", disabled);
      btn.disabled = disabled;
      btn.setAttribute("aria-disabled", disabled ? "true" : "false");
      btn.tabIndex = disabled ? -1 : 0;
    });
    if (el.winTargetOverrideNote) {
      el.winTargetOverrideNote.classList.toggle("show", disabled);
      el.winTargetOverrideNote.setAttribute("aria-hidden", disabled ? "false" : "true");
    }
  }

  function getMaxRoundsValue() {
    return state.rounds === "endless" ? Infinity : Number(state.rounds || 1);
  }

  function getMoreMatchesTarget(roundNumber, deckSize) {
    const pattern = [1, 2, 4, 6, 8, 10, 12];
    const desired = pattern[Math.min(pattern.length - 1, Math.max(0, roundNumber - 1))];
    return Math.max(1, Math.min(desired, deckSize / 2));
  }

  function getActiveWinTargetForDeck(deckSize, roundNumber) {
    if (isWinTargetOverridden()) return getMoreMatchesTarget(roundNumber, deckSize);
    if (state.winTarget === "all") return deckSize / 2;
    return Number(state.winTarget || 1);
  }

  function getWinTargetLabelFor(deckSize, roundNumber) {
    const t = getActiveWinTargetForDeck(deckSize, roundNumber);
    if (t >= deckSize / 2) return "All Matches";
    return t + " Match" + (t > 1 ? "es" : "");
  }

  function getTitleForTarget(deckSize, roundNumber) {
    return getActiveWinTargetForDeck(deckSize, roundNumber) > 1 ? "Find the Matches" : "Find the Match";
  }

  function updateTitleForCurrentTarget() {
    const deckSize = state.deck.length || state.activeCardCount || state.cardCount;
    const title = getTitleForTarget(deckSize, state.currentRound);
    const node = app.querySelector("#fp-title");
    if (node) node.textContent = title;
    if (el.head) el.head.textContent = title;
  }

  function getClosestCardCountIndex(count) {
    const exact = CARD_COUNTS.indexOf(count);
    if (exact > -1) return exact;
    let best = 0, bestDiff = Infinity;
    CARD_COUNTS.forEach(function(v, i) {
      const d = Math.abs(v - count);
      if (d < bestDiff) { bestDiff = d; best = i; }
    });
    return best;
  }

  function getRoundConfig(roundNumber) {
    let timer = state.roundTime, cardCount = state.cardCount;
    if (!isSurvivalMode()) return { timer, cardCount };
    if (state.roundDifficulty === "lessTime") timer = Math.max(5, state.roundTime - ((roundNumber - 1) * 2));
    if (state.roundDifficulty === "moreCards") {
      const si = getClosestCardCountIndex(state.cardCount);
      cardCount = CARD_COUNTS[Math.min(CARD_COUNTS.length - 1, si + (roundNumber - 1))];
    }
    return { timer, cardCount };
  }

  function getCurrentLeaderboardCategory() {
    const col = "columns:" + state.columns;
    if (isSurvivalMode()) return "survival|" + state.roundDifficulty + "|baseTarget:" + state.winTarget + "|baseCards:" + state.cardCount + "|" + col;
    return "goal|target:" + state.winTarget + "|cards:" + state.cardCount + "|" + col;
  }

  function getCurrentLeaderboardHeading() {
    return isSurvivalMode() ? "Survival Leaderboard" : "Leaderboard";
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Apply functions
  // ─────────────────────────────────────────────────────────────────────────────
  function applyCustomFont(dataUrl, fileName) {
    state.customFontDataUrl = dataUrl || "";
    state.customFontFileName = fileName || "";
    state.customFontFamily = state.customFontDataUrl
      ? "fp-user-font-" + slugifyFontName(fileName || "custom") : "";

    const existing = document.getElementById("fp-custom-font-style");
    if (existing) existing.remove();

    if (!state.customFontDataUrl || !state.customFontFamily) {
      app.style.setProperty("--fp-font-family", "Arial, sans-serif");
      if (el.fontStatus) el.fontStatus.textContent = "Using default font.";
      return;
    }
    const fmt = getFontFormatFromName(fileName);
    const style = document.createElement("style");
    style.id = "fp-custom-font-style";
    style.textContent =
      '@font-face{font-family:"' + state.customFontFamily + '";src:url("' +
      String(state.customFontDataUrl).replace(/"/g,'\\"') + '") format("' + fmt + '");' +
      'font-weight:normal;font-style:normal;font-display:swap;}' +
      '#fp-game,#fp-game *,#fp-game button,#fp-game input,#fp-game select,#fp-game textarea{' +
      'font-family:"' + state.customFontFamily + '",Arial,sans-serif !important;}';
    document.head.appendChild(style);
    app.style.setProperty("--fp-font-family", '"' + state.customFontFamily + '",Arial,sans-serif');
    if (el.fontStatus) el.fontStatus.textContent = "Custom font loaded: " + (fileName || "Uploaded font");
  }

  function applyHeaderLogoLayout() {
    const h = Math.max(24, Math.min(220, state.headerLogoHeight || 56));
    const mw = Math.max(80, Math.min(500, state.headerLogoMaxWidth || 240));
    const off = Math.max(0, Math.min(500, state.headerLogoOffsetY || 200));
    state.headerLogoHeight = h;
    state.headerLogoMaxWidth = mw;
    state.headerLogoOffsetY = off;
    app.style.setProperty("--fp-header-logo-height", h + "px");
    app.style.setProperty("--fp-header-logo-max-width", mw + "px");
    app.style.setProperty("--fp-header-logo-offset-y", (-off) + "px");
  }

  function applyHudOffset() {
    const off = Math.max(-500, Math.min(500, state.hudOffsetY || 0));
    state.hudOffsetY = off;
    app.style.setProperty("--fp-hud-offset-y", off + "px");
  }

  function applyBoardOffset() {
    const off = Math.max(-500, Math.min(500, state.boardOffsetY || 0));
    state.boardOffsetY = off;
    app.style.setProperty("--fp-board-offset-y", off + "px");
    if (el.boardShell) {
      el.boardShell.style.transform = "";
      el.boardShell.style.marginTop = off + "px";
    }
    
    cacheBoardRect();
    positionOverlaysOnBoard();
  }

  function applyBoardAreaSizing() {
    state.boardWidthPercent = Math.max(60, Math.min(100, state.boardWidthPercent || 100));
    state.boardMinHeight   = Math.max(0, Math.min(1400, state.boardMinHeight || 0));
    state.boardGap         = Math.max(6, Math.min(30, state.boardGap || 16));
    app.style.setProperty("--fp-board-width", state.boardWidthPercent + "%");
    app.style.setProperty("--fp-board-max-width", "none");
    app.style.setProperty("--fp-board-min-height", state.boardMinHeight + "px");
    app.style.setProperty("--fp-board-gap", state.boardGap + "px");
    if (el.boardShell) {
      el.boardShell.style.width = state.boardWidthPercent + "%";
      el.boardShell.style.maxWidth = "none";
      el.boardShell.style.minHeight = state.boardMinHeight + "px";
      el.boardShell.style.height = state.boardMinHeight > 0 ? state.boardMinHeight + "px" : "";
    }
    if (el.board) {
  el.board.style.gap = state.boardGap + "px";
  el.board.style.width = "100%";
  el.board.style.height = state.boardMinHeight > 0 ? "100%" : "";
}

cacheBoardRect();
positionOverlaysOnBoard();
}

  // ─────────────────────────────────────────────────────────────────────────────
  // Leaderboard
  // ─────────────────────────────────────────────────────────────────────────────
  function getScores() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.leaderboard) || "[]");
  }

  function formatLeaderboardEntry(entry, index, live) {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
    const cls = live && index === 0 ? ' class="fp-live-score gold"' : live ? ' class="fp-live-score"' : "";
    if (entry.mode === "survival") {
      const rt = "R" + entry.r;
      const line = medal ? medal+" "+entry.n+" "+rt+" "+entry.t.toFixed(2)+"s" : entry.n+" "+rt+" "+entry.t.toFixed(2)+"s";
      return live ? '<div'+cls+'>'+line+"</div>" : "<div>"+(index+1)+". "+entry.n+" – "+rt+" – "+entry.t.toFixed(2)+"s</div>";
    }
    const gl = medal ? medal+" "+entry.n+" "+entry.t.toFixed(2)+"s" : entry.n+" "+entry.t.toFixed(2)+"s";
    return live ? '<div'+cls+'>'+gl+"</div>" : "<div>"+(index+1)+". "+entry.n+" – "+entry.t.toFixed(2)+"s</div>";
  }

  function sortLeaderboardEntries(entries) {
    return entries.sort(function(a,b){
      if (a.mode==="survival"||b.mode==="survival") {
        const ar=Number(a.r||0), br=Number(b.r||0);
        if (br!==ar) return br-ar;
        return Number(a.t||999999)-Number(b.t||999999);
      }
      return Number(a.t||999999)-Number(b.t||999999);
    });
  }

  function getCurrentModeScores() {
    return sortLeaderboardEntries(
      getScores().filter(function(e){ return e.category===getCurrentLeaderboardCategory(); })
    ).slice(0,5);
  }

  function renderLiveLeaderboard() {
    const scores = getCurrentModeScores();
    if (!scores.length) { el.liveLeaderboard.innerHTML=""; return; }
    el.liveLeaderboard.innerHTML = scores.slice(0,3).map(function(item,i){ return formatLeaderboardEntry(item,i,true); }).join("");
  }

  function renderLeaderboard() {
    const scores = getCurrentModeScores();
    renderLiveLeaderboard();
    if (!scores.length) { el.leaderboard.innerHTML=""; return; }
    el.leaderboard.innerHTML = "<h3>"+getCurrentLeaderboardHeading()+"</h3>" +
      scores.map(function(item,i){ return formatLeaderboardEntry(item,i,false); }).join("");
  }

  function flashFirstPlaceBanner(text) {
    el.firstPlaceBanner.textContent = text;
    el.firstPlaceBanner.classList.remove("show");
    void el.firstPlaceBanner.offsetWidth;
    el.firstPlaceBanner.classList.add("show");
  }

  function saveScore(payload) {
    const all = getScores();
    const cat = payload.category;
    const old = sortLeaderboardEntries(all.filter(function(e){ return e.category===cat; }));
    const oldFirst = old.length ? old[0] : null;
    const untouched = all.filter(function(e){ return e.category!==cat; });
    let merged = sortLeaderboardEntries(old.concat([payload])).slice(0,5);
    localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(untouched.concat(merged)));
    renderLeaderboard();
    const newFirst = merged.length ? merged[0] : null;
    if (newFirst && newFirst.n===payload.n) {
      if (payload.mode==="survival") {
        const or = oldFirst ? Number(oldFirst.r||0) : -1;
        if (!oldFirst || Number(payload.r||0)>or || (Number(payload.r||0)===or && Number(payload.t||999999)<Number(oldFirst.t||999999)))
          flashFirstPlaceBanner("New 1st Place! "+payload.n+" – R"+payload.r+" – "+payload.t.toFixed(2)+"s");
      } else {
        if (!oldFirst || Number(payload.t||999999)<Number(oldFirst.t||999999))
          flashFirstPlaceBanner("New 1st Place! "+payload.n+" – "+payload.t.toFixed(2)+"s");
      }
    }
  }

  function clearLeaderboard() {
    localStorage.removeItem(STORAGE_KEYS.leaderboard);
    renderLeaderboard();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Color utilities
  // ─────────────────────────────────────────────────────────────────────────────
  function hexToRgb(hex) {
    const clean = hex.replace("#","").trim();
    const n = clean.length===3 ? clean.split("").map(function(c){return c+c;}).join("") : clean;
    const iv = parseInt(n,16);
    return { r:(iv>>16)&255, g:(iv>>8)&255, b:iv&255 };
  }

  function hexToRgba(hex,alpha) {
    const {r,g,b} = hexToRgb(hex);
    return "rgba("+r+","+g+","+b+","+alpha+")";
  }

  function isValidHex(v) { return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test((v||"").trim()); }

  function normalizeHex(v, fallback) {
    const t = (v||"").trim();
    if (!isValidHex(t)) return fallback;
    if (t.length===4) return ("#"+t[1]+t[1]+t[2]+t[2]+t[3]+t[3]).toUpperCase();
    return t.toUpperCase();
  }

  function escapeForCssUrl(v) { return String(v).replace(/"/g,'\\"'); }

  // ─────────────────────────────────────────────────────────────────────────────
  // Settings persist / load
  // ─────────────────────────────────────────────────────────────────────────────
  function buildSettingsPayload() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: {
        winTarget: state.winTarget, startCountdown: state.startCountdown,
        roundTime: state.roundTime, idleRefreshSeconds: state.idleRefreshSeconds,
        popupTimingSecs: state.popupTimingSecs,
        roundTransitionSecs: state.roundTransitionSecs,
        cardCount: state.cardCount, columns: state.columns,
        boardWidthPercent: state.boardWidthPercent, boardMinHeight: state.boardMinHeight,
        boardGap: state.boardGap, idlePreview: state.idlePreview,
        startPreview: state.startPreview, adminPin: state.adminPin,
        showCursor: state.showCursor, hudOffsetY: state.hudOffsetY,
        boardOffsetY: state.boardOffsetY, rounds: state.rounds,
        roundDifficulty: state.roundDifficulty, theme: state.theme,
        logoUrl: state.logoUrl, headerLogoUrl: state.headerLogoUrl,
        headerLogoHeight: state.headerLogoHeight, headerLogoMaxWidth: state.headerLogoMaxWidth,
        headerLogoOffsetY: state.headerLogoOffsetY, bgImageUrl: state.bgImageUrl,
        customFontDataUrl: state.customFontDataUrl, customFontFileName: state.customFontFileName
      }
    };
  }

  function persistSettings() {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(buildSettingsPayload().settings));
  }

  function applySettingsObject(saved) {
    if (!saved || typeof saved!=="object") return;
    if (saved.winTarget==="all"||[1,2,3,4].indexOf(saved.winTarget)>-1) state.winTarget=saved.winTarget;
    if (typeof saved.startCountdown==="number") state.startCountdown=Math.max(0,Math.min(10,saved.startCountdown));
    if (typeof saved.roundTime==="number") state.roundTime=Math.max(5,Math.min(120,saved.roundTime));
    if (typeof saved.idleRefreshSeconds==="number") state.idleRefreshSeconds=Math.max(0,Math.min(600,saved.idleRefreshSeconds));
    if (typeof saved.popupTimingSecs==="number") state.popupTimingSecs=Math.max(2,Math.min(15,saved.popupTimingSecs));
    if (typeof saved.roundTransitionSecs==="number") state.roundTransitionSecs=Math.max(1,Math.min(8,saved.roundTransitionSecs));
    if (CARD_COUNTS.indexOf(saved.cardCount)>-1) state.cardCount=saved.cardCount;
    state.columns = COLUMN_OPTIONS.indexOf(saved.columns)>-1 ? saved.columns : DEFAULTS.columns;
    state.boardWidthPercent = typeof saved.boardWidthPercent==="number" ? Math.max(60,Math.min(100,saved.boardWidthPercent)) : DEFAULTS.boardWidthPercent;
    state.boardMinHeight = typeof saved.boardMinHeight==="number" ? Math.max(0,Math.min(1400,saved.boardMinHeight)) : DEFAULTS.boardMinHeight;
    state.boardGap = typeof saved.boardGap==="number" ? Math.max(6,Math.min(30,saved.boardGap)) : DEFAULTS.boardGap;
    if (typeof saved.idlePreview==="boolean") state.idlePreview=saved.idlePreview;
    if (typeof saved.startPreview==="boolean") state.startPreview=saved.startPreview;
    if (typeof saved.showCursor==="boolean") state.showCursor=saved.showCursor;
    if (typeof saved.adminPin==="string"&&saved.adminPin.trim()) state.adminPin=saved.adminPin.trim();
    state.hudOffsetY = typeof saved.hudOffsetY==="number" ? Math.max(-500,Math.min(500,saved.hudOffsetY)) : 0;
    state.boardOffsetY = typeof saved.boardOffsetY==="number" ? Math.max(-500,Math.min(500,saved.boardOffsetY))
      : typeof saved.topOffsetY==="number" ? Math.max(-500,Math.min(500,saved.topOffsetY)) : 0;
    state.rounds = (saved.rounds==="endless"||[1,2,3,5].indexOf(saved.rounds)>-1) ? saved.rounds : DEFAULTS.rounds;
    state.roundDifficulty = ROUND_DIFFICULTIES.indexOf(saved.roundDifficulty)>-1 ? saved.roundDifficulty : DEFAULTS.roundDifficulty;
    if (saved.theme&&typeof saved.theme==="object") {
      state.theme = {
  bg: normalizeHex(saved.theme.bg, DEFAULTS.theme.bg),
  accent: normalizeHex(saved.theme.accent, DEFAULTS.theme.accent),
  accentText: normalizeHex(saved.theme.accentText, DEFAULTS.theme.accentText),
  card: normalizeHex(saved.theme.card, DEFAULTS.theme.card),
  panel: normalizeHex(saved.theme.panel, DEFAULTS.theme.panel),
  text: normalizeHex(saved.theme.text, DEFAULTS.theme.text)
};
    }
    state.logoUrl = (typeof saved.logoUrl==="string"&&saved.logoUrl.trim()) ? saved.logoUrl : DEFAULTS.logoUrl;
    state.headerLogoUrl = (typeof saved.headerLogoUrl==="string"&&saved.headerLogoUrl.trim()) ? saved.headerLogoUrl : DEFAULTS.headerLogoUrl;
    state.headerLogoHeight = typeof saved.headerLogoHeight==="number" ? Math.max(24,Math.min(220,saved.headerLogoHeight)) : DEFAULTS.headerLogoHeight;
    state.headerLogoMaxWidth = typeof saved.headerLogoMaxWidth==="number" ? Math.max(80,Math.min(500,saved.headerLogoMaxWidth)) : DEFAULTS.headerLogoMaxWidth;
    state.headerLogoOffsetY = typeof saved.headerLogoOffsetY==="number" ? Math.max(0,Math.min(500,saved.headerLogoOffsetY)) : DEFAULTS.headerLogoOffsetY;
    state.bgImageUrl = typeof saved.bgImageUrl==="string" ? saved.bgImageUrl : DEFAULTS.bgImageUrl;
    state.customFontDataUrl = typeof saved.customFontDataUrl==="string" ? saved.customFontDataUrl : "";
    state.customFontFileName = typeof saved.customFontFileName==="string" ? saved.customFontFileName : "";
    state.customFontFamily = "";
  }

  function loadSettings() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || "null");
    if (saved) applySettingsObject(saved);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Apply logo / bg / theme
  // ─────────────────────────────────────────────────────────────────────────────
  function applyLogo(url) {
    state.logoUrl = url || DEFAULTS.logoUrl;
    app.style.setProperty("--fp-logo-url", 'url("'+escapeForCssUrl(state.logoUrl)+'")');
    el.logoStatus.textContent = state.logoUrl===DEFAULTS.logoUrl ? "Using default card-back logo." : "Custom card-back logo loaded and saved.";
  }

  function applyHeaderLogo(url) {
    state.headerLogoUrl = url || DEFAULTS.headerLogoUrl;
    el.headerLogo.src = state.headerLogoUrl || DEFAULTS.headerLogoUrl;
    el.headerLogoWrap.classList.remove("hidden");
    el.headerLogoStatus.textContent = state.headerLogoUrl===DEFAULTS.headerLogoUrl ? "Using default header logo." : "Custom header logo loaded and saved.";
    if (!state.headerLogoUrl) { state.headerLogoUrl = DEFAULTS.headerLogoUrl; }
  }

  function applyBackgroundImage(url) {
    state.bgImageUrl = url || "";
    app.style.setProperty("--fp-bg-image", state.bgImageUrl ? 'url("'+escapeForCssUrl(state.bgImageUrl)+'")' : "none");
    el.bgStatus.textContent = state.bgImageUrl ? "Custom background image loaded and saved." : "Using color background only.";
  }

  function applyThemeColors(colors) {
  const bg = normalizeHex(colors.bg, DEFAULTS.theme.bg);
  const accent = normalizeHex(colors.accent, DEFAULTS.theme.accent);
  const accentText = normalizeHex(colors.accentText, DEFAULTS.theme.accentText);
  const card = normalizeHex(colors.card, DEFAULTS.theme.card);
  const panel = normalizeHex(colors.panel, DEFAULTS.theme.panel);
  const text = normalizeHex(colors.text, DEFAULTS.theme.text);

  state.theme = { bg, accent, accentText, card, panel, text };

  app.style.setProperty("--fp-bg", bg);
  app.style.setProperty("--fp-text", text);
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
}

  function applyThemePreset(name) {
  if (name==="dark") {
    applyThemeColors({
      bg:"#0F1115",
      accent:"#FFFFFF",
      accentText:"#111111",
      card:"#151821",
      panel:"#1C1F27",
      text:"#FFFFFF"
    });
  } else if (name==="purple") {
    applyThemeColors({
      bg:"#0D1320",
      accent:"#6852F4",
      accentText:"#FFFFFF",
      card:"#11182B",
      panel:"#1A2040",
      text:"#FFFFFF"
    });
  } else if (name==="gold") {
    applyThemeColors({
      bg:"#101010",
      accent:"#D4AF37",
      accentText:"#111111",
      card:"#171717",
      panel:"#23201A",
      text:"#F5E7C2"
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

  el.textPicker.value = state.theme.text;
  el.textText.value = state.theme.text;
}

  function applyCursorMode() {
    app.classList.toggle("fp-show-cursor", !!state.showCursor);
  }
  
    function syncAllVisualsImmediately(options) {
    options = options || {};

    const preserveMatched = !!options.preserveMatched;
    const rerenderBoard = options.rerenderBoard !== false;
    const boardShowAll = typeof options.showAll === "boolean"
      ? options.showAll
      : (!state.gameActive && state.idlePreview);

    // Re-apply all visual/state-driven UI immediately
    applyLogo(state.logoUrl);
    applyHeaderLogo(state.headerLogoUrl || DEFAULTS.headerLogoUrl);
    applyHeaderLogoLayout();
    applyHudOffset();
    applyBoardOffset();
    applyBoardAreaSizing();
    applyBackgroundImage(state.bgImageUrl);
    applyCustomFont(state.customFontDataUrl, state.customFontFileName);
    applyCursorMode();

    // Re-apply theme last so CSS vars are definitely current
    app.style.setProperty("--fp-bg", state.theme.bg);
    app.style.setProperty("--fp-text", state.theme.text);
    app.style.setProperty("--fp-panel", hexToRgba(state.theme.panel, 0.88));
    app.style.setProperty("--fp-panel-border", hexToRgba(state.theme.panel, 1));
    app.style.setProperty("--fp-panel-solid", state.theme.panel);
    app.style.setProperty("--fp-card-front", state.theme.card);
    app.style.setProperty("--fp-card-front-border", hexToRgba("#FFFFFF", 0.1));
    app.style.setProperty("--fp-chip-bg", hexToRgba("#FFFFFF", 0.1));
    app.style.setProperty("--fp-chip-border", hexToRgba("#FFFFFF", 0.18));
    app.style.setProperty("--fp-overlay", hexToRgba(state.theme.bg, 0.48));
    app.style.setProperty("--fp-countdown-overlay", hexToRgba(state.theme.bg, 0.72));
    app.style.setProperty("--fp-key-bg", hexToRgba("#FFFFFF", 0.08));
    app.style.setProperty("--fp-key-border", hexToRgba("#FFFFFF", 0.14));
    app.style.setProperty("--fp-accent", state.theme.accent);
    app.style.setProperty("--fp-accent-text", state.theme.accentText);
    app.style.setProperty("--fp-match-ring", hexToRgba(state.theme.accent, 0.95));
    app.style.setProperty("--fp-match-glow", hexToRgba(state.theme.accent, 0.45));

    syncColorInputsFromTheme();
    updateSettingsUI();
    updateRoundPill();
    updateTitleForCurrentTarget();
    updateBoardShellMode();

    // Keep timer display in sync immediately
    setTimerDisplay(state.gameActive ? state.activeRoundTime : state.roundTime);

    // Force board layout/UI to update now, even if no new round/idle refresh happens
    applyBoardLayout();

    if (rerenderBoard && state.deck && state.deck.length) {
      renderBoard(boardShowAll, preserveMatched && state.gameActive);
    }

    cacheBoardRect();
    positionOverlaysOnBoard();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UI update helpers
  // ─────────────────────────────────────────────────────────────────────────────
  function updateRoundPill() {
    if (!isSurvivalMode()) { el.roundPill.classList.add("hidden"); el.roundPill.textContent=""; return; }
    const total = state.rounds==="endless" ? "∞" : state.rounds;
    const deckSize = state.activeCardCount || state.cardCount;
    const tl = getWinTargetLabelFor(deckSize,state.currentRound).replace(" Matches","").replace(" Match","");
    el.roundPill.textContent = "ROUND "+state.currentRound+"/"+total+" • TARGET "+tl;
    el.roundPill.classList.remove("hidden");
  }

  function updateSettingsUI() {
    el.winTargets.forEach(function(b){ b.classList.toggle("active", String(state.winTarget)===b.getAttribute("data-win")); });
    setWinTargetDisabledUi(isWinTargetOverridden());
    el.columnButtons.forEach(function(b){ b.classList.toggle("active", String(state.columns)===b.getAttribute("data-columns")); });
    el.cardCountButtons.forEach(function(b){
      const isMax = b.getAttribute("data-card-count") === "30";
      const shouldDisable = isMax && state.roundDifficulty === "moreCards";
      b.classList.toggle("active", String(state.cardCount)===b.getAttribute("data-card-count") && !shouldDisable);
      b.classList.toggle("disabled", shouldDisable);
      b.disabled = shouldDisable;
    });
    el.roundButtons.forEach(function(b){ b.classList.toggle("active", String(state.rounds)===b.getAttribute("data-rounds")); });
    el.difficultyButtons.forEach(function(b){
      const isMoreCards = b.getAttribute("data-difficulty") === "moreCards";
      const shouldDisable = isMoreCards && state.cardCount === 30;
      b.classList.toggle("active", String(state.roundDifficulty)===b.getAttribute("data-difficulty") && !shouldDisable);
      b.classList.toggle("disabled", shouldDisable);
      b.disabled = shouldDisable;
    });

    el.countdownInput.value=state.startCountdown;
    if (el.countdownValue) el.countdownValue.textContent=state.startCountdown+"s";
    el.roundTimerInput.value=state.roundTime;
    if (el.roundTimerValue) el.roundTimerValue.textContent=state.roundTime+"s";
    el.idleRefreshInput.value=state.idleRefreshSeconds;
    if (el.idleRefreshValue) el.idleRefreshValue.textContent=state.idleRefreshSeconds+"s";
    if (el.roundTransitionInput) el.roundTransitionInput.value=state.roundTransitionSecs;
    if (el.roundTransitionValue) el.roundTransitionValue.textContent=state.roundTransitionSecs+"s";
    if (el.popupTimingInput) el.popupTimingInput.value=state.popupTimingSecs;
    if (el.popupTimingValue) el.popupTimingValue.textContent=state.popupTimingSecs+"s";
    el.idlePreviewInput.checked=state.idlePreview;
    el.startPreviewInput.checked=state.startPreview;
    el.showCursorInput.checked=state.showCursor;

    // Sliders: Header Logo Size
    if (el.headerLogoSizeInput) el.headerLogoSizeInput.value=state.headerLogoHeight;
    if (el.headerLogoSizeValue) el.headerLogoSizeValue.textContent=state.headerLogoHeight+"px";
    // Sliders: Header Logo Offset
    if (el.headerLogoOffsetInput) el.headerLogoOffsetInput.value=state.headerLogoOffsetY;
    if (el.headerLogoOffsetValue) el.headerLogoOffsetValue.textContent=state.headerLogoOffsetY+"px";
    // Sliders: HUD offset
    if (el.hudOffsetInput) el.hudOffsetInput.value=state.hudOffsetY;
    if (el.hudOffsetValue) el.hudOffsetValue.textContent=state.hudOffsetY+"px";
    // Sliders: Board offset
    if (el.boardOffsetInput) el.boardOffsetInput.value=state.boardOffsetY;
    if (el.boardOffsetValue) el.boardOffsetValue.textContent=state.boardOffsetY+"px";

    if (el.boardWidthRange) el.boardWidthRange.value=state.boardWidthPercent;
    if (el.boardWidthValue) el.boardWidthValue.textContent=state.boardWidthPercent+"%";
    if (el.boardHeightRange) el.boardHeightRange.value=state.boardMinHeight;
    if (el.boardHeightValue) el.boardHeightValue.textContent=state.boardMinHeight+"px";
    if (el.boardGapRange) el.boardGapRange.value=state.boardGap;
    if (el.boardGapValue) el.boardGapValue.textContent=state.boardGap+"px";

    syncColorInputsFromTheme();
    el.logoStatus.textContent = state.logoUrl===DEFAULTS.logoUrl ? "Using default card-back logo." : "Custom card-back logo loaded and saved.";
    el.headerLogoStatus.textContent = state.headerLogoUrl===DEFAULTS.headerLogoUrl ? "Using default header logo." : "Custom header logo loaded and saved.";
    el.bgStatus.textContent = state.bgImageUrl ? "Custom background image loaded and saved." : "Using color background only.";
    el.fontStatus.textContent = state.customFontDataUrl ? "Custom font loaded: "+(state.customFontFileName||"Uploaded font") : "Using default font.";
    el.settingsTransferStatus.textContent = "Export your settings to move them to another monitor, then import that JSON there.";
    el.currentPin.value=""; el.newPin.value=""; el.confirmPin.value=""; el.pinStatus.textContent="";
    updateTitleForCurrentTarget();
  }

  function openAdmin() {
    el.adminModal.classList.remove("hidden");
    el.adminLock.classList.remove("hidden");
    el.adminUI.classList.add("hidden");
    el.adminPin.value="";
    updateAdminPinUI();
    buildAdminPinKeyboard();
  }

  function closeAdmin() {
    state.adminUnlocked=false;
    el.adminModal.classList.add("hidden");
    el.adminLock.classList.remove("hidden");
    el.adminUI.classList.add("hidden");
    el.adminPin.value="";
    updateAdminPinUI();
    setSliderActive(false);
    sliderSnapshot = null;
    const bar = document.getElementById("fp-slider-confirm-bar");
    if (bar) bar.classList.remove("show");
  }

  function unlockAdmin() {
    if (el.adminPin.value===state.adminPin) {
      state.adminUnlocked=true;
      el.adminLock.classList.add("hidden");
      el.adminUI.classList.remove("hidden");
      updateSettingsUI();
    } else {
      el.adminPin.value="";
      updateAdminPinUI();
      el.adminPinDisplay.textContent="INCORRECT PIN";
      el.adminPinDisplay.classList.add("empty");
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Board layout
  // ─────────────────────────────────────────────────────────────────────────────
  function getGridForCount(count) {
    const cols = state.columns || DEFAULTS.columns;
    return { cols, rows: Math.ceil(count/cols) };
  }

  function updateBoardShellMode() {
    el.boardShell.classList.toggle("play-mode", !state.gameActive && el.center.classList.contains("hidden"));
    el.boardShell.classList.toggle("entry-open", !el.center.classList.contains("hidden"));
  }

  function applyBoardLayout() {
    const count = state.deck.length || state.activeCardCount || state.cardCount;
    const grid = getGridForCount(count);
    const fixed = state.boardMinHeight > 0;
    el.board.style.display="grid";
    el.board.style.width="100%";
    el.board.style.gap=state.boardGap+"px";
    el.board.style.gridTemplateColumns="repeat("+grid.cols+",minmax(0,1fr))";
    el.board.style.gridAutoFlow="row";
    if (fixed) {
      el.board.style.height="100%";
      el.board.style.gridTemplateRows="repeat("+grid.rows+",minmax(0,1fr))";
      el.board.style.gridAutoRows="1fr";
      el.board.style.alignItems="stretch"; el.board.style.alignContent="stretch";
    } else {
      el.board.style.height="";
      el.board.style.gridTemplateRows="none";
      el.board.style.removeProperty("grid-template-rows");
      el.board.style.gridAutoRows="auto";
      el.board.style.alignItems="start"; el.board.style.alignContent="start";
    }
    if (el.boardShell) {
      el.boardShell.style.width=state.boardWidthPercent+"%";
      el.boardShell.style.maxWidth="none";
      el.boardShell.style.minHeight=state.boardMinHeight+"px";
      el.boardShell.style.height=fixed ? state.boardMinHeight+"px" : "";
    }
    el.board.setAttribute("data-card-count",String(count));
    el.board.setAttribute("data-columns",String(grid.cols));
    app.setAttribute("data-columns",String(grid.cols));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Deck building
  // ─────────────────────────────────────────────────────────────────────────────
    async function buildDeck(cardCountOverride) {
    const deckSize = cardCountOverride || state.cardCount;
    const cb = (location.href.indexOf("?") > -1 ? "&" : "?") + "t=" + Date.now();

    // 1) Try live fetch first
    try {
      const html = await fetch(location.href + cb, { cache: "no-store" }).then(function(r) {
        if (!r.ok) throw new Error("Fetch failed with status " + r.status);
        return r.text();
      });

      const doc = new DOMParser().parseFromString(html, "text/html");
      const urls = [...new Set(
        [...doc.querySelectorAll("#gallery .grid-item img")]
          .map(function(img) { return img.src; })
          .filter(Boolean)
      )];

      if (urls.length) {
        saveCachedGalleryUrls(urls);
        const liveDeck = buildDeckFromUrls(urls, deckSize);
        if (liveDeck.length === deckSize) {
          saveCachedLastDeck(liveDeck);
          return liveDeck;
        }
      }
    } catch (err) {
      console.warn("Live deck fetch failed, trying cached gallery URLs", err);
    }

    // 2) Fall back to cached gallery URL pool
    const cachedUrls = getCachedGalleryUrls();
    if (cachedUrls.length) {
      const cachedDeck = buildDeckFromUrls(cachedUrls, deckSize);
      if (cachedDeck.length === deckSize) {
        saveCachedLastDeck(cachedDeck);
        return cachedDeck;
      }
    }

    // 3) Fall back to last successful deck
    const lastDeck = getCachedLastDeck();
    if (lastDeck.length) {
      if (lastDeck.length === deckSize) {
        return shuffle(lastDeck.slice());
      }

      const rebuiltFromLastDeckUrls = buildDeckFromUrls([...new Set(lastDeck)], deckSize);
      if (rebuiltFromLastDeckUrls.length === deckSize) {
        return rebuiltFromLastDeckUrls;
      }
    }

    // 4) Nothing usable
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Timer
  // ─────────────────────────────────────────────────────────────────────────────
  function setTimerDisplay(v) {
  el.timer.textContent = String(v);
  el.timer.classList.toggle("fp-danger", Number(v) <= 10);
}

  function startRoundTimer() {
    let remaining=state.activeRoundTime;
    setTimerDisplay(remaining);
    clearInterval(state.roundTimerId);
    state.roundTimerId=setInterval(function(){
      remaining-=1;
      setTimerDisplay(remaining);
      if (remaining<=0) loseRound();
    },1000);
  }

  function stopIdleRefreshTimer() { clearInterval(state.idleRefreshTimerId); state.idleRefreshTimerId=0; }

  function startIdleRefreshTimer() {
    stopIdleRefreshTimer();
    if (state.idleRefreshSeconds<=0) return;
    state.idleRefreshTimerId=setInterval(function(){
      if (state.gameActive) return;
      if (!el.adminModal.classList.contains("hidden")) return;
      if (!el.center.classList.contains("hidden")) return;
      prepareDeck(true);
    },state.idleRefreshSeconds*1000);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Name / keyboard
  // ─────────────────────────────────────────────────────────────────────────────
  function updateNameUI() {
    el.name.textContent = state.playerName || "ENTER NAME";
    el.player.textContent = state.playerName ? "Player: "+state.playerName : "";
    el.start.disabled = state.playerName.length < 2;
  }

  function updateAdminPinUI() {
    const v = el.adminPin.value||"";
    if (!v.length) { el.adminPinDisplay.textContent="ENTER PIN"; el.adminPinDisplay.classList.add("empty"); }
    else { el.adminPinDisplay.textContent="• ".repeat(v.length).trim(); el.adminPinDisplay.classList.remove("empty"); }
  }

  function pressAdminPinKey(value) {
    if (value==="CLEAR") el.adminPin.value="";
    else if (value==="←") el.adminPin.value=el.adminPin.value.slice(0,-1);
    else if (/^\d$/.test(value)&&el.adminPin.value.length<8) el.adminPin.value+=value;
    updateAdminPinUI();
  }

  function buildAdminPinKeyboard() {
    el.adminPinKeys.innerHTML="";
    ["1","2","3","4","5","6","7","8","9","CLEAR","0","←"].forEach(function(key){
      const b=document.createElement("div");
      b.className="fp-admin-pin-key";
      b.textContent=key==="←"?"⌫":key;
      b.onclick=function(){ pressAdminPinKey(key); };
      el.adminPinKeys.appendChild(b);
    });
  }

  function pressKey(value) {
    if (value==="←") state.playerName=state.playerName.slice(0,-1);
    else if (value==="CLEAR") state.playerName="";
    else if (value==="SPACE") {
      if (state.playerName.length<12 && state.playerName.length && state.playerName[state.playerName.length-1]!==" ")
        state.playerName+=" ";
    } else if (state.playerName.length<12) state.playerName+=value;
    updateNameUI();
  }

  function buildKeyboard() {
    const rows=[["Q","W","E","R","T","Y","U","I","O","P"],["A","S","D","F","G","H","J","K","L","←"],["Z","X","C","V","B","N","M"]];
    el.keys.innerHTML="";

    rows.forEach(function(row, rowIndex){
      if (rowIndex < 2) {
        row.forEach(function(key){
          const b=document.createElement("div");
          b.className="fp-key";
          b.dataset.key=key;
          b.textContent=key==="←"?"⌫":key;
          b.onclick=function(){ flashKey(key); pressKey(key); };
          el.keys.appendChild(b);
        });
      } else {
        const rowWrap = document.createElement("div");
        rowWrap.style.cssText =
          "grid-column:1/-1;display:flex;justify-content:center;gap:inherit;";
        row.forEach(function(key){
          const b=document.createElement("div");
          b.className="fp-key";
          b.dataset.key=key;
          b.style.cssText="flex:0 0 calc((100% - 9 * var(--fp-key-gap, 10px)) / 10);max-width:calc((100% - 9 * var(--fp-key-gap, 10px)) / 10);";
          b.textContent=key;
          b.onclick=function(){ flashKey(key); pressKey(key); };
          rowWrap.appendChild(b);
        });
        el.keys.appendChild(rowWrap);
      }
    });

    const sp=document.createElement("div"); sp.className="fp-key bottom-key bottom-left"; sp.dataset.key="SPACE"; sp.textContent="SPACE"; sp.onclick=function(){ flashKey("SPACE"); pressKey("SPACE"); }; el.keys.appendChild(sp);
    const cl=document.createElement("div"); cl.className="fp-key bottom-key bottom-right"; cl.dataset.key="CLEAR"; cl.textContent="CLEAR"; cl.onclick=function(){ flashKey("CLEAR"); pressKey("CLEAR"); }; el.keys.appendChild(cl);
  }

  function flashKey(key) {
    const sel = '[data-key="' + key + '"]';
    const el_key = el.keys.querySelector(sel);
    if (!el_key) return;
    el_key.classList.add("fp-key-active");
    clearTimeout(el_key._flashTimer);
    el_key._flashTimer = setTimeout(function(){ el_key.classList.remove("fp-key-active"); }, 180);
  }

  // Physical keyboard support for name entry
  document.addEventListener("keydown", function(e) {
    if (el.center.classList.contains("hidden")) return;
    if (!el.keys.style.display || el.keys.style.display === "none") return;
    const key = e.key;
    if (key === "Backspace") { flashKey("←"); pressKey("←"); }
    else if (key === " ") { e.preventDefault(); flashKey("SPACE"); pressKey("SPACE"); }
    else if (key === "Escape") { flashKey("CLEAR"); pressKey("CLEAR"); }
    else if (/^[a-zA-Z]$/.test(key)) { const k = key.toUpperCase(); flashKey(k); pressKey(k); }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Position countdown + round transition over the board shell, not full viewport
  // ─────────────────────────────────────────────────────────────────────────────
  let _cachedBoardRect = null;

  function cacheBoardRect() {
    if (!el.boardShell) return;
    // Measure only when board is not mid-animation
    const r = el.boardShell.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) _cachedBoardRect = r;
  }

  function positionOverlaysOnBoard() {
    if (!el.boardShell) return;
    // Use cached rect if available (avoids measuring during board scale/blur animations)
    const r = (_cachedBoardRect && _cachedBoardRect.width > 0)
      ? _cachedBoardRect
      : el.boardShell.getBoundingClientRect();
    const vph = window.innerHeight;
    const vpw = window.innerWidth;
    // How far the board center is from the viewport center
    const shiftX = (r.left + r.width / 2) - vpw / 2;
    const shiftY = (r.top + r.height / 2) - vph / 2;
    const tx = "translateX(" + shiftX + "px) translateY(" + shiftY + "px)";

    // Countdown: element stays full-screen (inset:0 in CSS).
    // Only shift the text content to the board center using a wrapper span.
    if (el.countdown) {
      el.countdown.style.transform = "";
      const inner = el.countdown.querySelector(".fp-countdown-inner");
      if (inner) inner.style.transform = tx;
    }

    // Status flash (miss/reshuffle popup): centered on board
    if (el.statusFlash) {
      el.statusFlash.style.left = (vpw / 2 + shiftX) + "px";
      el.statusFlash.style.top  = (vph / 2 + shiftY) + "px";
    }

    // Round transition: full-page backdrop, card shifted to board center
    if (el.roundTransition) {
      const rtCard = el.roundTransition.querySelector("#fp-round-transition-card");
      if (rtCard) rtCard.style.transform = tx;
    }

    // Name entry + result popup: full-page backdrop, card centered on board
    if (el.center) {
      const fpCard = el.center.querySelector("#fp-card");
      if (fpCard) fpCard.style.transform = tx;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Game logic
  // ─────────────────────────────────────────────────────────────────────────────
  function shouldWinNow() { return state.matchedPairs>=state.activeWinTarget; }

  function getMatchedCardKeysFromBoard() {
    return [...el.board.querySelectorAll(".fp-card.matched")].map(function(c){return c.dataset.k;});
  }

  function renderBoard(showAll, preserveMatched) {
    applyBoardLayout();
    const matchedKeys = preserveMatched ? getMatchedCardKeysFromBoard() : [];
    const matchedCounts={};
    matchedKeys.forEach(function(k){ matchedCounts[k]=(matchedCounts[k]||0)+1; });
    el.board.innerHTML="";

    state.deck.forEach(function(src){
      const card=document.createElement("div");
      card.className="fp-card"; card.dataset.k=src; card.style.width="100%";
      if (state.boardMinHeight>0) { card.style.height="100%"; card.style.aspectRatio=""; }
      else { card.style.height=""; card.style.aspectRatio=getCardAspectRatio(); }

      const stayMatched=preserveMatched&&matchedCounts[src]>0;
      if (showAll||stayMatched) card.classList.add("show");
      if (stayMatched) { card.classList.add("matched"); matchedCounts[src]--; }

      card.innerHTML=
        '<div class="fp-inner">' +
          '<div class="fp-face fp-front"><span>Tap</span></div>' +
          '<div class="fp-face fp-back"><img src="'+src+'" alt="" draggable="false"></div>' +
        '</div>';

      el.board.appendChild(card);

      card.addEventListener("click", function(){
        if (!state.gameActive) return;
        if (!el.center.classList.contains("hidden")) return;
        if (!el.adminModal.classList.contains("hidden")) return;
        if (state.lockBoard||card.classList.contains("matched")||card===state.firstCard) return;
        card.classList.add("show");
        if (!state.firstCard) { state.firstCard=card; return; }
        state.lockBoard=true;
        if (state.firstCard.dataset.k===card.dataset.k) {
          state.firstCard.classList.add("matched"); card.classList.add("matched");
          state.firstCard=null; state.matchedPairs+=1;
          if (shouldWinNow()) setTimeout(winRound,550); else state.lockBoard=false;
        } else {
          state.misses+=1;
          const a=state.firstCard, b=card;
          setTimeout(function(){
            a.classList.remove("show"); b.classList.remove("show"); state.firstCard=null;
            if (state.roundDifficulty==="randomReshuffle") runMissReshufflePreviewFinalState(); else state.lockBoard=false;
          },700);
        }
      });

      // Block long-press image drag on card images
      const img = card.querySelector("img");
      if (img) {
        img.addEventListener("dragstart", function(e){ e.preventDefault(); });
        img.addEventListener("contextmenu", function(e){ e.preventDefault(); });
      }
    });

    updateBoardShellMode();
    updateTitleForCurrentTarget();
  }

  function reshuffleUnmatchedDeck() {
    const mk=getMatchedCardKeysFromBoard(), mc={};
    mk.forEach(function(k){mc[k]=(mc[k]||0)+1;});
    const pool=state.deck.slice(), next=[];
    Object.keys(mc).forEach(function(k){
      let rem=mc[k];
      for (let i=pool.length-1;i>=0;i--){ if (!rem) break; if (pool[i]===k){pool.splice(i,1);rem--;} }
    });
    shuffle(pool);
    state.deck.forEach(function(k){ if (mc[k]>0){next.push(k);mc[k]--;} else next.push(pool.shift()); });
    state.deck=next;
  }

  function showStatusFlash(done) {
    if (!el.statusFlash) { if (typeof done==="function") done(); return; }
    positionOverlaysOnBoard();
    el.statusFlash.innerHTML='<span class="fp-status-line-1">MISS!</span><span class="fp-status-line-2">RESHUFFLING...</span>';
    el.statusFlash.classList.remove("hidden"); el.statusFlash.style.display="block";
    requestAnimationFrame(function(){ el.statusFlash.classList.add("show"); });
    setTimeout(function(){
      el.statusFlash.classList.remove("show");
      setTimeout(function(){ el.statusFlash.classList.add("hidden"); el.statusFlash.style.display="none"; if (typeof done==="function") done(); },180);
    },520);
  }

  function previewFinalStateThenHide(done) {
    const cards=[...el.board.querySelectorAll(".fp-card:not(.matched)")];
    cards.forEach(function(c){c.classList.add("show");});
    setTimeout(function(){
      cards.forEach(function(c){c.classList.remove("show");});
      setTimeout(function(){ if (typeof done==="function") done(); },120);
    },420);
  }

  function runMissReshufflePreviewFinalState() {
    state.lockBoard=true;
    const old=[...el.board.children];
    const fr=old.map(function(c){return c.getBoundingClientRect();});
    showStatusFlash(function(){
      reshuffleUnmatchedDeck(); renderBoard(false,true);
      const nw=[...el.board.children];
      const lr=nw.map(function(c){return c.getBoundingClientRect();});
      nw.forEach(function(c,i){
        const o=fr[i],n=lr[i]; if(!o||!n) return;
        const dx=o.left-n.left, dy=o.top-n.top;
        c.style.transition="none"; c.style.transform="translate("+dx+"px,"+dy+"px)";
      });
      el.board.classList.add("fp-reshuffle");
      requestAnimationFrame(function(){requestAnimationFrame(function(){
        nw.forEach(function(c){ c.style.transition="transform .42s ease"; c.style.transform="translate(0,0)"; });
        setTimeout(function(){
          nw.forEach(function(c){ c.style.transition=""; c.style.transform=""; });
          el.board.classList.remove("fp-reshuffle");
          previewFinalStateThenHide(function(){ state.lockBoard=false; });
        },440);
      });});
    });
  }

  function animateBoardRefresh(nextShowAll) {
  const pendingDeck = state.deck ? state.deck.slice() : [];

  el.board.classList.add("fp-refresh-out");

  preloadDeckImages(pendingDeck).then(function() {
    setTimeout(function() {
      renderBoard(nextShowAll, false);
      el.board.classList.remove("fp-refresh-out");
      el.board.classList.add("fp-refresh-in");

      setTimeout(function() {
        el.board.classList.remove("fp-refresh-in");
      }, 380);
    }, 220);
  });
}

  function rerenderBoardForColumnChange() {
    applyBoardLayout();
    if (!state.deck.length) return;
    renderBoard(state.gameActive ? false : state.idlePreview, state.gameActive);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Game flow
  // ─────────────────────────────────────────────────────────────────────────────
  function showNameEntry() {
  clearTimeout(state.autoBackTimer);
  clearTimeout(state.nameEntryTimer);
  stopIdleRefreshTimer();
    
  cacheBoardRect();
  positionOverlaysOnBoard();
    
  updateTitleForCurrentTarget();
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

  state.nameEntryTimer = setTimeout(function() {
    if (!el.center.classList.contains("hidden") && !state.gameActive) {
      goIdle();
    }
  }, 20000);
}

  function showResult(title,text,delayMs) {
    clearTimeout(state.autoBackTimer);
    positionOverlaysOnBoard();
    el.head.textContent=title; el.copy.textContent=text; el.center.classList.remove("hidden");
    el.keys.style.display="none"; el.name.style.display="none";
    el.start.classList.add("hidden"); el.cancel.classList.add("hidden"); el.replay.classList.remove("hidden");
    renderLeaderboard(); updateBoardShellMode();
    state.autoBackTimer=setTimeout(function(){ goIdle(); }, typeof delayMs==="number" ? delayMs : state.popupTimingSecs * 1000);
  }

  function showRoundTransition(title,copy,done) {
    clearTimeout(state.autoBackTimer);
    el.roundTransitionKicker.textContent=isSurvivalMode()?"Next Round":"Get Ready";
    el.roundTransitionTitle.textContent=title; el.roundTransitionCopy.textContent=copy;
    // Remove hidden first so the element has dimensions for positioning
    el.roundTransition.classList.remove("hidden");
    positionOverlaysOnBoard();
    requestAnimationFrame(function(){ el.roundTransition.classList.add("show"); });
    setTimeout(function(){
      el.roundTransition.classList.remove("show");
      setTimeout(function(){ el.roundTransition.classList.add("hidden"); if (typeof done==="function") done(); },280);
    }, state.roundTransitionSecs * 1000);
  }

  function getSurvivalTotalCompletedTime() {
    return state.roundResults.reduce(function(s,i){return s+Number(i.time||0);},0);
  }

  function getHighestCompletedRound() {
    return state.roundResults.length ? Math.max.apply(null,state.roundResults.map(function(i){return Number(i.round||0);})) : 0;
  }

  function finishGoalModeSuccess(elapsed) {
    if (state.playerName) saveScore({n:state.playerName,t:elapsed,mode:"goal",category:getCurrentLeaderboardCategory(),winTarget:state.winTarget,ts:Date.now()});
    state.playerName=""; updateNameUI();
    const target = state.activeWinTarget;
    const winTitle = target > 1 ? "All Matches Found!" : "You Found a Match!";
    const winCopy = "Target: "+getWinTargetLabelFor(state.deck.length,state.currentRound)+". Time: "+elapsed.toFixed(2)+"s";
    showResult(winTitle, winCopy, state.popupTimingSecs * 1000);
  }

  function finishSurvivalModeSuccess(totalTime) {
    if (state.playerName) saveScore({n:state.playerName,t:totalTime,r:Number(state.currentRound),mode:"survival",category:getCurrentLeaderboardCategory(),difficulty:state.roundDifficulty,ts:Date.now()});
    state.playerName=""; updateNameUI();
    showResult("Survival Complete!","Completed "+state.currentRound+" rounds in "+totalTime.toFixed(2)+"s", state.popupTimingSecs * 1000);
  }

  function finishSurvivalModeLoss() {
    const cr=getHighestCompletedRound(), tt=getSurvivalTotalCompletedTime();
    if (state.playerName&&cr>0) saveScore({n:state.playerName,t:tt,r:cr,mode:"survival",category:getCurrentLeaderboardCategory(),difficulty:state.roundDifficulty,ts:Date.now()});
    state.playerName=""; updateNameUI();
    if (cr>0) showResult("Round Over","You reached round "+cr+" with a total time of "+tt.toFixed(2)+"s", state.popupTimingSecs * 1000);
    else showResult("Time's Up!","You did not complete round 1. Starting over shortly...", state.popupTimingSecs * 1000);
  }

  function getDifficultyDescription() {
    if (!isSurvivalMode()) return "";
    switch (state.roundDifficulty) {
      case "lessTime":        return "Each round you get less time.";
      case "moreCards":       return "The board gets bigger each round.";
      case "randomReshuffle": return "Miss a pair and the board reshuffles.";
      case "moreMatches":     return "More matches are required each round.";
      default:                return "Same settings every round.";
    }
  }

  function winRound() {
    clearInterval(state.roundTimerId); state.gameActive=false;
    const elapsed=(Date.now()-state.roundStartedAt)/1000;
    state.roundResults.push({round:state.currentRound,time:elapsed,misses:state.misses,cardCount:state.activeCardCount,timer:state.activeRoundTime,target:state.activeWinTarget});
    if (!isSurvivalMode()) { finishGoalModeSuccess(elapsed); return; }
    const maxR=getMaxRoundsValue();
    const diffDesc = getDifficultyDescription();
    const nextTarget = getWinTargetLabelFor(state.activeCardCount, state.currentRound+1);
    const copy = (diffDesc ? diffDesc + " " : "") + "Next target: " + nextTarget + ".";
    if (state.rounds==="endless"||state.currentRound<maxR) { showRoundTransition("Round "+state.currentRound+" Complete",copy,advanceToNextRound); return; }
    finishSurvivalModeSuccess(getSurvivalTotalCompletedTime());
  }

  function advanceToNextRound() { state.currentRound+=1; startConfiguredRound(); }

  function loseRound() {
    clearInterval(state.roundTimerId); state.gameActive=false;
    if (!isSurvivalMode()) { state.playerName=""; updateNameUI(); showResult("Time's Up!","Starting over shortly..."); return; }
    finishSurvivalModeLoss();
  }

  function resetRoundState() {
    state.currentRound=1; state.roundResults=[]; state.misses=0;
    state.activeRoundTime=state.roundTime; state.activeCardCount=state.cardCount;
    state.activeWinTarget=getActiveWinTargetForDeck(state.cardCount,1);
  }

  function hideCountdown(immediate) {
    if (immediate) { el.countdown.classList.remove("show"); el.countdown.classList.add("hidden"); return; }
    el.countdown.classList.remove("show");
    setTimeout(function(){ el.countdown.classList.add("hidden"); },280);
  }

  function showCountdownValue(v) {
    el.countdown.classList.remove("hidden");

    // Build two-layer structure if not already present:
    // #fp-countdown > .fp-countdown-inner (translate, set by JS)
    //               > .fp-countdown-pulse (scale animation only)
    //               > text
    if (!el.countdown.querySelector(".fp-countdown-inner")) {
      el.countdown.textContent = "";
      const outer = document.createElement("span");
      outer.className = "fp-countdown-inner";
      const pulse = document.createElement("span");
      pulse.className = "fp-countdown-pulse";
      pulse.textContent = v;
      outer.appendChild(pulse);
      el.countdown.appendChild(outer);
    }

    // Position first — sets translateX/Y on .fp-countdown-inner
    positionOverlaysOnBoard();

    // Update text and restart pulse on .fp-countdown-pulse
    const pulse = el.countdown.querySelector(".fp-countdown-pulse");
    if (pulse) {
      pulse.textContent = v;
      pulse.classList.remove("fp-tick");
      void pulse.offsetWidth;
      pulse.classList.add("fp-tick");
    }

    requestAnimationFrame(function(){ requestAnimationFrame(function(){ el.countdown.classList.add("show"); }); });
  }

  function goIdle() {
  clearTimeout(state.autoBackTimer);
  clearTimeout(state.nameEntryTimer);
  clearInterval(state.roundTimerId);
    resetRoundState(); setTimerDisplay(state.roundTime);
    el.player.textContent=""; state.playerName=""; state.firstCard=null;
    state.lockBoard=false; state.matchedPairs=0; state.gameActive=false;
    el.center.classList.add("hidden"); hideCountdown(true);
    el.roundTransition.classList.remove("show"); el.roundTransition.classList.add("hidden");
    updateNameUI(); updateRoundPill(); updateTitleForCurrentTarget();
    if (state.deck.length) renderBoard(state.idlePreview, false);
cacheBoardRect();
positionOverlaysOnBoard();
el.play.classList.remove("hidden"); updateBoardShellMode(); renderLiveLeaderboard(); startIdleRefreshTimer();
  }

  function runCountdown(done) {
    let v=state.startCountdown;
    if (v<=0) { hideCountdown(true); done(); return; }
    showCountdownValue(v);
    const id=setInterval(function(){
      v-=1;
      if (v<=0) {
        clearInterval(id);
        hideCountdown(false);
        setTimeout(function(){ done(); },280);
      } else {
        showCountdownValue(v);
      }
    },1000);
  }

    async function prepareDeck(withAnimation) {
    const deck = await buildDeck(state.cardCount);

    // No-blank-board behavior:
    // if deck build fails, keep the currently visible deck untouched
    if (!deck || !deck.length) {
      console.warn("No deck could be built. Keeping current board.");
      return;
    }

    state.deck = deck;
    state.activeCardCount = state.cardCount;
    state.activeWinTarget = getActiveWinTargetForDeck(state.activeCardCount, state.currentRound);

    if (!state.gameActive) {
      if (withAnimation) animateBoardRefresh(state.idlePreview);
      else renderBoard(state.idlePreview, false);
    }

    updateTitleForCurrentTarget();
  }
  
    async function rebuildBoardNow(withAnimation) {
    const deck = await buildDeck(state.cardCount);

    if (!deck || !deck.length) {
      console.warn("Could not rebuild board immediately. Keeping current board.");
      return;
    }

    state.deck = deck;
    state.activeCardCount = state.cardCount;
    state.activeWinTarget = getActiveWinTargetForDeck(state.activeCardCount, state.currentRound);

    if (!state.gameActive) {
      if (withAnimation) {
        animateBoardRefresh(state.idlePreview);
      } else {
        renderBoard(state.idlePreview, false);
      }
    } else {
      renderBoard(false, true);
    }

    updateRoundPill();
    updateTitleForCurrentTarget();
    cacheBoardRect();
    positionOverlaysOnBoard();
  }

  async function startConfiguredRound() {
    stopIdleRefreshTimer();
    const rc=getRoundConfig(state.currentRound);
    state.activeRoundTime=rc.timer; state.activeCardCount=rc.cardCount;
    state.matchedPairs=0; state.misses=0; state.gameActive=false; state.firstCard=null; state.lockBoard=true;

    // Cache board position NOW before any animation changes the layout
    cacheBoardRect();

    // Fade the existing board out smoothly before loading new deck
    el.board.classList.add("fp-refresh-out");

        const nextDeck = await buildDeck(state.activeCardCount);

    // No-blank-board behavior:
    // if we cannot build a new deck, keep the old board and return to idle
    if (!nextDeck || !nextDeck.length) {
      console.warn("Could not build round deck. Keeping current board.");
      el.board.classList.remove("fp-refresh-out");
      goIdle();
      return;
    }

    state.deck = nextDeck;
    state.activeWinTarget = getActiveWinTargetForDeck(state.deck.length, state.currentRound);
    updateRoundPill(); updateTitleForCurrentTarget();
    el.center.classList.add("hidden"); el.play.classList.add("hidden");

    // Slight pause so the fade-out is visible, then render new board
    await new Promise(function(res){ setTimeout(res, 220); });
    renderBoard(state.startPreview, false);
    el.board.classList.remove("fp-refresh-out");
    el.board.classList.add("fp-refresh-in");
    setTimeout(function(){ el.board.classList.remove("fp-refresh-in"); }, 380);

    updateBoardShellMode();

    runCountdown(function(){
      // Stagger cards flipping face-down for a nicer hide
      const cards = [...el.board.children].filter(function(c){ return !c.classList.contains("matched"); });
      cards.forEach(function(c, i){
        setTimeout(function(){ c.classList.remove("show"); }, i * 30);
      });
      const staggerDuration = cards.length * 30 + 80;
      setTimeout(function(){
        state.roundStartedAt=Date.now(); state.lockBoard=false; state.gameActive=true;
        updateBoardShellMode(); startRoundTimer();
      }, staggerDuration);
    });
  }

  async function startGame() {
    if (state.playerName.length<2) return;
    clearTimeout(state.nameEntryTimer);
    resetRoundState();
    el.center.classList.add("hidden"); updateBoardShellMode();
    const introTarget=getWinTargetLabelFor(state.cardCount,1);
    const introTitle=getTitleForTarget(state.cardCount,1);
    const title=isSurvivalMode()?"Round 1":"Get Ready";
    const diffDesc = getDifficultyDescription();
    const copy = isSurvivalMode()
      ? (diffDesc ? diffDesc + " " : "") + "Target: " + introTarget + "."
      : "Target: " + introTitle + ".";
    showRoundTransition(title,copy,startConfiguredRound);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Color pair binding
  // ─────────────────────────────────────────────────────────────────────────────
  function bindColorPair(picker,text,fallback) {
    picker.addEventListener("input",function(){ text.value=picker.value.toUpperCase(); });
    text.addEventListener("input",function(){
      if (isValidHex(text.value.trim())) { const n=normalizeHex(text.value,fallback); picker.value=n; text.value=n; }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Reset all
  // ─────────────────────────────────────────────────────────────────────────────
    async function resetAllSettings() {
    if (!window.confirm("Are you sure you want to reset all settings, custom colors, custom images, logos, font, PIN, and leaderboard?")) return;

    localStorage.removeItem(STORAGE_KEYS.settings);
    localStorage.removeItem(STORAGE_KEYS.leaderboard);

    const freshDefaults = JSON.parse(JSON.stringify(DEFAULTS));
    Object.keys(state).forEach(function(key) { delete state[key]; });
    Object.assign(state, freshDefaults);

    resetRoundState();
    clearTimeout(state.autoBackTimer);
    clearTimeout(state.nameEntryTimer);
    clearInterval(state.roundTimerId);
    stopIdleRefreshTimer();

    state.firstCard = null;
    state.lockBoard = false;
    state.matchedPairs = 0;
    state.gameActive = false;

    el.center.classList.add("hidden");
    hideCountdown(true);
    el.roundTransition.classList.remove("show");
    el.roundTransition.classList.add("hidden");
    el.play.classList.remove("hidden");

    renderLeaderboard();
    syncAllVisualsImmediately({
      rerenderBoard: false
    });

    await rebuildBoardNow(false);

    persistSettings();
    startIdleRefreshTimer();
  }

  function handleImageUpload(file,onLoad) {
    if (!file) return;
    const reader=new FileReader();
    reader.onload=function(e){
      const result=String(e.target.result||""); if (!result) return;
      try { onLoad(result,file.name||""); persistSettings(); }
      catch(err){ console.error(err); alert("Could not save that file. Try a smaller file."); }
    };
    reader.readAsDataURL(file);
  }

  function savePin() {
    const cur=el.currentPin.value.trim(), nx=el.newPin.value.trim(), cf=el.confirmPin.value.trim();
    if (cur!==state.adminPin) { el.pinStatus.textContent="Current PIN is incorrect."; return; }
    if (!nx||nx.length<4) { el.pinStatus.textContent="New PIN must be at least 4 characters."; return; }
    if (nx!==cf) { el.pinStatus.textContent="New PIN and confirmation do not match."; return; }
    state.adminPin=nx; persistSettings();
    el.currentPin.value=""; el.newPin.value=""; el.confirmPin.value="";
    el.pinStatus.textContent="PIN updated successfully.";
  }

  function exportSettingsToJson() {
    const blob=new Blob([JSON.stringify(buildSettingsPayload(),null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download="find-the-match-settings-"+new Date().toISOString().replace(/[:.]/g,"-")+".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1000);
    el.settingsTransferStatus.textContent="Settings JSON exported.";
  }

    async function importSettingsFromJsonText(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      alert("That file is not valid JSON.");
      return;
    }

    const incoming = parsed && parsed.settings ? parsed.settings : parsed;
    if (!incoming || typeof incoming !== "object") {
      alert("That JSON file does not contain valid settings.");
      return;
    }

    applySettingsObject(incoming);

    syncAllVisualsImmediately({
      rerenderBoard: false
    });

    await rebuildBoardNow(false);

    persistSettings();

    if (!state.gameActive) {
      startIdleRefreshTimer();
    }

    el.settingsTransferStatus.textContent = "Settings JSON imported successfully.";
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Event bindings
  // ─────────────────────────────────────────────────────────────────────────────
  el.play.onclick=function(){ el.play.classList.add("hidden"); showNameEntry(); };
  el.start.onclick=startGame;
  el.cancel.onclick=goIdle;
  el.replay.onclick=goIdle;
  el.adminButton.onclick=openAdmin;
  el.adminBackdrop.onclick=closeAdmin;
  el.adminCloseLock.onclick=closeAdmin;
  el.adminClose.onclick=closeAdmin;
  el.adminUnlock.onclick=unlockAdmin;
  el.adminPin.addEventListener("keydown",function(e){ if (e.key==="Enter") unlockAdmin(); });

  // ── Sliders with preview + confirm bar ──
  // Header Logo Size
  if (el.headerLogoSizeInput) {
    bindSliderFrost(el.headerLogoSizeInput);
    el.headerLogoSizeInput.addEventListener("input",function(){
      const v=parseInt(el.headerLogoSizeInput.value,10);
      if (!isNaN(v)) {
        state.headerLogoHeight=Math.max(24,Math.min(220,v));
        state.headerLogoMaxWidth=Math.max(80,Math.round(state.headerLogoHeight*4.3));
        applyHeaderLogoLayout();
        if (el.headerLogoSizeValue) el.headerLogoSizeValue.textContent=state.headerLogoHeight+"px";
      }
    });
  }

  // Header Logo Offset
  if (el.headerLogoOffsetInput) {
    bindSliderFrost(el.headerLogoOffsetInput);
    el.headerLogoOffsetInput.addEventListener("input",function(){
      const v=parseInt(el.headerLogoOffsetInput.value,10);
      if (!isNaN(v)) {
        state.headerLogoOffsetY=Math.max(0,Math.min(500,v));
        applyHeaderLogoLayout();
        if (el.headerLogoOffsetValue) el.headerLogoOffsetValue.textContent=state.headerLogoOffsetY+"px";
      }
    });
  }

  // HUD Offset
  if (el.hudOffsetInput) {
    bindSliderFrost(el.hudOffsetInput);
    el.hudOffsetInput.addEventListener("input",function(){
      const v=parseInt(el.hudOffsetInput.value,10);
      if (!isNaN(v)) {
        state.hudOffsetY=Math.max(-500,Math.min(500,v));
        applyHudOffset();
        if (el.hudOffsetValue) el.hudOffsetValue.textContent=state.hudOffsetY+"px";
      }
    });
  }

  // Board Offset
  if (el.boardOffsetInput) {
    bindSliderFrost(el.boardOffsetInput);
    el.boardOffsetInput.addEventListener("input",function(){
      const v=parseInt(el.boardOffsetInput.value,10);
      if (!isNaN(v)) {
        state.boardOffsetY=Math.max(-500,Math.min(500,v));
        applyBoardOffset();
        if (el.boardOffsetValue) el.boardOffsetValue.textContent=state.boardOffsetY+"px";
      }
    });
  }

  // Board Width
  if (el.boardWidthRange) {
    bindSliderFrost(el.boardWidthRange);
    el.boardWidthRange.addEventListener("input",function(){
      const v=parseInt(el.boardWidthRange.value,10);
      if (!isNaN(v)) {
        state.boardWidthPercent=Math.max(60,Math.min(100,v));
        applyBoardAreaSizing();
        if (el.boardWidthValue) el.boardWidthValue.textContent=state.boardWidthPercent+"%";
        rerenderBoardForColumnChange();
      }
    });
  }

  // Board Height
  if (el.boardHeightRange) {
    bindSliderFrost(el.boardHeightRange);
    el.boardHeightRange.addEventListener("input",function(){
      const v=parseInt(el.boardHeightRange.value,10);
      if (!isNaN(v)) {
        state.boardMinHeight=Math.max(0,Math.min(1400,v));
        applyBoardAreaSizing();
        if (el.boardHeightValue) el.boardHeightValue.textContent=state.boardMinHeight+"px";
        rerenderBoardForColumnChange();
      }
    });
  }

  // Board Gap
  if (el.boardGapRange) {
    bindSliderFrost(el.boardGapRange);
    el.boardGapRange.addEventListener("input",function(){
      const v=parseInt(el.boardGapRange.value,10);
      if (!isNaN(v)) {
        state.boardGap=Math.max(6,Math.min(30,v));
        applyBoardAreaSizing();
        if (el.boardGapValue) el.boardGapValue.textContent=state.boardGap+"px";
        rerenderBoardForColumnChange();
      }
    });
  }

  el.savePin.onclick=savePin;

  el.winTargets.forEach(function(b){
    b.onclick=function(){
      if (isWinTargetOverridden()) return;
      const v=b.getAttribute("data-win");
      state.winTarget=v==="all"?"all":parseInt(v,10);
      updateSettingsUI(); renderLeaderboard(); persistSettings();
    };
  });

  el.columnButtons.forEach(function(b){
    b.onclick=function(){
      const v=parseInt(b.getAttribute("data-columns"),10);
      if (COLUMN_OPTIONS.indexOf(v)===-1) return;
      state.columns=v; updateSettingsUI(); persistSettings(); rerenderBoardForColumnChange();
    };
  });

    el.cardCountButtons.forEach(function(b){
    b.onclick = async function(){
      const v = parseInt(b.getAttribute("data-card-count"), 10);
      if (v === 30 && state.roundDifficulty === "moreCards") return;

      state.cardCount = v;
      state.activeCardCount = state.cardCount;
      state.activeWinTarget = getActiveWinTargetForDeck(state.cardCount, state.currentRound);

      updateSettingsUI();
      persistSettings();
      await rebuildBoardNow(true);
    };
  });

  el.roundButtons.forEach(function(b){
    b.onclick=function(){
      const v=b.getAttribute("data-rounds");
      state.rounds=v==="endless"?"endless":parseInt(v,10);
      updateSettingsUI(); updateRoundPill(); renderLeaderboard(); persistSettings();
    };
  });

  el.difficultyButtons.forEach(function(b){
    b.onclick=function(){
      const v=b.getAttribute("data-difficulty");
      if (ROUND_DIFFICULTIES.indexOf(v)===-1) return;
      if (v==="moreCards" && state.cardCount===30) return;
      state.roundDifficulty=v; updateSettingsUI(); updateRoundPill(); renderLeaderboard(); persistSettings();
    };
  });

  el.countdownInput.addEventListener("input",function(){
    const v=parseInt(el.countdownInput.value,10);
    if (!isNaN(v)) {
      state.startCountdown=Math.max(0,Math.min(10,v));
      if (el.countdownValue) el.countdownValue.textContent=state.startCountdown+"s";
      persistSettings();
    }
  });

  el.roundTimerInput.addEventListener("input",function(){
    const v=parseInt(el.roundTimerInput.value,10);
    if (!isNaN(v)) {
      state.roundTime=Math.max(5,Math.min(120,v));
      if (el.roundTimerValue) el.roundTimerValue.textContent=state.roundTime+"s";
      if (!state.gameActive) setTimerDisplay(state.roundTime);
      persistSettings();
    }
  });

  el.idleRefreshInput.addEventListener("input",function(){
    const v=parseInt(el.idleRefreshInput.value,10);
    if (!isNaN(v)) {
      state.idleRefreshSeconds=Math.max(0,Math.min(600,v));
      if (el.idleRefreshValue) el.idleRefreshValue.textContent=state.idleRefreshSeconds+"s";
      persistSettings(); startIdleRefreshTimer();
    }
  });

  if (el.roundTransitionInput) {
    el.roundTransitionInput.addEventListener("input",function(){
      const v=parseFloat(el.roundTransitionInput.value);
      if (!isNaN(v)) {
        state.roundTransitionSecs=Math.max(1,Math.min(8,v));
        if (el.roundTransitionValue) el.roundTransitionValue.textContent=state.roundTransitionSecs+"s";
        persistSettings();
      }
    });
  }

  if (el.popupTimingInput) {
    el.popupTimingInput.addEventListener("input",function(){
      const v=parseInt(el.popupTimingInput.value,10);
      if (!isNaN(v)) {
        state.popupTimingSecs=Math.max(2,Math.min(15,v));
        if (el.popupTimingValue) el.popupTimingValue.textContent=state.popupTimingSecs+"s";
        persistSettings();
      }
    });
  }

  el.idlePreviewInput.addEventListener("change",function(){
    state.idlePreview=el.idlePreviewInput.checked;
    if (!state.gameActive&&state.deck.length) renderBoard(state.idlePreview,false);
    persistSettings();
  });

  el.startPreviewInput.addEventListener("change",function(){ state.startPreview=el.startPreviewInput.checked; persistSettings(); });

  el.showCursorInput.addEventListener("change",function(){ state.showCursor=el.showCursorInput.checked; applyCursorMode(); persistSettings(); });

  el.presetButtons.forEach(function(b){
  b.onclick = function(){
    applyThemePreset(b.getAttribute("data-preset"));
    persistSettings();
  };
});
 bindColorPair(el.bgPicker,el.bgText,DEFAULTS.theme.bg);
bindColorPair(el.accentPicker,el.accentText,DEFAULTS.theme.accent);
bindColorPair(el.accentTextPicker,el.accentTextText,DEFAULTS.theme.accentText);
bindColorPair(el.cardPicker,el.cardText,DEFAULTS.theme.card);
bindColorPair(el.panelPicker,el.panelText,DEFAULTS.theme.panel);
bindColorPair(el.textPicker,el.textText,DEFAULTS.theme.text);

  el.applyTheme.onclick = function(){
  applyThemeColors({
    bg: el.bgText.value,
    accent: el.accentText.value,
    accentText: el.accentTextText.value,
    card: el.cardText.value,
    panel: el.panelText.value,
    text: el.textText.value
  });
  persistSettings();
};

el.resetTheme.onclick = function(){
  applyThemePreset("dark");
  persistSettings();
};

el.resetLeaderboard.onclick = function(){
  if (window.confirm("Are you sure you want to reset the leaderboard?")) clearLeaderboard();
};

el.resetAll.onclick = resetAllSettings;

  el.logoUpload.addEventListener("change",function(){
    const f=el.logoUpload.files&&el.logoUpload.files[0];
    if (f) handleImageUpload(f,function(d){ applyLogo(d); });
    el.logoUpload.value="";
  });

  el.headerLogoUpload.addEventListener("change",function(){
    const f=el.headerLogoUpload.files&&el.headerLogoUpload.files[0];
    if (f) handleImageUpload(f,function(d){ applyHeaderLogo(d); });
    el.headerLogoUpload.value="";
  });

  el.bgUpload.addEventListener("change",function(){
    const f=el.bgUpload.files&&el.bgUpload.files[0];
    if (f) handleImageUpload(f,function(d){ applyBackgroundImage(d); });
    el.bgUpload.value="";
  });

  el.fontUpload.addEventListener("change",function(){
    const f=el.fontUpload.files&&el.fontUpload.files[0];
    if (f) handleImageUpload(f,function(d,n){ applyCustomFont(d,n); });
    el.fontUpload.value="";
  });

  el.exportSettings.addEventListener("click",exportSettingsToJson);
  el.importSettings.addEventListener("click",function(){ el.importSettingsFile.click(); });
  el.importSettingsFile.addEventListener("change",function(){
    const f=el.importSettingsFile.files&&el.importSettingsFile.files[0]; if (!f) return;
    const r=new FileReader();
    r.onload=function(e){ importSettingsFromJsonText(String(e.target.result||"")); };
    r.readAsText(f); el.importSettingsFile.value="";
  });

  el.removeLogo.addEventListener("click",function(){ if (window.confirm("Remove the custom card-back logo and revert to the default logo?")) { applyLogo(DEFAULTS.logoUrl); persistSettings(); } });
  el.removeHeaderLogo.addEventListener("click",function(){
    if (!window.confirm("Reset the header logo to the default BoothKit logo?")) return;
    applyHeaderLogo(DEFAULTS.headerLogoUrl);
    state.headerLogoHeight=DEFAULTS.headerLogoHeight; state.headerLogoMaxWidth=DEFAULTS.headerLogoMaxWidth; state.headerLogoOffsetY=DEFAULTS.headerLogoOffsetY;
    applyHeaderLogoLayout(); updateSettingsUI(); persistSettings();
  });
  el.removeBg.addEventListener("click",function(){ if (window.confirm("Remove the custom background image?")) { applyBackgroundImage(""); persistSettings(); } });
  el.removeFont.addEventListener("click",function(){ if (window.confirm("Remove the custom font and return to the default font?")) { applyCustomFont("",""); persistSettings(); } });

  window.addEventListener("resize",function(){ applyBoardLayout(); updateBoardShellMode(); cacheBoardRect(); positionOverlaysOnBoard(); });

  // ─────────────────────────────────────────────────────────────────────────────
  // Gallery Mode — revert page to normal browsing experience
  // ─────────────────────────────────────────────────────────────────────────────
  function restoreNormalPage() {
    // Add CSS class to <html> — activates gallery-mode rules in the CSS file
    document.documentElement.classList.add("fp-gallery-mode");
    // Idempotent style block fallback — earlyGalleryCheck may have already done this
    if (document.getElementById("fp-gallery-restore-styles")) return;
    const s = document.createElement("style");
    s.id = "fp-gallery-restore-styles";
    s.textContent =
      "html,body{overflow:auto !important;overscroll-behavior:auto !important;" +
      "touch-action:auto !important;height:auto !important;" +
      "scrollbar-width:auto !important;-ms-overflow-style:auto !important;}" +
      "html::-webkit-scrollbar,body::-webkit-scrollbar{display:block !important;" +
      "width:auto !important;height:auto !important;}" +
      "#fp-game{display:none !important;}";
    document.head.appendChild(s);
  }

  function enterGalleryMode() {
    // Set then immediately clear localStorage — the ?gallery=1 URL param
    // is the source of truth for the shared link. Clearing here means this
    // browser is never stuck; opening the plain URL again launches the game.
    localStorage.removeItem(STORAGE_KEYS.galleryMode);

    clearTimeout(state.autoBackTimer);
    clearInterval(state.roundTimerId);
    stopIdleRefreshTimer();

    // Redirect to the same page with ?gallery=1 so the shared URL works on any device
    const url = new URL(window.location.href);
    url.searchParams.set("gallery", "1");
    window.location.replace(url.toString());
  }

  function checkGalleryModeOnLoad() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("gallery") !== "1") return false;
    // earlyGalleryCheck already restored page styles — just remove context block
    document.removeEventListener("contextmenu", preventContext);
    return true;
  }

  // Wire up the "View Gallery" button in admin
  if (el.enterGallery) {
    el.enterGallery.addEventListener("click", function() {
      if (window.confirm("Switch to Gallery Mode?\n\nThe game will be hidden and the normal photo gallery will be shown.\n\nTo return to game mode, reload the page from the event dashboard.")) {
        closeAdmin();
        enterGalleryMode();
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Init
  // ─────────────────────────────────────────────────────────────────────────────
  // Check if we should stay in gallery mode instead of launching game
  if (checkGalleryModeOnLoad()) return;
  
  seedCachedGalleryUrlsFromCurrentPage();

  loadSettings();
  applyThemeColors(state.theme);
  applyLogo(state.logoUrl);
  applyHeaderLogo(state.headerLogoUrl||DEFAULTS.headerLogoUrl);
  applyHeaderLogoLayout();
  applyHudOffset();
  applyBoardOffset();
  applyBoardAreaSizing();
  applyBackgroundImage(state.bgImageUrl);
  applyCustomFont(state.customFontDataUrl,state.customFontFileName);
  updateSettingsUI();
  renderLeaderboard();
  updateAdminPinUI();
  buildAdminPinKeyboard();
  applyCursorMode();
  updateRoundPill();
  updateTitleForCurrentTarget();

  prepareDeck(false).then(function(){
    setTimerDisplay(state.roundTime);
    goIdle();
  });
});
