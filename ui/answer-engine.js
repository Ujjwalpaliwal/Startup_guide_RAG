(function () {
  var STOP = {
    what: 1, is: 1, are: 1, "the": 1, "to": 1, "for": 1, "of": 1, "in": 1, "on": 1, "a": 1, "an": 1,
    and: 1, "or": 1, "my": 1, "me": 1, "i": 1, "do": 1, "does": 1, "how": 1, "can": 1, "i"  : 1,
    "with": 1, "as": 1, "by": 1, "get": 1, "it": 1, "its": 1, "about": 1, "under": 1, "at": 1,
    "from": 1, "you": 1, "your": 1, "startup": 1, "startups": 1, "india": 1, "indian": 1,
  };

  var FAQ = [
    {
      id: "what-is-a-startup",
      label: "What counts as a Startup?",
      trigger: ["what is a startup", "definition of startup", "startup definition", "who can be", "definition", "eligible"],
      answer: [
        "An entity is treated as a Startup under the Startup India initiative if it is incorporated as a private limited company (Companies Act, 2013), a registered partnership firm (Partnership Act, 1932), or a limited liability partnership (LLP Act, 2008) in India, and meets the DPIIT recognition conditions on innovation and the notified age and turnover limits.",
      ],
      cites: ["Startup India Kit (Mar 2020) - p.14", "Startup India Kit (v5) - p.11", "Startup Law & Policy Guidebook - p.72"],
    },
    {
      id: "register",
      label: "How do I register / get DPIIT recognition?",
      trigger: ["register", "registration", "startup india portal", "dpiit recognition", "recognition", "certificate of incorporation", "apply for"],
      answer: [
        "First incorporate your entity as a private limited company, registered partnership, or LLP. Then sign up on the Startup India portal (www.startupindia.gov.in) and complete the recognition application with your incorporation details. The Inter-Ministerial Board validates the innovative nature of your business; once recognised you unlock tax, funding, procurement, and IPR benefits.",
      ],
      cites: ["Startup Registration Guide - p.4", "Go-to-Market Guide for India - p.5"],
    },
    {
      id: "tax",
      label: "What tax exemptions apply to startups?",
      trigger: ["80-iac", "income tax exemption", "tax exempt", "tax exemption", "tax benefits", "tax benefit"],
      answer: [
        "DPIIT-recognised startups incorporated on or after 1 April 2016 can claim income-tax exemption under Section 80-IAC for 3 out of the first 10 years, capital-gains exemption under Section 54GB, deferment of tax on ESOPs (Sections 156, 191 and 192), and carry-forward and set-off of losses under Section 79.",
      ],
      cites: ["Go-to-Market Guide for India - p.15", "Startup Law & Policy Guidebook - p.74"],
    },
    {
      id: "tax-general",
      label: "What tax exemptions apply to startups?",
      trigger: ["tax", "exemption"],
      answer: [
        "DPIIT-recognised startups can access several tax benefits: income-tax exemption under Section 80-IAC (3 of 10 years), capital-gains relief under Section 54GB, deferment of tax on ESOPs under Sections 156/191/192, and loss carry-forward under Section 79. Recognised startups incorporated on or after 1 April 2016 qualify for the income-tax exemption.",
      ],
      cites: ["Go-to-Market Guide for India - p.15", "Startup Law & Policy Guidebook - p.74"],
    },
    {
      id: "esop",
      label: "How is tax on ESOPs handled?",
      trigger: ["esop", "employee stock", "stock option"],
      answer: [
        "DPIIT-recognised startups get deferment of tax liability on ESOPs under Sections 156, 191 and 192 of the Income-tax Act, so employees do not pay tax on the stock options at the moment of exercise - it is deferred to a later, more liquid event.",
      ],
      cites: ["Go-to-Market Guide for India - p.5", "Startup Law & Policy Guidebook - p.74"],
    },
    {
      id: "funding",
      label: "What funding schemes are available?",
      trigger: ["funding", "funds", "seed fund", "fund of funds", "raise money", "raised", "investor", "investment", "credit guarantee"],
      answer: [
        "The guides cover equity and debt support for startups at different stages: the Fund of Funds for Startups (FFS) holds a corpus to back equity funding, the Startup India Seed Fund Scheme (SISFS) supports early-stage validation and incubation, and the Credit Guarantee Scheme for Startups (CGSS) encourages lenders to extend debt to eligible startups.",
      ],
      cites: ["Go-to-Market Guide for India - p.20", "Go-to-Market Guide for India - p.22"],
    },
    {
      id: "seed",
      label: "Tell me about the Seed Fund Scheme (SISFS).",
      trigger: ["sisfs", "seed fund scheme", "seed funding", "seed grant"],
      answer: [
        "The Startup India Seed Fund Scheme (SISFS) is run by DPIIT (Ministry of Commerce and Industry) to provide early-stage funding to startups for proof of concept, prototype development, product trials, market entry, and commercialisation efforts. Applications are routed through the Startup India ecosystem.",
      ],
      cites: ["Go-to-Market Guide for India - p.22"],
    },
    {
      id: "ipr",
      label: "How does IPR / patent support work?",
      trigger: ["ipr", "patent", "trademark", "intellectual property", "ip protection"],
      answer: [
        "Patent applications of startups are fast-tracked for examination and disposal, with facilitators guiding the filing process - and the route is significantly faster for DPIIT-recognised startups. The Startup India ecosystem also connects startups to IPR facilitation and where to file.",
      ],
      cites: ["Go-to-Market Guide for India - p.8"],
    },
    {
      id: "fast-exit",
      label: "Can a startup be wound up faster?",
      trigger: ["fast exit", "faster exit", "wind up", "wound up", "wound", "close the", "closure", "shut", "shut down", "insolven", "exit"],
      answer: [
        "Yes. Startups are notified as fast-track firms, which means they can wind up operations within around 90 days compared with roughly 180 days for other companies.",
      ],
      cites: ["Go-to-Market Guide for India - p.14"],
    },
    {
      id: "procurement",
      label: "Do startups get public procurement benefits?",
      trigger: ["procurement", "tender", "government contract", "bid", "psu", "public"],
      answer: [
        "The government has authorised its ministries, departments, and PSUs to relax norms in all public procurements for startups. DPIIT-recognised startups can also become preferred bidders on CPPP portals, which host over 2,00,000 tenders every year.",
      ],
      cites: ["Go-to-Market Guide for India - p.10", "Go-to-Market Guide for India - p.11"],
    },
    {
      id: "cost",
      label: "How much does registration cost?",
      trigger: ["how much", "cost", "fees", "fee", "price", "professional fee"],
      answer: [
        "Registration costs depend on the entity type. For a partnership firm the government fee is roughly Rs. 500-2,000 plus professional fees of Rs. 2,000-5,000 (total about Rs. 2,500-7,000). A sole proprietorship works out to around Rs. 2,000-5,000 in total. Fees vary, so treat these as ranges.",
      ],
      cites: ["Startup Registration Guide - p.10"],
    },
    {
      id: "funding-cycle",
      label: "What is the startup funding cycle?",
      trigger: ["funding cycle", "stages of funding", "growth capital", "angel", "venture"],
      answer: [
        "The Kit walks through the startup funding cycle from self-funding and friends & family, through angel and seed rounds, to venture and growth capital - and shows where government schemes like SISFS and the Fund of Funds support each stage.",
      ],
      cites: ["Go-to-Market Guide for India - p.51"],
    },
    {
      id: "investors",
      label: "Where do startups find funding / investors?",
      trigger: ["investor", "investors", "angel", "venture capitalist", "capital sourcing", "raise capital", "who can fund"],
      answer: [
        "Capital for startups typically comes from equity funding by venture capitalists and angel investors, and the Kit maps it across the funding cycle: pre-seed comes from family, friends, grants, plan competitions, and collateral-free debt; seed and growth stages follow as your product and revenue mature.",
      ],
      cites: ["Startup Law & Policy Guidebook - p.11", "Go-to-Market Guide for India - p.52"],
    },
  ];

  var SUGGEST = [
    "How do I register my startup under Startup India?",
    "What tax exemptions are available?",
    "How does DPIIT recognition work?",
    "What is the Startup India Seed Fund Scheme?",
    "How do I get patent protection?",
    "Can I wind up my startup faster?",
  ];

  var ORIGINALS = ["regi", "kv5", "k2020", "gotomarket", "law"];

  function normalizeTokens(q) {
    return q
      .toLowerCase()
      .replace(/[^\w\s]|_/g, " ")
      .split(/\s+/)
      .filter(function (t) {
        return t.length > 2 && !STOP[t];
      });
  }

  function strip(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function faqResult(q, tokens) {
    var ql = q.toLowerCase();
    var best = null;
    var bestScore = 0;
    for (var i = 0; i < FAQ.length; i++) {
      var f = FAQ[i];
      var score = 0;
      for (var j = 0; j < f.trigger.length; j++) {
        var tr = f.trigger[j];
        if (ql.indexOf(tr) !== -1) {
          score += tr.indexOf(" ") !== -1 ? 1.6 : 0.7;
        }
      }
      for (var k = 0; k < tokens.length; k++) {
        for (var m = 0; m < f.trigger.length; m++) {
          if (f.trigger[m].indexOf(tokens[k]) !== -1) {
            score += 0.3;
            break;
          }
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = f;
      }
    }
    if (best && bestScore >= 1.0) return best;
    return null;
  }

  function chunkKey(chunk) {
    return chunk.key || "other";
  }

  function retrieval(q, tokens, active) {
    var idx = window.CHUNK_INDEX || [];
    var phrase = q.toLowerCase().trim();
    var scored = [];
    var n = Math.max(1, tokens.length);
    for (var i = 0; i < idx.length; i++) {
      var c = idx[i];
      if (active && active.length && active.indexOf(chunkKey(c)) === -1) continue;
      var t = c.text.toLowerCase();
      var matched = 0;
      for (var j = 0; j < tokens.length; j++) {
        if (t.indexOf(tokens[j]) !== -1) matched++;
      }
      var s = matched / Math.sqrt(n);
      if (phrase.length > 3 && t.indexOf(phrase) !== -1) s += 2.5;
      if (s > 0) scored.push({ score: s, chunk: c });
    }
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored;
  }

  function cleanChunkText(text) {
    var t = String(text);
    t = t.replace(/[\u00a0\u202f]/g, " ");
    t = t.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\uFFFD]/g, "");
    t = t.replace(/\s+/g, " ");
    t = t.replace(/^\s*(?:\d{1,3}\s+)?(?:Startup India Kit\s*)?/i, "");
    t = t.replace(/^INDIA STARTUP LAW & POLICY GUIDEBOOK\s*20\d\d\s*/i, "");
    t = t.replace(/^STARTUP INDIA KIT\s*/i, "");
    return t.trim();
  }

  function excerpt(text, max) {
    max = max || 330;
    var clean = cleanChunkText(text);
    if (clean.length <= max + 20) return clean;
    var cut = clean.slice(0, max);
    var last = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
    if (last > max * 0.5) return cut.slice(0, last + 1).trim() + " …";
    var sp = cut.lastIndexOf(" ");
    return cut.slice(0, sp > 0 ? sp : max).trim() + " …";
  }

  function citeKey(chunk) {
    return displayName(chunk.source) + " - p." + chunk.page;
  }

  function citesFor(chunks) {
    var seen = {};
    var out = [];
    for (var i = 0; i < chunks.length; i++) {
      var label = citeKey(chunks[i]);
      if (!seen[label]) {
        seen[label] = true;
        out.push(label);
      }
    }
    return out;
  }

  function displayName(source) {
    var s = source.toLowerCase();
    if (s.indexOf("registration") !== -1) return "Startup Registration Guide";
    if (s.indexOf("law & policy") !== -1) return "Startup Law & Policy Guidebook";
    if (s.indexOf("gotomarket") !== -1) return "Go-to-Market Guide for India";
    if (s.indexOf("kit_v5") !== -1) return "Startup India Kit (v5)";
    if (s.indexOf("kit_march") !== -1) return "Startup India Kit (Mar 2020)";
    return "Startup India Kit";
  }

  function citesFor(chunks) {
    var seen = {};
    var out = [];
    for (var i = 0; i < chunks.length; i++) {
      var label = displayName(chunks[i].source) + " - p." + chunks[i].page;
      if (!seen[label]) {
        seen[label] = true;
        out.push(label);
      }
    }
    return out;
  }

  function fallbackHtml() {
    var items = SUGGEST.map(function (s) {
      return "<li>" + strip(s) + "</li>";
    }).join("");
    return (
      "<p>I checked the guides but could not match that to a specific section. I can help with:</p>" +
      "<ul>" + items + "</ul>" +
      "<p>Or try rephrasing with a keyword such as registration, tax, funding, IPR, or exit.</p>"
    );
  }

  function answer(q, active) {
    var tokens = normalizeTokens(q || "");
    var faq = faqResult(q, tokens);
    if (faq) {
      return {
        html: faq.answer.map(function (p) {
          return "<p>" + strip(p) + "</p>";
        }).join(""),
        cites: faq.cites.slice(),
        kind: "faq",
        label: faq.label,
      };
    }

    var scored = retrieval(q, tokens, active);
    if (scored.length >= 1 && scored[0].score >= 0.6) {
      var top = [scored[0].chunk];
      var html =
        "<p>Here's what the Startup India guides say:</p>" +
        '<blockquote class="excerpt"><p>' + strip(excerpt(scored[0].chunk.text)) + "</p></blockquote>";
      for (var i = 1; i < scored.length && top.length < 2; i++) {
        if (scored[i].score < 0.35) break;
        var lbl = citeKey(scored[i].chunk);
        var dup = top.some(function (c) { return citeKey(c) === lbl; });
        if (dup) continue;
        top.push(scored[i].chunk);
        html += '<blockquote class="excerpt excerpt-sub"><p>' + strip(excerpt(scored[i].chunk.text)) + "</p></blockquote>";
      }
      return {
        html: html,
        cites: citesFor(top),
        kind: "retrieval",
        label: "From the guides",
      };
    }

    return {
      html: fallbackHtml(),
      cites: [],
      kind: "fallback",
      label: "Could not pin it down",
    };
  }

  window.AnswerEngine = {
    FAQ: FAQ,
    SUGGEST: SUGGEST,
    ORIGINALS: ORIGINALS,
    answer: answer,
    displayName: displayName,
  };
})();