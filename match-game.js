document.addEventListener("DOMContentLoaded", function () {
  let h = document.querySelector("#content");
  let i = [...document.querySelectorAll("#gallery .grid-item img")];

  if (!h || i.length < 6) return;

  let g = document.createElement("div");
  let pn = "";
  let autoBack = 0;
  let deck = [];
  let matchedPairs = 0;

  let idlePreview = true;
  let startPreview = true;
  let winTarget = 1; // 1,2,3,4 or "all"
  let startCountdown = 3;
  let roundTime = 20;
  let gameActive = false;

  g.id = "fp-game";
  g.innerHTML =
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
    '</div>';

  h.appendChild(g);

  let b = g.querySelector("#fp-board");
  let tE = g.querySelector("#fp-timer");
  let c = g.querySelector("#fp-center");
  let hd = g.querySelector("#fp-head");
  let cp = g.querySelector("#fp-copy");
  let s = g.querySelector("#fp-start");
  let r = g.querySelector("#fp-replay");
  let p = g.querySelector("#fp-play");
  let cd = g.querySelector("#fp-countdown");
  let nm = g.querySelector("#fp-name");
  let ky = g.querySelector("#fp-keys");
  let pl = g.querySelector("#fp-player");
  let ad = g.querySelector("#fp-admin");

  let t = roundTime;
  let tm = 0;
  let f = null;
  let l = 0;
  let rs = 0;

  function sh(a) {
    for (let i = a.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function gs() {
    return JSON.parse(localStorage.getItem("fp_lb") || "[]");
  }

  function rl() {
    let e = document.querySelector("#fp-leaderboard");
    let s = gs();

    if (!e) return;

    if (!s.length) {
      e.innerHTML = "";
      return;
    }

    let h = "<h3>Leaderboard</h3>";

    s.forEach(function (v, i) {
      h += "<div>" + (i + 1) + ". " + v.n + " – " + v.t.toFixed(2) + "s</div>";
    });

    e.innerHTML = h;
  }

  function ss(n, t) {
    let s = gs();

    s.push({ n: n, t: t });
    s.sort(function (a, b) {
      return a.t - b.t;
    });
    s = s.slice(0, 5);

    localStorage.setItem("fp_lb", JSON.stringify(s));
    rl();
  }

  function clearLeaderboard() {
    localStorage.removeItem("fp_lb");
    rl();
  }

  function getWinTargetLabel() {
    return winTarget === "all" ? "All Matches" : winTarget + " Match" + (winTarget > 1 ? "es" : "");
  }

  function applyThemePreset(name) {
    if (name === "1") {
      g.style.setProperty("--fp-bg", "#0f1115");
      g.style.setProperty("--fp-text", "#ffffff");
      g.style.setProperty("--fp-panel", "rgba(255,255,255,.08)");
      g.style.setProperty("--fp-panel-border", "rgba(255,255,255,.14)");
      g.style.setProperty("--fp-card-front", "#151821");
      g.style.setProperty("--fp-card-front-border", "rgba(255,255,255,.10)");
      g.style.setProperty("--fp-chip-bg", "rgba(255,255,255,.10)");
      g.style.setProperty("--fp-chip-border", "rgba(255,255,255,.18)");
      g.style.setProperty("--fp-overlay", "rgba(15,17,21,.84)");
      g.style.setProperty("--fp-countdown-overlay", "rgba(15,17,21,.72)");
      g.style.setProperty("--fp-key-bg", "rgba(255,255,255,.08)");
      g.style.setProperty("--fp-key-border", "rgba(255,255,255,.14)");
      g.style.setProperty("--fp-accent", "#ffffff");
      g.style.setProperty("--fp-accent-text", "#111111");
      g.style.setProperty("--fp-match-ring", "rgba(230,191,92,.95)");
      g.style.setProperty("--fp-match-glow", "rgba(230,191,92,.45)");
      alert("Theme set to Dark Default");
    } else if (name === "2") {
      g.style.setProperty("--fp-bg", "#0d1320");
      g.style.setProperty("--fp-text", "#f4f7ff");
      g.style.setProperty("--fp-panel", "rgba(99,102,241,.16)");
      g.style.setProperty("--fp-panel-border", "rgba(165,180,252,.24)");
      g.style.setProperty("--fp-card-front", "#11182b");
      g.style.setProperty("--fp-card-front-border", "rgba(165,180,252,.18)");
      g.style.setProperty("--fp-chip-bg", "rgba(99,102,241,.18)");
      g.style.setProperty("--fp-chip-border", "rgba(165,180,252,.24)");
      g.style.setProperty("--fp-overlay", "rgba(13,19,32,.84)");
      g.style.setProperty("--fp-countdown-overlay", "rgba(13,19,32,.72)");
      g.style.setProperty("--fp-key-bg", "rgba(99,102,241,.14)");
      g.style.setProperty("--fp-key-border", "rgba(165,180,252,.24)");
      g.style.setProperty("--fp-accent", "#6852F4");
      g.style.setProperty("--fp-accent-text", "#ffffff");
      g.style.setProperty("--fp-match-ring", "rgba(104,82,244,.95)");
      g.style.setProperty("--fp-match-glow", "rgba(104,82,244,.45)");
      alert("Theme set to BoothKit Purple");
    } else if (name === "3") {
      g.style.setProperty("--fp-bg", "#101010");
      g.style.setProperty("--fp-text", "#f7f3ea");
      g.style.setProperty("--fp-panel", "rgba(212,175,55,.10)");
      g.style.setProperty("--fp-panel-border", "rgba(212,175,55,.20)");
      g.style.setProperty("--fp-card-front", "#171717");
      g.style.setProperty("--fp-card-front-border", "rgba(212,175,55,.15)");
      g.style.setProperty("--fp-chip-bg", "rgba(212,175,55,.10)");
      g.style.setProperty("--fp-chip-border", "rgba(212,175,55,.20)");
      g.style.setProperty("--fp-overlay", "rgba(16,16,16,.84)");
      g.style.setProperty("--fp-countdown-overlay", "rgba(16,16,16,.72)");
      g.style.setProperty("--fp-key-bg", "rgba(212,175,55,.08)");
      g.style.setProperty("--fp-key-border", "rgba(212,175,55,.20)");
      g.style.setProperty("--fp-accent", "#d4af37");
      g.style.setProperty("--fp-accent-text", "#111111");
      g.style.setProperty("--fp-match-ring", "rgba(212,175,55,.95)");
      g.style.setProperty("--fp-match-glow", "rgba(212,175,55,.45)");
      alert("Theme set to Gold Luxe");
    }
  }

  function setCustomTheme() {
    let bg = prompt("Background color", getComputedStyle(g).getPropertyValue("--fp-bg").trim() || "#0f1115");
    if (bg === null) return;

    let accent = prompt("Accent/button color", getComputedStyle(g).getPropertyValue("--fp-accent").trim() || "#ffffff");
    if (accent === null) return;

    let accentText = prompt("Accent/button text color", getComputedStyle(g).getPropertyValue("--fp-accent-text").trim() || "#111111");
    if (accentText === null) return;

    let cardFront = prompt("Card front color", getComputedStyle(g).getPropertyValue("--fp-card-front").trim() || "#151821");
    if (cardFront === null) return;

    let panel = prompt("Popup panel color", getComputedStyle(g).getPropertyValue("--fp-panel").trim() || "rgba(255,255,255,.08)");
    if (panel === null) return;

    g.style.setProperty("--fp-bg", bg);
    g.style.setProperty("--fp-accent", accent);
    g.style.setProperty("--fp-accent-text", accentText);
    g.style.setProperty("--fp-card-front", cardFront);
    g.style.setProperty("--fp-panel", panel);

    alert("Custom theme applied");
  }

  function adminMenu() {
    let pin = prompt("Enter admin PIN");
    if (pin === null) return;

    if (pin !== "1111") {
      alert("Incorrect PIN");
      return;
    }

    let action = prompt(
      "1 = Reset leaderboard\n" +
      "2 = Set win target to 1 match\n" +
      "3 = Set win target to 2 matches\n" +
      "4 = Set win target to 3 matches\n" +
      "5 = Set win target to 4 matches\n" +
      "6 = Set win target to all matches\n" +
      "7 = Toggle idle photo preview\n" +
      "8 = Toggle start photo preview\n" +
      "9 = Set countdown seconds\n" +
      "10 = Set round timer seconds\n" +
      "11 = Theme: Dark Default\n" +
      "12 = Theme: BoothKit Purple\n" +
      "13 = Theme: Gold Luxe\n" +
      "14 = Custom colors"
    );

    if (action === "1") {
      if (confirm("Reset leaderboard?")) {
        clearLeaderboard();
        alert("Leaderboard reset");
      }
    } else if (action === "2") {
      winTarget = 1;
      alert("Win target set to " + getWinTargetLabel());
    } else if (action === "3") {
      winTarget = 2;
      alert("Win target set to " + getWinTargetLabel());
    } else if (action === "4") {
      winTarget = 3;
      alert("Win target set to " + getWinTargetLabel());
    } else if (action === "5") {
      winTarget = 4;
      alert("Win target set to " + getWinTargetLabel());
    } else if (action === "6") {
      winTarget = "all";
      alert("Win target set to " + getWinTargetLabel());
    } else if (action === "7") {
      idlePreview = !idlePreview;
      if (deck.length) renderBoard(idlePreview);
      alert("Idle preview " + (idlePreview ? "ON" : "OFF"));
    } else if (action === "8") {
      startPreview = !startPreview;
      alert("Start preview " + (startPreview ? "ON" : "OFF"));
    } else if (action === "9") {
      let v = prompt("Enter countdown seconds", String(startCountdown));
      if (v !== null) {
        v = parseInt(v, 10);
        if (!isNaN(v) && v >= 0 && v <= 10) {
          startCountdown = v;
          cd.textContent = startCountdown;
          alert("Countdown set to " + startCountdown + " seconds");
        } else {
          alert("Invalid countdown");
        }
      }
    } else if (action === "10") {
      let v = prompt("Enter round timer seconds", String(roundTime));
      if (v !== null) {
        v = parseInt(v, 10);
        if (!isNaN(v) && v >= 5 && v <= 120) {
          roundTime = v;
          tE.textContent = roundTime;
          alert("Round timer set to " + roundTime + " seconds");
        } else {
          alert("Invalid round timer");
        }
      }
    } else if (action === "11") {
      applyThemePreset("1");
    } else if (action === "12") {
      applyThemePreset("2");
    } else if (action === "13") {
      applyThemePreset("3");
    } else if (action === "14") {
      setCustomTheme();
    }
  }

  async function pk() {
    let h = await fetch(location.href + "?t=" + Date.now(), {
      cache: "no-store"
    }).then(function (r) {
      return r.text();
    });

    let d = new DOMParser().parseFromString(h, "text/html");
    let s = [
      ...new Set(
        [...d.querySelectorAll("#gallery .grid-item img")].map(function (x) {
          return x.src;
        })
      )
    ];

    sh(s);

    let u = s.slice(0, 6);
    return sh(u.concat(u));
  }

  function timer() {
    t = roundTime;
    tE.textContent = t;

    clearInterval(tm);

    tm = setInterval(function () {
      t--;
      tE.textContent = t;

      if (t <= 0) lose();
    }, 1000);
  }

  function upd() {
    nm.textContent = pn || "ENTER NAME";
    pl.textContent = pn ? "Player: " + pn : "";
    s.disabled = pn.length < 2;
  }

  function key(v) {
    if (v === "←") {
      pn = pn.slice(0, -1);
    } else if (v === "CLEAR") {
      pn = "";
    } else if (v === "SPACE") {
      if (pn.length < 12 && pn.length && pn[pn.length - 1] !== " ") {
        pn += " ";
      }
    } else if (pn.length < 12) {
      pn += v;
    }

    upd();
  }

  function mk() {
    let k = [
      "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P",
      "A", "S", "D", "F", "G", "H", "J", "K", "L", "←",
      "Z", "X", "C", "V", "B", "N", "M", "SPACE", "CLEAR"
    ];

    ky.innerHTML = "";

    k.forEach(function (v) {
      let d = document.createElement("div");
      d.className = "fp-key" + (v === "SPACE" || v === "CLEAR" ? " wide" : "");
      d.textContent = v === "←" ? "⌫" : v;
      d.onclick = function () {
        key(v);
      };
      ky.appendChild(d);
    });
  }

  function shouldWinNow() {
    if (winTarget === "all") {
      return matchedPairs >= deck.length / 2;
    }
    return matchedPairs >= winTarget;
  }

  function renderBoard(showAll) {
    b.innerHTML = "";

    deck.forEach(function (src) {
      let d = document.createElement("div");

      d.className = "fp-card" + (showAll ? " show" : "");
      d.dataset.k = src;
      d.innerHTML =
        '<div class="fp-inner">' +
          '<div class="fp-face fp-front"><span>Tap</span></div>' +
          '<div class="fp-face fp-back"><img src="' + src + '"></div>' +
        '</div>';

      b.appendChild(d);

      d.onclick = function () {
        if (!gameActive) return;
        if (!c.classList.contains("hidden")) return;
        if (l || d.classList.contains("matched") || d === f) return;

        d.classList.add("show");

        if (!f) {
          f = d;
          return;
        }

        l = 1;

        if (f.dataset.k === d.dataset.k) {
          f.classList.add("matched");
          d.classList.add("matched");
          f = null;
          matchedPairs++;

          if (shouldWinNow()) {
            setTimeout(win, 550);
          } else {
            l = 0;
          }
        } else {
          let a = f;
          let bb = d;

          setTimeout(function () {
            a.classList.remove("show");
            bb.classList.remove("show");
            f = null;
            l = 0;
          }, 700);
        }
      };
    });
  }

  function showNameEntry() {
    clearTimeout(autoBack);
    hd.textContent = "Find the Match";
    cp.textContent = "Enter your name, then tap start.";
    c.classList.remove("hidden");
    ky.style.display = "";
    nm.style.display = "";
    s.classList.remove("hidden");
    r.classList.add("hidden");
    rl();
    mk();
    upd();
  }

  function showResult(title, text) {
    clearTimeout(autoBack);
    hd.textContent = title;
    cp.textContent = text;
    c.classList.remove("hidden");
    ky.style.display = "none";
    nm.style.display = "none";
    s.classList.add("hidden");
    r.classList.remove("hidden");
    rl();

    autoBack = setTimeout(function () {
      idle();
    }, 5000);
  }

  function win() {
    clearInterval(tm);
    gameActive = false;

    let e = (Date.now() - rs) / 1000;

    if (pn) ss(pn, e);

    pn = "";
    upd();
    showResult("You Found a Match!", "Target: " + getWinTargetLabel() + ". Starting over shortly...");
  }

  function lose() {
    clearInterval(tm);
    gameActive = false;
    pn = "";
    upd();
    showResult("Time's Up!", "Starting over shortly...");
  }

  function idle() {
    clearTimeout(autoBack);
    clearInterval(tm);

    tE.textContent = String(roundTime);
    pl.textContent = "";
    pn = "";
    f = null;
    l = 0;
    matchedPairs = 0;
    gameActive = false;

    c.classList.add("hidden");
    cd.classList.add("hidden");

    upd();

    if (deck.length) {
      renderBoard(idlePreview);
    }

    p.classList.remove("hidden");
  }

  function count(d) {
    let n = startCountdown;

    if (n <= 0) {
      cd.classList.add("hidden");
      d();
      return;
    }

    cd.textContent = n;
    cd.classList.remove("hidden");

    let iv = setInterval(function () {
      n--;

      if (n <= 0) {
        clearInterval(iv);
        cd.classList.add("hidden");
        d();
      } else {
        cd.textContent = n;
      }
    }, 1000);
  }

  async function prepareDeck() {
    deck = await pk();
    renderBoard(idlePreview);
  }

  async function startGame() {
    if (pn.length < 2) return;

    deck = await pk();
    matchedPairs = 0;
    gameActive = false;
    c.classList.add("hidden");
    p.classList.add("hidden");
    f = null;
    l = 1;

    renderBoard(startPreview);

    count(function () {
      [...b.children].forEach(function (x) {
        x.classList.remove("show");
      });

      rs = Date.now();
      l = 0;
      gameActive = true;
      timer();
    });
  }

  p.onclick = showNameEntry;
  s.onclick = startGame;
  r.onclick = idle;
  ad.onclick = adminMenu;

  applyThemePreset("1");

  prepareDeck().then(function () {
    idle();
  });
});
