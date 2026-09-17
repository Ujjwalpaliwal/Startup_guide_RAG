(function () {
  var COLORS = {
    light: { a: "#f97316", b: "#7c3aed", glow: "rgba(249,115,22,0.16)", core: "rgba(124,58,237,0.10)" },
    dark: { a: "#fb923c", b: "#a78bfa", glow: "rgba(251,146,60,0.22)", core: "rgba(167,139,250,0.14)" },
  };

  var STATES = {
    working: { count: 10, radius: 15, speed: 1.1, wave: 1.8, dot: 3.4, jitter: 2.0, alpha: 0.9 },
    searching: { count: 8, radius: 13, speed: 2.6, wave: 3.0, dot: 3.1, jitter: 3.0, alpha: 1 },
    solving: { count: 6, radius: 11, speed: 1.6, wave: 1.2, dot: 4.2, jitter: 1.3, alpha: 1 },
    listening: { count: 12, radius: 17, speed: 0.7, wave: 0.9, dot: 2.7, jitter: 1.6, alpha: 0.95 },
    composing: { count: 16, radius: 19, speed: 1.0, wave: 2.4, dot: 2.2, jitter: 2.4, alpha: 0.9 },
    shaping: { count: 20, radius: 21, speed: 1.4, wave: 3.0, dot: 1.9, jitter: 4.0, alpha: 0.85 },
  };

  var PARAMS = ["count", "radius", "speed", "wave", "dot", "jitter", "alpha"];

  function avgFrameRateMs(prev, now) {
    return Math.max(0, Math.min(50, now - (prev || now)));
  }

  function Orb(canvas, options) {
    options = options || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.size = parseInt(options.size, 10) || 64;
    this.stateName = options.state || "working";
    this.themeName = options.theme || "auto";
    this.current = {};
    this.target = {};
    this.targetSet = false;
    this.t = 0;
    this.last = null;
    this.destroyed = false;
    this.mediaQuery = null;

    var base = STATES[this.stateName];
    var k = this.size / 64;
    var dotK = this.size <= 20 ? 0.9 : 1;
    for (var i = 0; i < PARAMS.length; i++) {
      var p = PARAMS[i];
      var v = base[p];
      if (p === "radius" || p === "jitter" || p === "dot") v = v * k * (p === "dot" ? dotK : 1);
      this.current[p] = v;
      this.target[p] = v;
    }
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    this.theme = this.resolveTheme();
    this.applyTheme();
    this.attachThemeListener();

    var orb = this;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      this.drawStatic();
    } else {
      var loop = function (now) {
        if (orb.destroyed) return;
        var dt = avgFrameRateMs(orb.last, now);
        orb.last = now;
        orb.t += dt / 1000;
        orb.smooth(dt);
        orb.draw();
        orb.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }

    this.canvas._orb = this;
  }

  Orb.prototype.resize = function () {
    var s = this.size * this.dpr;
    this.canvas.width = s;
    this.canvas.height = s;
    this.canvas.style.width = this.size + "px";
    this.canvas.style.height = this.size + "px";
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  Orb.prototype.resolveTheme = function () {
    if (this.themeName !== "auto") return this.themeName === "dark" ? "dark" : "light";
    var el = this.canvas;
    while (el) {
      var t = el.getAttribute && el.getAttribute("data-theme");
      if (t === "dark" || t === "light") return t;
      if (el.classList && (el.classList.contains("dark") || el.classList.contains("dark-theme"))) return "dark";
      el = el.parentNode;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  Orb.prototype.applyTheme = function () {
    var c = COLORS[this.theme];
    this.col = c;
  };

  Orb.prototype.attachThemeListener = function () {
    if (this.themeName !== "auto") return;
    var orb = this;
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    this.mediaQuery = mq;
    var onChange = function () {
      if (mq.matches !== (orb.theme === "dark")) {
        orb.theme = orb.resolveTheme();
        orb.applyTheme();
      }
    };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
    this._themeCleanup = function () {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else if (mq.removeListener) mq.removeListener(onChange);
    };
  };

  Orb.prototype.setState = function (stateName) {
    var base = STATES[stateName] || STATES.working;
    var k = this.size / 64;
    var dotK = this.size <= 20 ? 0.9 : 1;
    for (var i = 0; i < PARAMS.length; i++) {
      var p = PARAMS[i];
      var v = base[p];
      if (p === "radius" || p === "jitter" || p === "dot") v = v * k * (p === "dot" ? dotK : 1);
      this.target[p] = v;
    }
    this.stateName = stateName;
    this.targetSet = true;
  };

  Orb.prototype.smooth = function (dt) {
    if (!this.targetSet) return;
    var ease = 1 - Math.exp(-dt / 300);
    for (var i = 0; i < PARAMS.length; i++) {
      var p = PARAMS[i];
      this.current[p] += (this.target[p] - this.current[p]) * ease;
    }
  };

  Orb.prototype.drawStatic = function () {
    this.draw();
  };

  Orb.prototype.draw = function () {
    var ctx = this.ctx;
    var size = this.size;
    var cx = size / 2;
    var cy = size / 2;
    ctx.clearRect(0, 0, size, size);

    var cur = this.current;
    var count = Math.max(1, Math.round(cur.count));
    var t = this.t;
    var col = this.col;

    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
    g.addColorStop(0, col.core);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    for (var i = 0; i < count; i++) {
      var ringAngle = (i / count) * Math.PI * 2;
      var orbit = t * cur.speed + ringAngle + Math.sin(t * 0.4 + i) * (cur.jitter / 30);
      var radial = cur.radius * (0.55 + 0.45 * Math.sin(cur.wave * t * 0.9 + i * 1.7));
      var x = cx + Math.cos(orbit) * radial;
      var y = cy + Math.sin(orbit) * radial * 0.92;
      var dotSize = cur.dot * (0.72 + 0.28 * Math.sin(t * 2.1 + i * 2.3));
      var alpha = cur.alpha * (0.6 + 0.4 * Math.sin(t * 1.8 + i * 1.1));
      var two = i % 2 === 0;
      var c = two ? col.a : col.b;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, y, dotSize * 2.4, 0, Math.PI * 2);
      ctx.globalAlpha = alpha * 0.12;
      ctx.fill();

      ctx.globalAlpha = alpha;
      ctx.fillStyle = two ? col.a : col.b;
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  };

  Orb.prototype.destroy = function () {
    this.destroyed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this._themeCleanup) this._themeCleanup();
  };

  function init() {
    var canvases = document.querySelectorAll("canvas[data-orb]");
    Array.prototype.forEach.call(canvases, function (cv) {
      if (cv._orb) return;
      new Orb(cv, {
        state: cv.getAttribute("data-state") || "working",
        size: cv.getAttribute("data-size") || 64,
        theme: cv.getAttribute("data-theme") || "auto",
      });
    });
  }

  function setOrb(el, state) {
    if (!el) return;
    el = el.tagName === "CANVAS" ? el : el.querySelector("canvas[data-orb]");
    if (el && el._orb) el._orb.setState(state);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.ThinkingOrb = { Orb: Orb, init: init, setState: setOrb };
})();