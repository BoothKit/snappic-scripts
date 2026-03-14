document.addEventListener("DOMContentLoaded", function () {
  const host = document.querySelector("#content");
  const galleryImgs = [...document.querySelectorAll("#gallery .grid-item img")];
  if (!host || galleryImgs.length < 6) return;

  const state = {
    playerName: "",
    autoBackTimer: 0,
    roundTimerId: 0,
    firstCard: null,
    lockBoard: false,
    roundStartedAt: 0,
    deck: [],
    matchedPairs: 0,
    idlePreview: true,
    startPreview: true,
    winTarget: 1, // 1,2,3,4,"all"
    startCountdown: 3,
    roundTime: 20,
    gameActive: false,
    adminUnlocked: false,
    adminPin: "1111"
  };

  const app = document.createElement("div");
  app.id = "fp-game";
  app.innerHTML =
    '<div id="fp-wrap">' +
      '<div id="fp-top">' +
        '<div>' +
          '<div id="fp-title">Find the Match</div>' +
          '<div id="fp-player"></div>' +
        '</div>' +
        '<div id="fp-top-right">' +
          '<div id="fp-timer">20</div>' +
          '<button id="fp-admin" type="button" aria-label="Admin Settings">⚙</button>' +
        '</div>' +
      '</div>' +

      '<div id="fp-board"></div>' +

      '<button id="fp-play" type="button">Play</button>' +

      '<div id="fp-center" class="hidden">' +
        '<div id="fp-card">' +
          '<h2 id="fp-head">Find the Match</h2>' +
          '<p id="fp-copy">Enter your name, then tap start.</p>' +
          '<div id="fp-name">ENTER NAME</div>' +
          '<div id="fp-keys"></div>' +
          '<button id="fp-start" disabled>Tap to Start</button>' +
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
                '<p class="fp-admin-sub">Adjust gameplay, visuals, and leaderboard.</p>' +
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

                '<div class="fp-admin-row-2">' +
                  '<div>' +
                    '<label class="fp-admin-label" for="fp-setting-countdown">Countdown</label>' +
                    '<input id="fp-setting-countdown" class="fp-admin-number" type="number" min="0" max="10" step="1">' +
                  '</div>' +
                  '<div>' +
                    '<label class="fp-admin-label" for="fp-setting-timer">Round Timer</label>' +
                    '<input id="fp-setting-timer" class="fp-admin-number" type="number" min="5" max="120" step="1">' +
                  '</div>' +
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
                '</div>' +
              '</div>' +

            '</div>' +
          '</div>' +

        '</div>' +
      '</div>' +

    '</div>';

  host.appendChild(app);

  const el = {
    board: app.querySelector("#fp-board"),
    timer: app.querySelector("#fp-timer"),
    center: app.querySelector("#fp-center"),
    head: app.querySelector("#fp-head"),
    copy: app.querySelector("#fp-copy"),
    start: app.querySelector("#fp-start"),
    replay: app.querySelector("#fp-replay"),
    play: app.querySelector("#fp-play"),
    countdown: app.querySelector("#fp-countdown"),
    name: app.querySelector("#fp-name"),
    keys: app.querySelector("#fp-keys"),
    player: app.querySelector("#fp-player"),
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
    countdownInput: app.querySelector("#fp-setting-countdown"),
    roundTimerInput: app.querySelector("#fp-setting-timer"),
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
    resetLeaderboard: app.querySelector("#fp-reset-leaderboard")
  };

  function shuffle(arr) {
    for (let idx = arr.length - 1; idx > 0; idx--) {
      const rand = Math.floor(Math.random() * (idx + 1));
      [arr[idx], arr[rand]] = [arr[rand], arr[idx]];
    }
    return arr;
  }

  function getScores() {
    return JSON.parse(localStorage.getItem("fp_lb") || "[]");
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
    localStorage.setItem("fp_lb", JSON.stringify(scores));
    renderLeaderboard();
  }

  function clearLeaderboard() {
    localStorage.removeItem("fp_lb");
    renderLeaderboard();
  }

  function getWinTargetLabel() {
    return state.winTarget === "all"
      ? "All Matches"
      : state.winTarget + " Match" + (state.winTarget > 1 ? "es" : "");
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
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
  }

  function normalizeHex(value, fallback) {
    const trimmed = value.trim();
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

  function applyThemeColors(colors) {
    const bg = normalizeHex(colors.bg, "#0F1115");
    const accent = normalizeHex(colors.accent, "#FFFFFF");
    const accentText = normalizeHex(colors.accentText, "#111111");
    const card = normalizeHex(colors.card, "#151821");
    const panel = normalizeHex(colors.panel, "#1C1F27");

    app.style.setProperty("--fp-bg", bg);
    app.style.setProperty("--fp-text", "#FFFFFF");
    app.style.setProperty("--fp-panel", hexToRgba(panel, 0.88));
    app.style.setProperty("--fp-panel-border", hexToRgba(panel, 1));
    app.style.setProperty("--fp-card-front", card);
    app.style.setProperty("--fp-card-front-border", hexToRgba("#FFFFFF", 0.1));
    app.style.setProperty("--fp-chip-bg", hexToRgba("#FFFFFF", 0.1));
    app.style.setProperty("--fp-chip-border", hexToRgba("#FFFFFF", 0.18));
    app.style.setProperty("--fp-overlay", hexToRgba(bg, 0.84));
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

  function syncPickerAndText(picker, text, fallback) {
    picker.value = normalizeHex(text.value || fallback, fallback);
    text.value = picker.value;
  }

  function syncColorInputsFromTheme() {
    const styles = getComputedStyle(app);

    const bg = normalizeHex(styles.getPropertyValue("--fp-bg").trim(), "#0F1115");
    const accent = normalizeHex(styles.getPropertyValue("--fp-accent").trim(), "#FFFFFF");
    const accentText = normalizeHex(styles.getPropertyValue("--fp-accent-text").trim(), "#111111");
    const card = normalizeHex(styles.getPropertyValue("--fp-card-front").trim(), "#151821");

    el.bgPicker.value = bg;
    el.bgText.value = bg;

    el.accentPicker.value = accent;
    el.accentText.value = accent;

    el.accentTextPicker.value = accentText;
    el.accentTextText.value = accentText;

    el.cardPicker.value = card;
    el.cardText.value = card;

    const panelFallback = "#1C1F27";
    el.panelPicker.value = panelFallback;
    el.panelText.value = panelFallback;
  }

  function updateSettingsUI() {
    el.winTargets.forEach(function (btn) {
      btn.classList.toggle(
        "active",
        String(state.winTarget) === btn.getAttribute("data-win")
      );
    });

    el.countdownInput.value = state.startCountdown;
    el.roundTimerInput.value = state.roundTime;
    el.idlePreviewInput.checked = state.idlePreview;
    el.startPreviewInput.checked = state.startPreview;
    syncColorInputsFromTheme();
  }

  function openAdmin() {
    el.adminModal.classList.remove("hidden");
    if (state.adminUnlocked) {
      el.adminLock.classList.add("hidden");
      el.adminUI.classList.remove("hidden");
      updateSettingsUI();
    } else {
      el.adminLock.classList.remove("hidden");
      el.adminUI.classList.add("hidden");
      el.adminPin.value = "";
      setTimeout(function () {
        el.adminPin.focus();
      }, 10);
    }
  }

  function closeAdmin() {
    el.adminModal.classList.add("hidden");
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

  async function buildDeck() {
    const html = await fetch(location.href + "?t=" + Date.now(), { cache: "no-store" })
      .then(function (response) { return response.text(); });

    const doc = new DOMParser().parseFromString(html, "text/html");
    const urls = [
      ...new Set(
        [...doc.querySelectorAll("#gallery .grid-item img")].map(function (img) {
          return img.src;
        })
      )
    ];

    shuffle(urls);
    const chosen = urls.slice(0, 6);
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
    el.board.innerHTML = "";

    state.deck.forEach(function (src) {
      const card = document.createElement("div");
      card.className = "fp-card" + (showAll ? " show" : "");
      card.dataset.k = src;
      card.innerHTML =
        '<div class="fp-inner">' +
          '<div class="fp-face fp-front"><span>Tap</span></div>' +
          '<div class="fp-face fp-back"><img src="' + src + '"></div>' +
        '</div>';

      el.board.appendChild(card);

      card.onclick = function () {
        if (!state.gameActive) return;
        if (!el.center.classList.contains("hidden")) return;
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
  }

  function showNameEntry() {
    clearTimeout(state.autoBackTimer);
    el.head.textContent = "Find the Match";
    el.copy.textContent = "Enter your name, then tap start.";
    el.center.classList.remove("hidden");
    el.keys.style.display = "";
    el.name.style.display = "";
    el.start.classList.remove("hidden");
    el.replay.classList.add("hidden");
    renderLeaderboard();
    buildKeyboard();
    updateNameUI();
  }

  function showResult(title, text) {
    clearTimeout(state.autoBackTimer);
    el.head.textContent = title;
    el.copy.textContent = text;
    el.center.classList.remove("hidden");
    el.keys.style.display = "none";
    el.name.style.display = "none";
    el.start.classList.add("hidden");
    el.replay.classList.remove("hidden");
    renderLeaderboard();

    state.autoBackTimer = setTimeout(function () {
      goIdle();
    }, 5000);
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

  async function prepareDeck() {
    state.deck = await buildDeck();
    renderBoard(state.idlePreview);
  }

  async function startGame() {
    if (state.playerName.length < 2) return;

    state.deck = await buildDeck();
    state.matchedPairs = 0;
    state.gameActive = false;
    el.center.classList.add("hidden");
    el.play.classList.add("hidden");
    state.firstCard = null;
    state.lockBoard = true;

    renderBoard(state.startPreview);

    runCountdown(function () {
      [...el.board.children].forEach(function (card) {
        card.classList.remove("show");
      });

      state.roundStartedAt = Date.now();
      state.lockBoard = false;
      state.gameActive = true;
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

  el.play.onclick = showNameEntry;
  el.start.onclick = startGame;
  el.replay.onclick = goIdle;

  el.adminButton.onclick = openAdmin;
  el.adminBackdrop.onclick = closeAdmin;
  el.adminCloseLock.onclick = closeAdmin;
  el.adminClose.onclick = closeAdmin;
  el.adminUnlock.onclick = unlockAdmin;
  el.adminPin.addEventListener("keydown", function (event) {
    if (event.key === "Enter") unlockAdmin();
  });

  el.winTargets.forEach(function (button) {
    button.onclick = function () {
      const value = button.getAttribute("data-win");
      state.winTarget = value === "all" ? "all" : parseInt(value, 10);
      updateSettingsUI();
    };
  });

  el.countdownInput.addEventListener("input", function () {
    const value = parseInt(el.countdownInput.value, 10);
    if (!isNaN(value)) state.startCountdown = Math.max(0, Math.min(10, value));
  });

  el.roundTimerInput.addEventListener("input", function () {
    const value = parseInt(el.roundTimerInput.value, 10);
    if (!isNaN(value)) {
      state.roundTime = Math.max(5, Math.min(120, value));
      if (!state.gameActive) setTimerDisplay(state.roundTime);
    }
  });

  el.idlePreviewInput.addEventListener("change", function () {
    state.idlePreview = el.idlePreviewInput.checked;
    if (!state.gameActive && state.deck.length) renderBoard(state.idlePreview);
  });

  el.startPreviewInput.addEventListener("change", function () {
    state.startPreview = el.startPreviewInput.checked;
  });

  el.presetButtons.forEach(function (button) {
    button.onclick = function () {
      applyThemePreset(button.getAttribute("data-preset"));
    };
  });

  bindColorPair(el.bgPicker, el.bgText, "#0F1115");
  bindColorPair(el.accentPicker, el.accentText, "#FFFFFF");
  bindColorPair(el.accentTextPicker, el.accentTextText, "#111111");
  bindColorPair(el.cardPicker, el.cardText, "#151821");
  bindColorPair(el.panelPicker, el.panelText, "#1C1F27");

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
    clearLeaderboard();
  };

  applyThemePreset("dark");
  prepareDeck().then(function () {
    setTimerDisplay(state.roundTime);
    goIdle();
  });
});
