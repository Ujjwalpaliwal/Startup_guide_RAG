(function () {
  var navToggle = document.querySelector(".nav-toggle");
  var navLinks = document.querySelector(".nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      navLinks.classList.toggle("open");
    });
  }

  var prefill = sessionStorage.getItem("prefill");
  if (prefill) {
    sessionStorage.removeItem("prefill");
  }

  document.querySelectorAll("[data-chat-page]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var q = a.getAttribute("data-chat-page");
      sessionStorage.setItem("prefill", q);
      window.location.href = "assistant.html";
    });
  });

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  var chatBody = document.getElementById("chat-body");
  var orbAvatar = document.getElementById("orb-avatar");

  if (chatBody && window.AnswerEngine) {
    /* ---------- chat wiring ---------- */

    var chatForm = document.getElementById("chat-form");
    var chatInput = document.getElementById("chat-input");
    var statusPill = document.getElementById("status-pill");
    var statusLabel = document.getElementById("status-label");
    var composeStatus = document.getElementById("compose-status");
    var composeLabel = document.getElementById("compose-label");
    var sourcesCountEl = document.getElementById("sources-count");
    var drawer = document.getElementById("sources-drawer");
    var overlay = document.getElementById("drawer-overlay");
    var toggleBtn = document.getElementById("sources-toggle");
    var closeBtn = document.getElementById("drawer-close");
    var doneBtn = document.getElementById("drawer-done");
    var drawerCount = document.getElementById("drawer-count");
    var toggles = document.querySelectorAll(".src-toggle");

    var allKeys = AnswerEngine.ORIGINALS;
    var active = {};
    allKeys.forEach(function (k) { active[k] = true; });
    var busy = false;

    function scrollChat() {
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    function ensureOrbs() {
      if (window.ThinkingOrb) ThinkingOrb.init();
    }

    function setStatus(stateName, line) {
      if (statusPill) statusPill.classList.add("busy");
      if (statusLabel) statusLabel.textContent = line;
      if (composeStatus) composeStatus.classList.add("busy");
      if (composeLabel) composeLabel.textContent = line;
      if (orbAvatar && window.ThinkingOrb) ThinkingOrb.setState(orbAvatar, stateName);
    }

    function setIdle(line) {
      if (statusPill) statusPill.classList.remove("busy");
      if (statusLabel) statusLabel.textContent = line;
      if (composeStatus) composeStatus.classList.remove("busy");
      if (composeLabel) composeLabel.textContent = line;
      if (orbAvatar && window.ThinkingOrb) ThinkingOrb.setState(orbAvatar, "working");
    }

    function updateSourcesUI() {
      var count = 0;
      allKeys.forEach(function (k) { if (active[k]) count++; });
      if (sourcesCountEl) {
        sourcesCountEl.textContent = count === allKeys.length
          ? "All " + count + " sources active"
          : count + " of " + allKeys.length + " sources active";
      }
      if (drawerCount) drawerCount.textContent = count + " / " + allKeys.length;
    }

    function activeKeys() {
      return allKeys.filter(function (k) { return active[k]; });
    }

    function avatarOrb(state) {
      var c = document.createElement("canvas");
      c.setAttribute("data-orb", "");
      c.setAttribute("data-state", state || "working");
      c.setAttribute("data-size", "20");
      c.setAttribute("data-theme", "auto");
      return c;
    }

    function citesHtml(cites) {
      if (!cites || !cites.length) return "";
      return (
        '<div class="citations">' +
        cites.map(function (c) {
          return '<span class="cite"><b>REF</b>' + escapeHtml(c) + "</span>";
        }).join("") +
        "</div>"
      );
    }

    function addUserMsg(text) {
      var msg = document.createElement("div");
      msg.className = "msg user";
      msg.innerHTML =
        '<span class="m-avatar">Y</span>' +
        '<div class="m-bubble"><p>' + escapeHtml(text) + "</p></div>";
      chatBody.appendChild(msg);
      scrollChat();
    }

    function addThinking() {
      var wrap = document.createElement("div");
      wrap.className = "msg assistant";
      var av = document.createElement("span");
      av.className = "m-avatar orb-av";
      av.appendChild(avatarOrb("searching"));
      var col = document.createElement("div");
      col.style.cssText = "flex:1;min-width:0;";
      var tb = window.ThinkingBlock ? new window.ThinkingBlock() : null;
      if (tb) col.appendChild(tb.el);
      else col.innerHTML = '<div class="m-bubble typing"><span></span><span></span><span></span></div>';
      wrap.appendChild(av);
      wrap.appendChild(col);
      chatBody.appendChild(wrap);
      ensureOrbs();
      scrollChat();
      return { wrap: wrap, block: tb };
    }

    function addAnswer(res) {
      var wrap = document.createElement("div");
      wrap.className = "msg assistant";
      var av = document.createElement("span");
      av.className = "m-avatar orb-av";
      av.appendChild(avatarOrb("working"));
      var bubble = document.createElement("div");
      bubble.className = "m-bubble";
      bubble.innerHTML = (res.html || "<p></p>") + citesHtml(res.cites);
      wrap.appendChild(av);
      wrap.appendChild(bubble);
      chatBody.appendChild(wrap);
      ensureOrbs();
      scrollChat();
      if (window.ThinkingOrb) {
        ThinkingOrb.setState(av.querySelector("canvas"), "working");
      }
    }

    function answerFlow(raw) {
      var q = (raw || "").trim();
      if (!q || busy) return;
      busy = true;
      if (chatInput) chatInput.value = "";
      addUserMsg(q);
      setStatus("listening", "Listening…");
      var thinking = addThinking();

      setTimeout(function () {
        setStatus("searching", "Searching the guides…");
        var res = AnswerEngine.answer(q, activeKeys());
        setTimeout(function () {
          setStatus("solving", "Verifying sources…");
          if (thinking.wrap && thinking.wrap.parentNode) {
            thinking.wrap.parentNode.removeChild(thinking.wrap);
          }
          if (thinking.block) thinking.block.destroy();
          addAnswer(res);
          setStatus("composing", "Composing answer");
          setTimeout(function () {
            busy = false;
            setIdle("Ready");
          }, 420);
        }, 650);
      }, 1000);
    }

    if (chatForm && chatInput) {
      chatForm.addEventListener("submit", function (e) {
        e.preventDefault();
        answerFlow(chatInput.value);
      });

      chatInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          chatForm.dispatchEvent(new Event("submit"));
        }
      });

      chatInput.addEventListener("input", function () {
        chatInput.style.height = "auto";
        chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + "px";
      });
    }

    function openDrawer() {
      drawer.classList.add("open");
      drawer.setAttribute("aria-hidden", "false");
      overlay.classList.add("open");
    }

    function closeDrawer() {
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
      overlay.classList.remove("open");
    }

    if (toggleBtn) toggleBtn.addEventListener("click", openDrawer);
    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
    if (doneBtn) doneBtn.addEventListener("click", closeDrawer);
    if (overlay) overlay.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
    });

    toggles.forEach(function (t) {
      t.addEventListener("change", function () {
        active[t.value] = t.checked;
        updateSourcesUI();
      });
    });

    document.querySelectorAll("[data-ask]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        answerFlow(chip.getAttribute("data-ask"));
      });
    });

    updateSourcesUI();

    if (prefill) {
      setTimeout(function () { answerFlow(prefill); }, 350);
    } else if (window.location.search) {
      var sp = new URLSearchParams(window.location.search);
      if (sp.get("q")) {
        setTimeout(function () { answerFlow(sp.get("q")); }, 350);
      }
    }

    ensureOrbs();
  } else {
    document.querySelectorAll("[data-ask]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var q = chip.getAttribute("data-ask");
        window.location.href = "assistant.html?q=" + encodeURIComponent(q);
      });
    });

    /* ---------- explore page ---------- */

    var docList = document.getElementById("doc-list");
    var docInput = document.getElementById("doc-search");
    var docFilters = document.querySelectorAll("[data-filter]");

    function applyFilters() {
      if (!docList) return;
      var q = (docInput && docInput.value.toLowerCase()) || "";
      var activeFilter = document.querySelector("[data-filter].active");
      var cat = activeFilter ? activeFilter.getAttribute("data-filter") : "all";
      document.querySelectorAll(".doc-card").forEach(function (card) {
        var hay = card.getAttribute("data-search").toLowerCase();
        var cats = card.getAttribute("data-cats").split(" ");
        var ok = q ? hay.indexOf(q) !== -1 : true;
        if (ok && cat !== "all" && cats.indexOf(cat) === -1) ok = false;
        card.style.display = ok ? "" : "none";
      });
    }

    if (docInput) {
      docInput.addEventListener("input", function () {
        var m = docInput.value.trim();
        if (m) {
          var terms = m.toLowerCase().split(/\s+/).filter(Boolean);
          document.querySelectorAll(".doc-card").forEach(function (card) {
            var hay = card.getAttribute("data-search").toLowerCase();
            var ok = terms.every(function (t) { return hay.indexOf(t) !== -1; });
            card.style.display = ok ? "" : "none";
          });
        } else {
          applyFilters();
        }
      });
    }

    if (docFilters.length) {
      docFilters.forEach(function (chip) {
        chip.addEventListener("click", function () {
          docFilters.forEach(function (c) { c.classList.remove("active"); });
          chip.classList.add("active");
          applyFilters();
        });
      });
    }
  }
})();