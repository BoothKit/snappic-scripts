document.addEventListener("DOMContentLoaded", function () {
  const host = document.querySelector("#content");
  const galleryImgs = [...document.querySelectorAll("#gallery .grid-item img")];
  if (!host || galleryImgs.length < 6) return;

  const STORAGE_KEYS = {
    settings: "fp_settings_v10",
    leaderboard: "fp_lb_v10"
  };

  const CARD_COUNTS = [6, 8, 10, 12, 16];
  const ROUND_DIFFICULTIES = ["same", "lessTime", "moreCards", "randomReshuffle", "moreMatches"];

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
      panel: "#1C1F27"
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

  function injectGlobalUiStyles() {
    if (document.getElementById("fp-runtime-ui-styles")) return;

    const style = document.createElement("style");
    style.id = "fp-runtime-ui-styles";
    style.textContent = `
      html,
      body{
        scrollbar-width:none !important;
        -ms-overflow-style:none !important;
      }

      html::-webkit-scrollbar,
      body::-webkit-scrollbar{
        width:0 !important;
        height:0 !important;
        display:none !important;
        background:transparent !important;
      }

      html::-webkit-scrollbar-thumb,
      body::-webkit-scrollbar-thumb,
      html::-webkit-scrollbar-track,
      body::-webkit-scrollbar-track{
        background:transparent !important;
      }

      #fp-admin-panel{
        scrollbar-width:auto !important;
        -ms-overflow-style:auto !important;
      }

      #fp-admin-panel::-webkit-scrollbar{
        width:10px !important;
        height:10px !important;
        display:block !important;
      }

      #fp-admin-panel::-webkit-scrollbar-thumb{
        background:rgba(255,255,255,.18) !important;
        border-radius:999px !important;
      }

      #fp-admin-panel::-webkit-scrollbar-track{
        background:rgba(255,255,255,.04) !important;
      }

      #fp-game,
      #fp-game *{
        cursor:none !important;
      }

      #fp-game.fp-show-cursor,
      #fp-game.fp-show-cursor *{
        cursor:auto !important;
      }

      #fp-head,
      #fp-copy,
      #fp-leaderboard,
      #fp-leaderboard h3,
      #fp-leaderboard div{
        text-align:center !important;
      }

      #fp-leaderboard{
        justify-items:center;
      }

      #fp-leaderboard div{
        width:min(100%, 420px);
      }

      #fp-live-leaderboard,
      #fp-live-leaderboard div{
        text-align:center !important;
      }

      #fp-admin-pin{
        display:none !important;
      }

      #fp-admin-pin-display{
        margin:18px 0 0;
        width:100%;
        padding:16px 18px;
        border-radius:18px;
        background:rgba(255,255,255,.08);
        border:1px solid rgba(255,255,255,.14);
        font-size:26px;
        font-weight:800;
        letter-spacing:.18em;
        min-height:62px;
        display:flex;
        align-items:center;
        justify-content:center;
        text-transform:uppercase;
        box-sizing:border-box;
        text-align:center;
      }

      #fp-admin-pin-display.empty{
        letter-spacing:.04em;
        font-size:18px;
        opacity:.72;
      }

      #fp-admin-pin-keys{
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:10px;
        margin:16px 0 0;
      }

      .fp-admin-pin-key{
        padding:14px 8px;
        border-radius:14px;
        border:1px solid rgba(255,255,255,.14);
        background:rgba(255,255,255,.08);
        color:#fff;
        font-size:18px;
        font-weight:800;
        text-align:center;
        cursor:pointer;
        user-select:none;
        -webkit-user-select:none;
      }

      #fp-keys{
        display:grid;
        grid-template-columns:repeat(10,1fr);
        gap:10px;
        margin:0 0 18px;
      }

      .fp-key{
        padding:14px 8px;
        border-radius:14px;
        border:1px solid var(--fp-key-border);
        background:var(--fp-key-bg);
        color:var(--fp-text);
        font-size:18px;
        font-weight:800;
        text-align:center;
        cursor:pointer;
        user-select:none;
        -webkit-user-select:none;
      }

      .fp-key.bottom-key{
        margin-top:2px;
      }

      .fp-key.bottom-left,
      .fp-key.bottom-right{
        grid-column:span 5;
      }

      #fp-status-flash{
        position:fixed;
        left:50%;
        top:50%;
        transform:translate(-50%,-50%) scale(.72);
        z-index:90;
        min-width:min(86vw, 420px);
        max-width:min(90vw, 520px);
        padding:20px 26px;
        border-radius:28px;
        background:linear-gradient(135deg, rgba(0,0,0,.88), rgba(20,20,20,.96));
        border:1px solid rgba(255,255,255,.18);
        box-shadow:0 30px 80px rgba(0,0,0,.55), 0 0 26px rgba(255,255,255,.12);
        text-align:center;
        opacity:0;
        pointer-events:none;
        transition:opacity .22s ease, transform .22s ease;
        display:none;
      }

      #fp-status-flash.show{
        opacity:1;
        transform:translate(-50%,-50%) scale(1);
      }

      #fp-status-flash.hidden{
        display:none;
      }

      #fp-status-flash .fp-status-line-1{
        display:block;
        font-size:28px;
        font-weight:900;
        letter-spacing:.16em;
        text-transform:uppercase;
        line-height:1;
      }

      #fp-status-flash .fp-status-line-2{
        display:block;
        margin-top:8px;
        font-size:15px;
        font-weight:800;
        letter-spacing:.28em;
        text-transform:uppercase;
        opacity:.84;
        line-height:1.1;
      }

      @keyframes fpShuffleShake{
        0%{transform:translateX(0)}
        20%{transform:translateX(-8px)}
        40%{transform:translateX(8px)}
        60%{transform:translateX(-6px)}
        80%{transform:translateX(6px)}
        100%{transform:translateX(0)}
      }

      #fp-board.fp-reshuffle{
        animation:fpShuffleShake .35s ease;
      }

      @media (orientation: portrait){
        #fp-keys{
          grid-template-columns:repeat(10,1fr) !important;
        }

        .fp-key.bottom-left,
        .fp-key.bottom-right{
          grid-column:span 5 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

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
          '<div id="fp-top-meta">' +
            '<div id="fp-round-pill" class="hidden"></div>' +
            '<div id="fp-timer">20</div>' +
            '<div id="fp-live-leaderboard"></div>' +
          '</div>' +
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
      '<div id="fp-status-flash" class="hidden"></div>' +

      '<div id="fp-round-transition" class="hidden">' +
        '<div id="fp-round-transition-card">' +
          '<div id="fp-round-transition-kicker">Get Ready</div>' +
          '<div id="fp-round-transition-title">Round 1</div>' +
          '<div id="fp-round-transition-copy">Fresh photos loaded for the next round.</div>' +
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

                '<div class="fp-admin-row-3">' +
                  '<div>' +
                    '<label class="fp-admin-label" for="fp-setting-countdown">Countdown</label>' +
                    '<input id="fp-setting-countdown" class="fp-admin-number" type="number" min="0" max="10" step="1">' +
                  '</div>' +
                  '<div>' +
                    '<label class="fp-admin-label" for="fp-setting-timer">Base Timer</label>' +
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
                  '<label class="fp-toggle">' +
                    '<input id="fp-setting-idle-preview" type="checkbox">' +
                    '<span>Idle photo preview</span>' +
                  '</label>' +
                  '<label class="fp-toggle">' +
                    '<input id="fp-setting-start-preview" type="checkbox">' +
                    '<span>Start photo preview</span>' +
                  '</label>' +
                  '<label class="fp-toggle">' +
                    '<input id="fp-setting-show-cursor" type="checkbox">' +
                    '<span>Show mouse cursor</span>' +
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
                '<div id="fp-header-logo-status" class="fp-admin-note">Using default header logo.</div>' +
                '<div class="fp-admin-actions">' +
                  '<button id="fp-remove-header-logo" type="button" class="fp-admin-secondary">Reset Header Logo</button>' +
                '</div>' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-header-logo-size">Header Logo Size</label>' +
                '<input id="fp-header-logo-size" class="fp-admin-number" type="number" min="24" max="220" step="1">' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-header-logo-offset">Header Logo Move Up</label>' +
                '<input id="fp-header-logo-offset" class="fp-admin-number" type="number" min="0" max="500" step="1">' +
                '<div class="fp-admin-note">Use larger numbers to move the header logo upward.</div>' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-hud-offset">Move Header / HUD Up or Down</label>' +
                '<input id="fp-hud-offset" class="fp-admin-number" type="number" min="-500" max="500" step="1">' +
                '<div class="fp-admin-note">Negative moves the title, timer, leaderboard, and settings row up. Positive moves it down.</div>' +

                '<label class="fp-admin-label fp-admin-label-top" for="fp-board-offset">Move Card Area Up or Down</label>' +
                '<input id="fp-board-offset" class="fp-admin-number" type="number" min="-500" max="500" step="1">' +
                '<div class="fp-admin-note">Negative moves the cards up. Positive moves them down.</div>' +

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

                '<label class="fp-admin-label fp-admin-label-top" for="fp-font-upload">Custom Font Upload</label>' +
                '<input id="fp-font-upload" type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" class="fp-admin-file">' +
                '<div id="fp-font-status" class="fp-admin-note">Using default font.</div>' +
                '<div class="fp-admin-actions">' +
                  '<button id="fp-remove-font" type="button" class="fp-admin-secondary">Remove Custom Font</button>' +
                '</div>' +

                '<label class="fp-admin-label fp-admin-label-top">Settings Transfer</label>' +
                '<input id="fp-import-settings-file" type="file" accept="application/json,.json">' +
                '<div id="fp-settings-transfer-status" class="fp-admin-note">Export your settings to move them to another monitor, then import that JSON there.</div>' +
                '<div class="fp-admin-actions">' +
                  '<button id="fp-export-settings" type="button">Export Settings JSON</button>' +
                  '<button id="fp-import-settings" type="button" class="fp-admin-secondary">Import Settings JSON</button>' +
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
  injectGlobalUiStyles();

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
    cardCountButtons: [...app.querySelectorAll("[data-card-count]")],
    roundButtons: [...app.querySelectorAll("[data-rounds]")],
    difficultyButtons: [...app.querySelectorAll("[data-difficulty]")],
    countdownInput: app.querySelector("#fp-setting-countdown"),
    roundTimerInput: app.querySelector("#fp-setting-timer"),
    idleRefreshInput: app.querySelector("#fp-setting-idle-refresh"),
    idlePreviewInput: app.querySelector("#fp-setting-idle-preview"),
    startPreviewInput: app.querySelector("#fp-setting-start-preview"),
    showCursorInput: app.querySelector("#fp-setting-show-cursor"),
    presetButtons: [...app.querySelectorAll(".fp-preset")],
    winTargetOverrideNote: app.querySelector("#fp-win-target-override-note"),

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
    headerLogoSizeInput: app.querySelector("#fp-header-logo-size"),
    headerLogoOffsetInput: app.querySelector("#fp-header-logo-offset"),
    hudOffsetInput: app.querySelector("#fp-hud-offset"),
    boardOffsetInput: app.querySelector("#fp-board-offset"),

    bgUpload: app.querySelector("#fp-bg-upload"),
    bgStatus: app.querySelector("#fp-bg-status"),
    removeBg: app.querySelector("#fp-remove-bg"),

    fontUpload: app.querySelector("#fp-font-upload"),
    fontStatus: app.querySelector("#fp-font-status"),
    removeFont: app.querySelector("#fp-remove-font"),

    exportSettings: app.querySelector("#fp-export-settings"),
    importSettings: app.querySelector("#fp-import-settings"),
    importSettingsFile: app.querySelector("#fp-import-settings-file"),
    settingsTransferStatus: app.querySelector("#fp-settings-transfer-status"),

    currentPin: app.querySelector("#fp-current-pin"),
    newPin: app.querySelector("#fp-new-pin"),
    confirmPin: app.querySelector("#fp-confirm-pin"),
    savePin: app.querySelector("#fp-save-pin"),
    pinStatus: app.querySelector("#fp-pin-status")
  };

  if (el.winTargetOverrideNote) {
    el.winTargetOverrideNote.style.display = "";
  }

  function shuffle(arr) {
    for (let idx = arr.length - 1; idx > 0; idx--) {
      const rand = Math.floor(Math.random() * (idx + 1));
      [arr[idx], arr[rand]] = [arr[rand], arr[idx]];
    }
    return arr;
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
    if (lower.endsWith(".woff")) return "woff";
    if (lower.endsWith(".otf")) return "opentype";
    return "truetype";
  }

  function isSurvivalMode() {
    return state.rounds === "endless" || Number(state.rounds) > 1;
  }

  function isWinTargetOverridden() {
    return state.roundDifficulty === "moreMatches";
  }

  function setWinTargetDisabledUi(disabled) {
    if (el.winTargetsWrap) {
      el.winTargetsWrap.classList.toggle("is-disabled", disabled);
      el.winTargetsWrap.setAttribute("aria-disabled", disabled ? "true" : "false");
    }

    el.winTargets.forEach(function (btn) {
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
    const maxPairs = deckSize / 2;
    return Math.max(1, Math.min(desired, maxPairs));
  }

  function getActiveWinTargetForDeck(deckSize, roundNumber) {
    if (isWinTargetOverridden()) {
      return getMoreMatchesTarget(roundNumber, deckSize);
    }
    if (state.winTarget === "all") return deckSize / 2;
    return Number(state.winTarget || 1);
  }

  function getWinTargetLabelFor(deckSize, roundNumber) {
    const target = getActiveWinTargetForDeck(deckSize, roundNumber);
    if (target >= deckSize / 2) return "All Matches";
    return target + " Match" + (target > 1 ? "es" : "");
  }

  function getTitleForTarget(deckSize, roundNumber) {
    const target = getActiveWinTargetForDeck(deckSize, roundNumber);
    return target > 1 ? "Find the Matches" : "Find the Match";
  }

  function updateTitleForCurrentTarget() {
    const deckSize = state.deck.length || state.activeCardCount || state.cardCount;
    const title = getTitleForTarget(deckSize, state.currentRound);
    const titleNode = app.querySelector("#fp-title");
    if (titleNode) titleNode.textContent = title;
    if (el.head) el.head.textContent = title;
  }

  function getClosestCardCountIndex(count) {
    const exact = CARD_COUNTS.indexOf(count);
    if (exact > -1) return exact;

    let bestIndex = 0;
    let bestDiff = Infinity;

    CARD_COUNTS.forEach(function (value, index) {
      const diff = Math.abs(value - count);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIndex = index;
      }
    });

    return bestIndex;
  }

  function getRoundConfig(roundNumber) {
    let timer = state.roundTime;
    let cardCount = state.cardCount;

    if (!isSurvivalMode()) {
      return {
        timer: timer,
        cardCount: cardCount
      };
    }

    if (state.roundDifficulty === "lessTime") {
      timer = Math.max(5, state.roundTime - ((roundNumber - 1) * 2));
    }

    if (state.roundDifficulty === "moreCards") {
      const startIndex = getClosestCardCountIndex(state.cardCount);
      const nextIndex = Math.min(CARD_COUNTS.length - 1, startIndex + (roundNumber - 1));
      cardCount = CARD_COUNTS[nextIndex];
    }

    return {
      timer: timer,
      cardCount: cardCount
    };
  }

  function getCurrentLeaderboardCategory() {
    if (isSurvivalMode()) {
      return "survival|" + state.roundDifficulty + "|baseTarget:" + state.winTarget + "|baseCards:" + state.cardCount;
    }
    return "goal|target:" + state.winTarget + "|cards:" + state.cardCount;
  }

  function getCurrentLeaderboardHeading() {
    return isSurvivalMode() ? "Survival Leaderboard" : "Leaderboard";
  }

  function applyCustomFont(dataUrl, fileName) {
    state.customFontDataUrl = dataUrl || "";
    state.customFontFileName = fileName || "";
    state.customFontFamily = state.customFontDataUrl
      ? ("fp-user-font-" + slugifyFontName(fileName || "custom"))
      : "";

    const existing = document.getElementById("fp-custom-font-style");
    if (existing) existing.remove();

    if (!state.customFontDataUrl || !state.customFontFamily) {
      app.style.setProperty("--fp-font-family", "Arial, sans-serif");
      el.fontStatus.textContent = "Using default font.";
      return;
    }

    const format = getFontFormatFromName(fileName);

    const style = document.createElement("style");
    style.id = "fp-custom-font-style";
    style.textContent =
      '@font-face{' +
        'font-family:"' + state.customFontFamily + '";' +
        'src:url("' + String(state.customFontDataUrl).replace(/"/g, '\\"') + '") format("' + format + '");' +
        'font-weight:normal;' +
        'font-style:normal;' +
        'font-display:swap;' +
      '}' +
      '#fp-game,' +
      '#fp-game *,' +
      '#fp-game button,' +
      '#fp-game input,' +
      '#fp-game select,' +
      '#fp-game textarea{' +
        'font-family:"' + state.customFontFamily + '", Arial, sans-serif !important;' +
      '}';

    document.head.appendChild(style);
    app.style.setProperty("--fp-font-family", '"' + state.customFontFamily + '", Arial, sans-serif');
    el.fontStatus.textContent = "Custom font loaded: " + (fileName || "Uploaded font");
  }

  function applyHeaderLogoLayout() {
    const height = Math.max(24, Math.min(220, state.headerLogoHeight || 56));
    const maxWidth = Math.max(80, Math.min(500, state.headerLogoMaxWidth || 240));
    const offset = Math.max(0, Math.min(500, state.headerLogoOffsetY || 200));

    state.headerLogoHeight = height;
    state.headerLogoMaxWidth = maxWidth;
    state.headerLogoOffsetY = offset;

    app.style.setProperty("--fp-header-logo-height", height + "px");
    app.style.setProperty("--fp-header-logo-max-width", maxWidth + "px");
    app.style.setProperty("--fp-header-logo-offset-y", (-offset) + "px");
  }

  function applyHudOffset() {
    const offset = Math.max(-500, Math.min(500, state.hudOffsetY || 0));
    state.hudOffsetY = offset;
    app.style.setProperty("--fp-hud-offset-y", offset + "px");
  }

  function applyBoardOffset() {
    const offset = Math.max(-500, Math.min(500, state.boardOffsetY || 0));
    state.boardOffsetY = offset;
    app.style.setProperty("--fp-board-offset-y", offset + "px");
  }

  function getScores() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.leaderboard) || "[]");
  }

  function formatLeaderboardEntry(entry, index, live) {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
    const cls = live && index === 0 ? ' class="fp-live-score gold"' : live ? ' class="fp-live-score"' : "";

    if (entry.mode === "survival") {
      const roundText = "R" + entry.r;
      const line = medal
        ? medal + " " + entry.n + " " + roundText + " " + entry.t.toFixed(2) + "s"
        : entry.n + " " + roundText + " " + entry.t.toFixed(2) + "s";
      return live
        ? '<div' + cls + '>' + line + "</div>"
        : "<div>" + (index + 1) + ". " + entry.n + " – " + roundText + " – " + entry.t.toFixed(2) + "s</div>";
    }

    const goalLine = medal
      ? medal + " " + entry.n + " " + entry.t.toFixed(2) + "s"
      : entry.n + " " + entry.t.toFixed(2) + "s";
    return live
      ? '<div' + cls + '>' + goalLine + "</div>"
      : "<div>" + (index + 1) + ". " + entry.n + " – " + entry.t.toFixed(2) + "s</div>";
  }

  function sortLeaderboardEntries(entries) {
    return entries.sort(function (a, b) {
      if (a.mode === "survival" || b.mode === "survival") {
        const ar = Number(a.r || 0);
        const br = Number(b.r || 0);
        if (br !== ar) return br - ar;
        return Number(a.t || 999999) - Number(b.t || 999999);
      }
      return Number(a.t || 999999) - Number(b.t || 999999);
    });
  }

  function getCurrentModeScores() {
    const all = getScores();
    return sortLeaderboardEntries(
      all.filter(function (entry) {
        return entry.category === getCurrentLeaderboardCategory();
      })
    ).slice(0, 5);
  }

  function renderLiveLeaderboard() {
    const scores = getCurrentModeScores();
    if (!scores.length) {
      el.liveLeaderboard.innerHTML = "";
      return;
    }

    const top = scores.slice(0, 3);
    let html = "";

    top.forEach(function (item, index) {
      html += formatLeaderboardEntry(item, index, true);
    });

    el.liveLeaderboard.innerHTML = html;
  }

  function renderLeaderboard() {
    const scores = getCurrentModeScores();
    renderLiveLeaderboard();

    if (!scores.length) {
      el.leaderboard.innerHTML = "";
      return;
    }

    let html = "<h3>" + getCurrentLeaderboardHeading() + "</h3>";
    scores.forEach(function (item, index) {
      html += formatLeaderboardEntry(item, index, false);
    });
    el.leaderboard.innerHTML = html;
  }

  function flashFirstPlaceBanner(text) {
    el.firstPlaceBanner.textContent = text;
    el.firstPlaceBanner.classList.remove("show");
    void el.firstPlaceBanner.offsetWidth;
    el.firstPlaceBanner.classList.add("show");
  }

  function saveScore(payload) {
    const allScores = getScores();
    const category = payload.category;
    const relevantOld = sortLeaderboardEntries(
      allScores.filter(function (entry) { return entry.category === category; })
    );
    const oldFirst = relevantOld.length ? relevantOld[0] : null;

    const untouched = allScores.filter(function (entry) {
      return entry.category !== category;
    });

    let merged = relevantOld.slice();
    merged.push(payload);
    merged = sortLeaderboardEntries(merged).slice(0, 5);

    localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(untouched.concat(merged)));

    const newFirst = merged.length ? merged[0] : null;
    const isNewFirst = !!newFirst && newFirst.n === payload.n;

    renderLeaderboard();

    if (isNewFirst) {
      if (payload.mode === "survival") {
        const oldRound = oldFirst ? Number(oldFirst.r || 0) : -1;
        const better =
          !oldFirst ||
          Number(payload.r || 0) > oldRound ||
          (Number(payload.r || 0) === oldRound && Number(payload.t || 999999) < Number(oldFirst.t || 999999));

        if (better) {
          flashFirstPlaceBanner("New 1st Place! " + payload.n + " – R" + payload.r + " – " + payload.t.toFixed(2) + "s");
        }
      } else {
        const betterGoal = !oldFirst || Number(payload.t || 999999) < Number(oldFirst.t || 999999);
        if (betterGoal) {
          flashFirstPlaceBanner("New 1st Place! " + payload.n + " – " + payload.t.toFixed(2) + "s");
        }
      }
    }
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

  function buildSettingsPayload() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: {
        winTarget: state.winTarget,
        startCountdown: state.startCountdown,
        roundTime: state.roundTime,
        idleRefreshSeconds: state.idleRefreshSeconds,
        cardCount: state.cardCount,
        idlePreview: state.idlePreview,
        startPreview: state.startPreview,
        adminPin: state.adminPin,
        showCursor: state.showCursor,
        hudOffsetY: state.hudOffsetY,
        boardOffsetY: state.boardOffsetY,
        rounds: state.rounds,
        roundDifficulty: state.roundDifficulty,
        theme: state.theme,
        logoUrl: state.logoUrl,
        headerLogoUrl: state.headerLogoUrl,
        headerLogoHeight: state.headerLogoHeight,
        headerLogoMaxWidth: state.headerLogoMaxWidth,
        headerLogoOffsetY: state.headerLogoOffsetY,
        bgImageUrl: state.bgImageUrl,
        customFontDataUrl: state.customFontDataUrl,
        customFontFileName: state.customFontFileName
      }
    };
  }

  function persistSettings() {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(buildSettingsPayload().settings));
  }

  function applySettingsObject(saved) {
    if (!saved || typeof saved !== "object") return;

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
    if (CARD_COUNTS.indexOf(saved.cardCount) > -1) {
      state.cardCount = saved.cardCount;
    }
    if (typeof saved.idlePreview === "boolean") state.idlePreview = saved.idlePreview;
    if (typeof saved.startPreview === "boolean") state.startPreview = saved.startPreview;
    if (typeof saved.showCursor === "boolean") state.showCursor = saved.showCursor;
    if (typeof saved.adminPin === "string" && saved.adminPin.trim()) state.adminPin = saved.adminPin.trim();

    if (typeof saved.hudOffsetY === "number") {
      state.hudOffsetY = Math.max(-500, Math.min(500, saved.hudOffsetY));
    } else {
      state.hudOffsetY = 0;
    }

    if (typeof saved.boardOffsetY === "number") {
      state.boardOffsetY = Math.max(-500, Math.min(500, saved.boardOffsetY));
    } else if (typeof saved.topOffsetY === "number") {
      state.boardOffsetY = Math.max(-500, Math.min(500, saved.topOffsetY));
    } else {
      state.boardOffsetY = 0;
    }

    if (saved.rounds === "endless" || [1, 2, 3, 5].indexOf(saved.rounds) > -1) {
      state.rounds = saved.rounds;
    } else {
      state.rounds = DEFAULTS.rounds;
    }

    if (ROUND_DIFFICULTIES.indexOf(saved.roundDifficulty) > -1) {
      state.roundDifficulty = saved.roundDifficulty;
    } else {
      state.roundDifficulty = DEFAULTS.roundDifficulty;
    }

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
    } else {
      state.logoUrl = DEFAULTS.logoUrl;
    }

    if (typeof saved.headerLogoUrl === "string" && saved.headerLogoUrl.trim()) {
      state.headerLogoUrl = saved.headerLogoUrl;
    } else {
      state.headerLogoUrl = DEFAULTS.headerLogoUrl;
    }

    if (typeof saved.headerLogoHeight === "number") {
      state.headerLogoHeight = Math.max(24, Math.min(220, saved.headerLogoHeight));
    } else {
      state.headerLogoHeight = DEFAULTS.headerLogoHeight;
    }

    if (typeof saved.headerLogoMaxWidth === "number") {
      state.headerLogoMaxWidth = Math.max(80, Math.min(500, saved.headerLogoMaxWidth));
    } else {
      state.headerLogoMaxWidth = DEFAULTS.headerLogoMaxWidth;
    }

    if (typeof saved.headerLogoOffsetY === "number") {
      state.headerLogoOffsetY = Math.max(0, Math.min(500, saved.headerLogoOffsetY));
    } else {
      state.headerLogoOffsetY = DEFAULTS.headerLogoOffsetY;
    }

    if (typeof saved.bgImageUrl === "string") {
      state.bgImageUrl = saved.bgImageUrl;
    } else {
      state.bgImageUrl = DEFAULTS.bgImageUrl;
    }

    if (typeof saved.customFontDataUrl === "string") {
      state.customFontDataUrl = saved.customFontDataUrl;
    } else {
      state.customFontDataUrl = "";
    }

    if (typeof saved.customFontFileName === "string") {
      state.customFontFileName = saved.customFontFileName;
    } else {
      state.customFontFileName = "";
    }

    state.customFontFamily = "";
  }

  function loadSettings() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || "null");
    if (!saved) return;
    applySettingsObject(saved);
  }

  function applyLogo(url) {
    state.logoUrl = url || DEFAULTS.logoUrl;
    app.style.setProperty("--fp-logo-url", 'url("' + escapeForCssUrl(state.logoUrl) + '")');
    el.logoStatus.textContent = state.logoUrl === DEFAULTS.logoUrl
      ? "Using default card-back logo."
      : "Custom card-back logo loaded and saved.";
  }

  function applyHeaderLogo(url) {
    state.headerLogoUrl = url || DEFAULTS.headerLogoUrl;
    if (state.headerLogoUrl) {
      el.headerLogo.src = state.headerLogoUrl;
      el.headerLogoWrap.classList.remove("hidden");
      el.headerLogoStatus.textContent =
        state.headerLogoUrl === DEFAULTS.headerLogoUrl
          ? "Using default header logo."
          : "Custom header logo loaded and saved.";
    } else {
      el.headerLogo.src = DEFAULTS.headerLogoUrl;
      el.headerLogoWrap.classList.remove("hidden");
      el.headerLogoStatus.textContent = "Using default header logo.";
      state.headerLogoUrl = DEFAULTS.headerLogoUrl;
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

  function applyCursorMode() {
    app.classList.toggle("fp-show-cursor", !!state.showCursor);
  }

  function updateRoundPill() {
    if (!isSurvivalMode()) {
      el.roundPill.classList.add("hidden");
      el.roundPill.textContent = "";
      return;
    }

    const total = state.rounds === "endless" ? "∞" : state.rounds;
    const deckSize = state.activeCardCount || state.cardCount;
    const targetLabel = getWinTargetLabelFor(deckSize, state.currentRound).replace(" Matches", "").replace(" Match", "");
    el.roundPill.textContent = "ROUND " + state.currentRound + "/" + total + " • TARGET " + targetLabel;
    el.roundPill.classList.remove("hidden");
  }

  function updateSettingsUI() {
    el.winTargets.forEach(function (btn) {
      btn.classList.toggle("active", String(state.winTarget) === btn.getAttribute("data-win"));
    });

    setWinTargetDisabledUi(isWinTargetOverridden());

    el.cardCountButtons.forEach(function (btn) {
      btn.classList.toggle("active", String(state.cardCount) === btn.getAttribute("data-card-count"));
    });

    el.roundButtons.forEach(function (btn) {
      btn.classList.toggle("active", String(state.rounds) === btn.getAttribute("data-rounds"));
    });

    el.difficultyButtons.forEach(function (btn) {
      btn.classList.toggle("active", String(state.roundDifficulty) === btn.getAttribute("data-difficulty"));
    });

    el.countdownInput.value = state.startCountdown;
    el.roundTimerInput.value = state.roundTime;
    el.idleRefreshInput.value = state.idleRefreshSeconds;
    el.idlePreviewInput.checked = state.idlePreview;
    el.startPreviewInput.checked = state.startPreview;
    el.showCursorInput.checked = state.showCursor;

    if (el.headerLogoSizeInput) el.headerLogoSizeInput.value = state.headerLogoHeight;
    if (el.headerLogoOffsetInput) el.headerLogoOffsetInput.value = state.headerLogoOffsetY;
    if (el.hudOffsetInput) el.hudOffsetInput.value = state.hudOffsetY;
    if (el.boardOffsetInput) el.boardOffsetInput.value = state.boardOffsetY;

    syncColorInputsFromTheme();

    el.logoStatus.textContent = state.logoUrl === DEFAULTS.logoUrl
      ? "Using default card-back logo."
      : "Custom card-back logo loaded and saved.";

    el.headerLogoStatus.textContent = state.headerLogoUrl === DEFAULTS.headerLogoUrl
      ? "Using default header logo."
      : "Custom header logo loaded and saved.";

    el.bgStatus.textContent = state.bgImageUrl
      ? "Custom background image loaded and saved."
      : "Using color background only.";

    el.fontStatus.textContent = state.customFontDataUrl
      ? "Custom font loaded: " + (state.customFontFileName || "Uploaded font")
      : "Using default font.";

    el.settingsTransferStatus.textContent = "Export your settings to move them to another monitor, then import that JSON there.";

    el.currentPin.value = "";
    el.newPin.value = "";
    el.confirmPin.value = "";
    el.pinStatus.textContent = "";

    updateTitleForCurrentTarget();
  }

  function openAdmin() {
    el.adminModal.classList.remove("hidden");
    el.adminLock.classList.remove("hidden");
    el.adminUI.classList.add("hidden");
    el.adminPin.value = "";
    updateAdminPinUI();
    buildAdminPinKeyboard();
  }

  function closeAdmin() {
    state.adminUnlocked = false;
    el.adminModal.classList.add("hidden");
    el.adminLock.classList.remove("hidden");
    el.adminUI.classList.add("hidden");
    el.adminPin.value = "";
    updateAdminPinUI();
  }

  function unlockAdmin() {
    if (el.adminPin.value === state.adminPin) {
      state.adminUnlocked = true;
      el.adminLock.classList.add("hidden");
      el.adminUI.classList.remove("hidden");
      updateSettingsUI();
    } else {
      el.adminPin.value = "";
      updateAdminPinUI();
      el.adminPinDisplay.textContent = "INCORRECT PIN";
      el.adminPinDisplay.classList.add("empty");
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
    const count = state.deck.length || state.activeCardCount || state.cardCount;
    const grid = getGridForCount(count);
    el.board.style.gridTemplateColumns = "repeat(" + grid.cols + ", 1fr)";
    el.board.style.gridTemplateRows = "repeat(" + grid.rows + ", 1fr)";
    el.board.setAttribute("data-card-count", String(count));
  }

  async function buildDeck(cardCountOverride) {
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

    const deckSize = cardCountOverride || state.cardCount;
    const pairCount = deckSize / 2;
    shuffle(urls);
    const chosen = urls.slice(0, pairCount);
    return shuffle(chosen.concat(chosen));
  }

  function setTimerDisplay(value) {
    el.timer.textContent = String(value);
  }

  function startRoundTimer() {
    let remaining = state.activeRoundTime;
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

  function updateAdminPinUI() {
    const value = el.adminPin.value || "";
    if (!value.length) {
      el.adminPinDisplay.textContent = "ENTER PIN";
      el.adminPinDisplay.classList.add("empty");
    } else {
      el.adminPinDisplay.textContent = "• ".repeat(value.length).trim();
      el.adminPinDisplay.classList.remove("empty");
    }
  }

  function pressAdminPinKey(value) {
    if (value === "CLEAR") {
      el.adminPin.value = "";
    } else if (value === "←") {
      el.adminPin.value = el.adminPin.value.slice(0, -1);
    } else if (/^\d$/.test(value) && el.adminPin.value.length < 8) {
      el.adminPin.value += value;
    }

    updateAdminPinUI();
  }

  function buildAdminPinKeyboard() {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLEAR", "0", "←"];
    el.adminPinKeys.innerHTML = "";

    keys.forEach(function (key) {
      const button = document.createElement("div");
      button.className = "fp-admin-pin-key";
      button.textContent = key === "←" ? "⌫" : key;
      button.onclick = function () {
        pressAdminPinKey(key);
      };
      el.adminPinKeys.appendChild(button);
    });
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
    const rows = [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L", "←"],
      ["Z", "X", "C", "V", "B", "N", "M"]
    ];

    el.keys.innerHTML = "";

    rows.forEach(function (row) {
      row.forEach(function (key) {
        const button = document.createElement("div");
        button.className = "fp-key";
        button.textContent = key === "←" ? "⌫" : key;
        button.onclick = function () {
          pressKey(key);
        };
        el.keys.appendChild(button);
      });
    });

    const spaceButton = document.createElement("div");
    spaceButton.className = "fp-key bottom-key bottom-left";
    spaceButton.textContent = "SPACE";
    spaceButton.onclick = function () {
      pressKey("SPACE");
    };
    el.keys.appendChild(spaceButton);

    const clearButton = document.createElement("div");
    clearButton.className = "fp-key bottom-key bottom-right";
    clearButton.textContent = "CLEAR";
    clearButton.onclick = function () {
      pressKey("CLEAR");
    };
    el.keys.appendChild(clearButton);
  }

  function shouldWinNow() {
    return state.matchedPairs >= state.activeWinTarget;
  }

  function getMatchedCardKeysFromBoard() {
    const matchedKeys = [];
    [...el.board.querySelectorAll(".fp-card.matched")].forEach(function (card) {
      matchedKeys.push(card.dataset.k);
    });
    return matchedKeys;
  }

  function renderBoard(showAll, preserveMatched) {
    applyBoardLayout();

    const matchedKeys = preserveMatched ? getMatchedCardKeysFromBoard() : [];
    const matchedCounts = {};

    matchedKeys.forEach(function (key) {
      matchedCounts[key] = (matchedCounts[key] || 0) + 1;
    });

    el.board.innerHTML = "";

    state.deck.forEach(function (src) {
      const card = document.createElement("div");
      card.className = "fp-card";
      card.dataset.k = src;

      const shouldStayMatched = preserveMatched && matchedCounts[src] > 0;

      if (showAll || shouldStayMatched) {
        card.classList.add("show");
      }

      if (shouldStayMatched) {
        card.classList.add("matched");
        matchedCounts[src]--;
      }

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
          state.misses += 1;
          const a = state.firstCard;
          const b = card;

          setTimeout(function () {
            a.classList.remove("show");
            b.classList.remove("show");
            state.firstCard = null;

            if (state.roundDifficulty === "randomReshuffle") {
              runMissReshufflePreviewFinalState();
            } else {
              state.lockBoard = false;
            }
          }, 700);
        }
      };
    });

    updateBoardShellMode();
    updateTitleForCurrentTarget();
  }

  function reshuffleUnmatchedDeck() {
    const matchedKeys = getMatchedCardKeysFromBoard();
    const matchedCounts = {};

    matchedKeys.forEach(function (key) {
      matchedCounts[key] = (matchedCounts[key] || 0) + 1;
    });

    const unmatchedPool = state.deck.slice();
    const nextDeck = [];

    Object.keys(matchedCounts).forEach(function (key) {
      let remainingToRemove = matchedCounts[key];

      for (let i = unmatchedPool.length - 1; i >= 0; i--) {
        if (remainingToRemove <= 0) break;
        if (unmatchedPool[i] === key) {
          unmatchedPool.splice(i, 1);
          remainingToRemove--;
        }
      }
    });

    shuffle(unmatchedPool);

    state.deck.forEach(function (key) {
      if (matchedCounts[key] > 0) {
        nextDeck.push(key);
        matchedCounts[key]--;
      } else {
        nextDeck.push(unmatchedPool.shift());
      }
    });

    state.deck = nextDeck;
  }

  function showStatusFlash(done) {
    if (!el.statusFlash) {
      if (typeof done === "function") done();
      return;
    }

    el.statusFlash.innerHTML =
      '<span class="fp-status-line-1">MISS!</span>' +
      '<span class="fp-status-line-2">RESHUFFLING...</span>';

    el.statusFlash.classList.remove("hidden");
    el.statusFlash.style.display = "block";

    requestAnimationFrame(function () {
      el.statusFlash.classList.add("show");
    });

    setTimeout(function () {
      el.statusFlash.classList.remove("show");

      setTimeout(function () {
        el.statusFlash.classList.add("hidden");
        el.statusFlash.style.display = "none";
        if (typeof done === "function") done();
      }, 180);
    }, 520);
  }

  function previewFinalStateThenHide(done) {
    const unmatchedCards = [...el.board.querySelectorAll(".fp-card:not(.matched)")];

    unmatchedCards.forEach(function (card) {
      card.classList.add("show");
    });

    setTimeout(function () {
      unmatchedCards.forEach(function (card) {
        card.classList.remove("show");
      });

      setTimeout(function () {
        if (typeof done === "function") done();
      }, 120);
    }, 420);
  }

  function runMissReshufflePreviewFinalState() {
    state.lockBoard = true;

    const oldCards = [...el.board.children];
    const firstRects = oldCards.map(function (card) {
      return card.getBoundingClientRect();
    });

    showStatusFlash(function () {
      reshuffleUnmatchedDeck();
      renderBoard(false, true);

      const newCards = [...el.board.children];
      const lastRects = newCards.map(function (card) {
        return card.getBoundingClientRect();
      });

      newCards.forEach(function (card, index) {
        const oldRect = firstRects[index];
        const newRect = lastRects[index];
        if (!oldRect || !newRect) return;

        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top - newRect.top;

        card.style.transition = "none";
        card.style.transform = "translate(" + dx + "px," + dy + "px)";
      });

      el.board.classList.add("fp-reshuffle");

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          newCards.forEach(function (card) {
            card.style.transition = "transform .42s ease";
            card.style.transform = "translate(0,0)";
          });

          setTimeout(function () {
            newCards.forEach(function (card) {
              card.style.transition = "";
              card.style.transform = "";
            });

            el.board.classList.remove("fp-reshuffle");

            previewFinalStateThenHide(function () {
              state.lockBoard = false;
            });
          }, 440);
        });
      });
    });
  }

  function animateBoardRefresh(nextShowAll) {
    el.board.classList.add("fp-refresh-out");

    setTimeout(function () {
      renderBoard(nextShowAll, false);
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
  }

  function showResult(title, text, delayMs) {
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
    }, typeof delayMs === "number" ? delayMs : 5000);
  }

  function showRoundTransition(title, copy, done) {
    clearTimeout(state.autoBackTimer);
    el.roundTransitionKicker.textContent = isSurvivalMode() ? "Next Round" : "Get Ready";
    el.roundTransitionTitle.textContent = title;
    el.roundTransitionCopy.textContent = copy;
    el.roundTransition.classList.remove("hidden");

    requestAnimationFrame(function () {
      el.roundTransition.classList.add("show");
    });

    setTimeout(function () {
      el.roundTransition.classList.remove("show");
      setTimeout(function () {
        el.roundTransition.classList.add("hidden");
        if (typeof done === "function") done();
      }, 280);
    }, 2400);
  }

  function getSurvivalTotalCompletedTime() {
    return state.roundResults.reduce(function (sum, item) {
      return sum + Number(item.time || 0);
    }, 0);
  }

  function getHighestCompletedRound() {
    return state.roundResults.length
      ? Math.max.apply(null, state.roundResults.map(function (item) { return Number(item.round || 0); }))
      : 0;
  }

  function finishGoalModeSuccess(elapsed) {
    if (state.playerName) {
      saveScore({
        n: state.playerName,
        t: elapsed,
        mode: "goal",
        category: getCurrentLeaderboardCategory(),
        winTarget: state.winTarget,
        ts: Date.now()
      });
    }

    state.playerName = "";
    updateNameUI();
    showResult(
      "You Found a Match!",
      "Target: " + getWinTargetLabelFor(state.deck.length, state.currentRound) + ". Time: " + elapsed.toFixed(2) + "s",
      5000
    );
  }

  function finishSurvivalModeSuccess(totalTime) {
    if (state.playerName) {
      saveScore({
        n: state.playerName,
        t: totalTime,
        r: Number(state.currentRound),
        mode: "survival",
        category: getCurrentLeaderboardCategory(),
        difficulty: state.roundDifficulty,
        ts: Date.now()
      });
    }

    state.playerName = "";
    updateNameUI();
    showResult(
      "Survival Complete!",
      "Completed " + state.currentRound + " rounds in " + totalTime.toFixed(2) + "s",
      6000
    );
  }

  function finishSurvivalModeLoss() {
    const completedRound = getHighestCompletedRound();
    const totalTime = getSurvivalTotalCompletedTime();

    if (state.playerName && completedRound > 0) {
      saveScore({
        n: state.playerName,
        t: totalTime,
        r: completedRound,
        mode: "survival",
        category: getCurrentLeaderboardCategory(),
        difficulty: state.roundDifficulty,
        ts: Date.now()
      });
    }

    state.playerName = "";
    updateNameUI();

    if (completedRound > 0) {
      showResult(
        "Round Over",
        "You reached round " + completedRound + " with a total time of " + totalTime.toFixed(2) + "s",
        6000
      );
    } else {
      showResult(
        "Time's Up!",
        "You did not complete round 1. Starting over shortly...",
        5000
      );
    }
  }

  function advanceToNextRound() {
    state.currentRound += 1;
    startConfiguredRound();
  }

  function winRound() {
    clearInterval(state.roundTimerId);
    state.gameActive = false;

    const elapsed = (Date.now() - state.roundStartedAt) / 1000;
    state.roundResults.push({
      round: state.currentRound,
      time: elapsed,
      misses: state.misses,
      cardCount: state.activeCardCount,
      timer: state.activeRoundTime,
      target: state.activeWinTarget
    });

    if (!isSurvivalMode()) {
      finishGoalModeSuccess(elapsed);
      return;
    }

    const maxRounds = getMaxRoundsValue();

    if (state.rounds === "endless") {
      showRoundTransition(
        "Round " + state.currentRound + " Complete",
        "Fresh photos loaded. Next target: " + getWinTargetLabelFor(state.activeCardCount, state.currentRound + 1) + ".",
        advanceToNextRound
      );
      return;
    }

    if (state.currentRound < maxRounds) {
      showRoundTransition(
        "Round " + state.currentRound + " Complete",
        "Fresh photos loaded. Next target: " + getWinTargetLabelFor(state.activeCardCount, state.currentRound + 1) + ".",
        advanceToNextRound
      );
      return;
    }

    finishSurvivalModeSuccess(getSurvivalTotalCompletedTime());
  }

  function loseRound() {
    clearInterval(state.roundTimerId);
    state.gameActive = false;

    if (!isSurvivalMode()) {
      state.playerName = "";
      updateNameUI();
      showResult("Time's Up!", "Starting over shortly...");
      return;
    }

    finishSurvivalModeLoss();
  }

  function resetRoundState() {
    state.currentRound = 1;
    state.roundResults = [];
    state.misses = 0;
    state.activeRoundTime = state.roundTime;
    state.activeCardCount = state.cardCount;
    state.activeWinTarget = getActiveWinTargetForDeck(state.cardCount, 1);
  }

  function goIdle() {
    clearTimeout(state.autoBackTimer);
    clearInterval(state.roundTimerId);

    resetRoundState();
    setTimerDisplay(state.roundTime);
    el.player.textContent = "";
    state.playerName = "";
    state.firstCard = null;
    state.lockBoard = false;
    state.matchedPairs = 0;
    state.gameActive = false;

    el.center.classList.add("hidden");
    el.countdown.classList.add("hidden");
    el.roundTransition.classList.remove("show");
    el.roundTransition.classList.add("hidden");

    updateNameUI();
    updateRoundPill();
    updateTitleForCurrentTarget();

    if (state.deck.length) {
      renderBoard(state.idlePreview, false);
    }

    el.play.classList.remove("hidden");
    updateBoardShellMode();
    renderLiveLeaderboard();
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
    const idleDeck = await buildDeck(state.cardCount);
    state.deck = idleDeck;
    state.activeCardCount = state.cardCount;
    state.activeWinTarget = getActiveWinTargetForDeck(state.activeCardCount, state.currentRound);

    if (!state.gameActive) {
      if (withAnimation) {
        animateBoardRefresh(state.idlePreview);
      } else {
        renderBoard(state.idlePreview, false);
      }
    }

    updateTitleForCurrentTarget();
  }

  async function startConfiguredRound() {
    stopIdleRefreshTimer();

    const roundConfig = getRoundConfig(state.currentRound);
    state.activeRoundTime = roundConfig.timer;
    state.activeCardCount = roundConfig.cardCount;
    state.matchedPairs = 0;
    state.misses = 0;
    state.gameActive = false;
    state.firstCard = null;
    state.lockBoard = true;

    state.deck = await buildDeck(state.activeCardCount);
    state.activeWinTarget = getActiveWinTargetForDeck(state.deck.length, state.currentRound);

    updateRoundPill();
    updateTitleForCurrentTarget();

    el.center.classList.add("hidden");
    el.play.classList.add("hidden");

    renderBoard(state.startPreview, false);
    updateBoardShellMode();

    runCountdown(function () {
      [...el.board.children].forEach(function (card) {
        if (!card.classList.contains("matched")) {
          card.classList.remove("show");
        }
      });

      state.roundStartedAt = Date.now();
      state.lockBoard = false;
      state.gameActive = true;
      updateBoardShellMode();
      startRoundTimer();
    });
  }

  async function startGame() {
    if (state.playerName.length < 2) return;

    resetRoundState();

    const introTarget = getWinTargetLabelFor(state.cardCount, 1);
    const introTitle = getTitleForTarget(state.cardCount, 1);
    const title = isSurvivalMode() ? "Round 1" : "Start";
    const copy = isSurvivalMode()
      ? "Fresh photos loaded for round 1. Target: " + introTarget + "."
      : "Fresh photos loaded. " + introTitle + ".";

    showRoundTransition(title, copy, startConfiguredRound);
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
    const confirmed = window.confirm("Are you sure you want to reset all settings, custom colors, custom images, logos, font, PIN, and leaderboard?");
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
    state.showCursor = DEFAULTS.showCursor;
    state.hudOffsetY = DEFAULTS.hudOffsetY;
    state.boardOffsetY = DEFAULTS.boardOffsetY;
    state.rounds = DEFAULTS.rounds;
    state.roundDifficulty = DEFAULTS.roundDifficulty;
    state.theme = JSON.parse(JSON.stringify(DEFAULTS.theme));
    state.logoUrl = DEFAULTS.logoUrl;
    state.headerLogoUrl = DEFAULTS.headerLogoUrl;
    state.headerLogoHeight = DEFAULTS.headerLogoHeight;
    state.headerLogoMaxWidth = DEFAULTS.headerLogoMaxWidth;
    state.headerLogoOffsetY = DEFAULTS.headerLogoOffsetY;
    state.bgImageUrl = DEFAULTS.bgImageUrl;
    state.customFontDataUrl = "";
    state.customFontFileName = "";
    state.customFontFamily = "";

    resetRoundState();

    applyThemeColors(state.theme);
    applyLogo(state.logoUrl);
    applyHeaderLogo(state.headerLogoUrl);
    applyHeaderLogoLayout();
    applyHudOffset();
    applyBoardOffset();
    applyBackgroundImage(state.bgImageUrl);
    applyCustomFont("", "");
    renderLeaderboard();
    updateSettingsUI();
    applyCursorMode();
    updateRoundPill();
    updateTitleForCurrentTarget();
    setTimerDisplay(state.roundTime);
    startIdleRefreshTimer();

    if (!state.gameActive && state.deck.length) {
      renderBoard(state.idlePreview, false);
    }
  }

  function handleImageUpload(file, onLoad) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const result = String(event.target.result || "");
      if (!result) return;

      try {
        onLoad(result, file.name || "");
        persistSettings();
      } catch (error) {
        console.error(error);
        alert("Could not save that file. Try a smaller file.");
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

  function exportSettingsToJson() {
    const payload = buildSettingsPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.href = url;
    a.download = "focus-pocus-match-settings-" + stamp + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    el.settingsTransferStatus.textContent = "Settings JSON exported.";
  }

  function importSettingsFromJsonText(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      alert("That file is not valid JSON.");
      return;
    }

    const incoming = parsed && parsed.settings ? parsed.settings : parsed;
    if (!incoming || typeof incoming !== "object") {
      alert("That JSON file does not contain valid settings.");
      return;
    }

    applySettingsObject(incoming);
    applyThemeColors(state.theme);
    applyLogo(state.logoUrl);
    applyHeaderLogo(state.headerLogoUrl);
    applyHeaderLogoLayout();
    applyHudOffset();
    applyBoardOffset();
    applyBackgroundImage(state.bgImageUrl);
    applyCustomFont(state.customFontDataUrl, state.customFontFileName);
    updateSettingsUI();
    applyCursorMode();
    updateRoundPill();
    updateTitleForCurrentTarget();
    persistSettings();

    if (!state.gameActive) {
      setTimerDisplay(state.roundTime);
      if (state.deck.length) renderBoard(state.idlePreview, false);
      startIdleRefreshTimer();
    }

    el.settingsTransferStatus.textContent = "Settings JSON imported successfully.";
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

  if (el.headerLogoSizeInput) {
    el.headerLogoSizeInput.addEventListener("input", function () {
      const value = parseInt(el.headerLogoSizeInput.value, 10);
      if (!isNaN(value)) {
        state.headerLogoHeight = Math.max(24, Math.min(220, value));
        state.headerLogoMaxWidth = Math.max(80, Math.round(state.headerLogoHeight * 4.3));
        applyHeaderLogoLayout();
        persistSettings();
        updateSettingsUI();
      }
    });
  }

  if (el.headerLogoOffsetInput) {
    el.headerLogoOffsetInput.addEventListener("input", function () {
      const value = parseInt(el.headerLogoOffsetInput.value, 10);
      if (!isNaN(value)) {
        state.headerLogoOffsetY = Math.max(0, Math.min(500, value));
        applyHeaderLogoLayout();
        persistSettings();
      }
    });
  }

  if (el.hudOffsetInput) {
    el.hudOffsetInput.addEventListener("input", function () {
      const value = parseInt(el.hudOffsetInput.value, 10);
      if (!isNaN(value)) {
        state.hudOffsetY = Math.max(-500, Math.min(500, value));
        applyHudOffset();
        persistSettings();
      }
    });
  }

  if (el.boardOffsetInput) {
    el.boardOffsetInput.addEventListener("input", function () {
      const value = parseInt(el.boardOffsetInput.value, 10);
      if (!isNaN(value)) {
        state.boardOffsetY = Math.max(-500, Math.min(500, value));
        applyBoardOffset();
        persistSettings();
      }
    });
  }

  el.savePin.onclick = savePin;

  el.winTargets.forEach(function (button) {
    button.onclick = function () {
      if (isWinTargetOverridden()) return;

      const value = button.getAttribute("data-win");
      state.winTarget = value === "all" ? "all" : parseInt(value, 10);
      updateSettingsUI();
      renderLeaderboard();
      persistSettings();
    };
  });

  el.cardCountButtons.forEach(function (button) {
    button.onclick = function () {
      state.cardCount = parseInt(button.getAttribute("data-card-count"), 10);
      state.activeCardCount = state.cardCount;
      updateSettingsUI();
      persistSettings();
      prepareDeck(true);
    };
  });

  el.roundButtons.forEach(function (button) {
    button.onclick = function () {
      const value = button.getAttribute("data-rounds");
      state.rounds = value === "endless" ? "endless" : parseInt(value, 10);
      updateSettingsUI();
      updateRoundPill();
      renderLeaderboard();
      persistSettings();
    };
  });

  el.difficultyButtons.forEach(function (button) {
    button.onclick = function () {
      const value = button.getAttribute("data-difficulty");
      if (ROUND_DIFFICULTIES.indexOf(value) === -1) return;
      state.roundDifficulty = value;
      updateSettingsUI();
      updateRoundPill();
      renderLeaderboard();
      persistSettings();
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
    if (!state.gameActive && state.deck.length) renderBoard(state.idlePreview, false);
    persistSettings();
  });

  el.startPreviewInput.addEventListener("change", function () {
    state.startPreview = el.startPreviewInput.checked;
    persistSettings();
  });

  el.showCursorInput.addEventListener("change", function () {
    state.showCursor = el.showCursorInput.checked;
    applyCursorMode();
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
    if (file) handleImageUpload(file, function (dataUrl) {
      applyLogo(dataUrl);
    });
    el.logoUpload.value = "";
  });

  el.headerLogoUpload.addEventListener("change", function () {
    const file = el.headerLogoUpload.files && el.headerLogoUpload.files[0];
    if (file) handleImageUpload(file, function (dataUrl) {
      applyHeaderLogo(dataUrl);
    });
    el.headerLogoUpload.value = "";
  });

  el.bgUpload.addEventListener("change", function () {
    const file = el.bgUpload.files && el.bgUpload.files[0];
    if (file) handleImageUpload(file, function (dataUrl) {
      applyBackgroundImage(dataUrl);
    });
    el.bgUpload.value = "";
  });

  el.fontUpload.addEventListener("change", function () {
    const file = el.fontUpload.files && el.fontUpload.files[0];
    if (file) {
      handleImageUpload(file, function (dataUrl, fileName) {
        applyCustomFont(dataUrl, fileName);
      });
    }
    el.fontUpload.value = "";
  });

  el.exportSettings.addEventListener("click", exportSettingsToJson);

  el.importSettings.addEventListener("click", function () {
    el.importSettingsFile.click();
  });

  el.importSettingsFile.addEventListener("change", function () {
    const file = el.importSettingsFile.files && el.importSettingsFile.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      importSettingsFromJsonText(String(event.target.result || ""));
    };
    reader.readAsText(file);
    el.importSettingsFile.value = "";
  });

  el.removeLogo.addEventListener("click", function () {
    const confirmed = window.confirm("Remove the custom card-back logo and revert to the default logo?");
    if (!confirmed) return;
    applyLogo(DEFAULTS.logoUrl);
    persistSettings();
  });

  el.removeHeaderLogo.addEventListener("click", function () {
    const confirmed = window.confirm("Reset the header logo to the default BoothKit logo?");
    if (!confirmed) return;
    applyHeaderLogo(DEFAULTS.headerLogoUrl);
    state.headerLogoHeight = DEFAULTS.headerLogoHeight;
    state.headerLogoMaxWidth = DEFAULTS.headerLogoMaxWidth;
    state.headerLogoOffsetY = DEFAULTS.headerLogoOffsetY;
    applyHeaderLogoLayout();
    updateSettingsUI();
    persistSettings();
  });

  el.removeBg.addEventListener("click", function () {
    const confirmed = window.confirm("Remove the custom background image?");
    if (!confirmed) return;
    applyBackgroundImage("");
    persistSettings();
  });

  el.removeFont.addEventListener("click", function () {
    const confirmed = window.confirm("Remove the custom font and return to the default font?");
    if (!confirmed) return;
    applyCustomFont("", "");
    persistSettings();
  });

  window.addEventListener("resize", function () {
    applyBoardLayout();
    updateBoardShellMode();
  });

  loadSettings();
  applyThemeColors(state.theme);
  applyLogo(state.logoUrl);
  applyHeaderLogo(state.headerLogoUrl || DEFAULTS.headerLogoUrl);
  applyHeaderLogoLayout();
  applyHudOffset();
  applyBoardOffset();
  applyBackgroundImage(state.bgImageUrl);
  applyCustomFont(state.customFontDataUrl, state.customFontFileName);
  updateSettingsUI();
  renderLeaderboard();
  updateAdminPinUI();
  buildAdminPinKeyboard();
  applyCursorMode();
  updateRoundPill();
  updateTitleForCurrentTarget();

  prepareDeck(false).then(function () {
    setTimerDisplay(state.roundTime);
    goIdle();
  });
});
