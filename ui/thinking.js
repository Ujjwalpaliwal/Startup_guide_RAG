(function () {
  var DEFAULT_STREAM = [
    "Okay, first I need to locate the relevant sections inside the Startup India corpus.",
    "Parsing the question to extract the entities that matter - startup, DPIIT, tax exemption.",
    "Scanning the index for the five issued documents: the Startup India Kits, the Law & Policy Guidebook, the Registration Guide, and the Go-to-Market Guide.",
    "Ranking candidate chunks by keyword overlap with the question.",
    "Confidence rising: the phrase `DPIIT recognised startups` appears in the Kit's benefits section.",
    "Cross-checking the tax exemption claims against the Law & Policy Guidebook, page 74.",
    "Dropping lower-ranked chunks that mention the terms only in passing.",
    "Assembling the answer from the two strongest passages and attaching their references.",
    "Verifying each citation still maps to a real source file and page number.",
    "Answer ready. Sharing the summary along with the source references below.",
  ].join("\n\n");

  function spinnerSvg() {
    return (
      '<svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" role="status" aria-label="Loading">' +
      '<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>' +
      '<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>' +
      "</svg>"
    );
  }

  function ThinkingBlock(text) {
    this.stream = text || DEFAULT_STREAM;

    this.el = document.createElement("div");
    this.el.className = "think-msg";

    var head = document.createElement("div");
    head.className = "think-head";

    var spin = document.createElement("span");
    spin.className = "think-spin";
    spin.innerHTML = spinnerSvg();

    var label = document.createElement("span");
    label.className = "think-shimmer";
    label.textContent = "Saarthi is thinking";

    this.timerEl = document.createElement("span");
    this.timerEl.className = "think-timer";
    this.timerEl.textContent = "0s";

    head.appendChild(spin);
    head.appendChild(label);
    head.appendChild(this.timerEl);
    this.el.appendChild(head);

    var card = document.createElement("div");
    card.className = "think-card";
    var fadeTop = document.createElement("div");
    fadeTop.className = "think-fade think-fade-top";
    var fadeBot = document.createElement("div");
    fadeBot.className = "think-fade think-fade-bot";
    this.streamEl = document.createElement("div");
    this.streamEl.className = "think-stream";
    var p = document.createElement("p");
    p.textContent = this.stream;
    this.streamEl.appendChild(p);

    card.appendChild(fadeTop);
    card.appendChild(fadeBot);
    card.appendChild(this.streamEl);
    this.el.appendChild(card);

    this.start();
    return this;
  }

  ThinkingBlock.prototype.start = function () {
    var block = this;
    this.seconds = 0;
    this.timerIv = setInterval(function () {
      block.seconds += 1;
      block.timerEl.textContent = block.seconds + "s";
    }, 1000);

    this.scrollIv = setInterval(function () {
      if (!block.streamEl) return;
      var max = block.streamEl.scrollHeight - block.streamEl.clientHeight;
      if (max <= 0) return;
      var next = block.streamEl.scrollTop + 1;
      block.streamEl.scrollTop = next >= max ? 0 : next;
    }, 8);
  };

  ThinkingBlock.prototype.destroy = function () {
    if (this.timerIv) clearInterval(this.timerIv);
    if (this.scrollIv) clearInterval(this.scrollIv);
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
  };

  window.ThinkingBlock = ThinkingBlock;
})();