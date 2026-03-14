document.addEventListener("DOMContentLoaded", function () {
  let h = document.querySelector("#content");
  let i = [...document.querySelectorAll("#gallery .grid-item img")];

  if (!h || i.length < 6) return;

  let g = document.createElement("div");
  let pn = "";
  let autoBack = 0;

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

  let t = 20;
  let tm = 0;
  let f = null;
  let l = 0;
  let rs = 0;
  let deck = [];

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

  function adminMenu() {
    let pin = prompt("Enter admin PIN");
    if (pin === null) return;

    if (pin !== "1111") {
      alert("Incorrect PIN");
      return;
    }

    let action = prompt("Enter 1 to reset leaderboard");
    if (action === null) return;

    if (action === "1") {
      if (confirm("Reset leaderboard?")) {
        clearLeaderboard();
        alert("Leaderboard reset");
      }
    } else {
      alert("No action selected");
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
    t = 20;
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
        if (c.classList.contains("hidden") === false) return;
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

          if ([...b.querySelectorAll(".fp-card.matched")].length === deck.length) {
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

    let e = (Date.now() - rs) / 1000;

    if (pn) ss(pn, e);

    pn = "";
    upd();
    showResult("You Found Every Match!", "Starting over shortly...");
  }

  function lose() {
    clearInterval(tm);
    pn = "";
    upd();
    showResult("Time's Up!", "Starting over shortly...");
  }

  function idle() {
    clearTimeout(autoBack);
    clearInterval(tm);

    tE.textContent = "20";
    pl.textContent = "";
    pn = "";
    f = null;
    l = 0;

    c.classList.add("hidden");
    cd.classList.add("hidden");

    upd();

    if (deck.length) {
      renderBoard(false);
    }

    p.classList.remove("hidden");
  }

  function count(d) {
    let n = 3;

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
    renderBoard(false);
  }

  function startGame() {
    if (pn.length < 2) return;

    c.classList.add("hidden");
    p.classList.add("hidden");
    f = null;
    l = 1;

    renderBoard(true);

    count(function () {
      [...b.children].forEach(function (x) {
        x.classList.remove("show");
      });

      rs = Date.now();
      l = 0;
      timer();
    });
  }

  p.onclick = showNameEntry;
  s.onclick = startGame;
  r.onclick = idle;
  ad.onclick = adminMenu;

  prepareDeck().then(function () {
    idle();
  });
});
