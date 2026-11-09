/* Agendaí — camada de movimento (script clássico, sem dependências).
   Reveal ao rolar, parallax, scrub (linha/faixa), header inteligente e barra de progresso.
   Carrega separado dos módulos do Supabase: se a API falhar, a animação continua funcionando. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.__motion = true;
  root.classList.add("js");

  /* ---------- 1. Reveal ---------- */
  var AUTO = [
    ".page-main > *", ".legal > *", ".auth-panel > *", ".auth-shell > .wordmark",
    "#business-detail > *", ".business-card", ".service-row", ".appointment-row",
    ".service-choice", ".hours-day", ".form-grid > *", ".booking-panel", ".split > *",
    ".site-footer"
  ].join(",");

  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }) : null;

  function watch(el) {
    if (el.__watched) return;
    el.__watched = true;
    if (!io || reduce) { el.classList.add("in"); return; }
    io.observe(el);
  }

  function tag(el) {
    if (el.hasAttribute("data-reveal") || el.__watched) return;
    var i = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.setAttribute("data-reveal", "");
    el.style.setProperty("--d", Math.min(i, 6) * 70 + "ms");
    watch(el);
  }

  function scan(node) {
    if (node.nodeType !== 1) return;
    if (node.matches && node.matches(AUTO)) tag(node);
    if (node.querySelectorAll) node.querySelectorAll(AUTO).forEach(tag);
    if (node.hasAttribute && node.hasAttribute("data-reveal")) watch(node);
    if (node.querySelectorAll) node.querySelectorAll("[data-reveal]").forEach(watch);
  }

  // [data-stagger] no pai: atrasa filhos em cascata
  function stagger(scope) {
    (scope.querySelectorAll ? scope.querySelectorAll("[data-stagger]") : []).forEach(function (p) {
      var step = Number(p.getAttribute("data-stagger")) || 90;
      Array.prototype.forEach.call(p.children, function (c, i) {
        if (!c.style.getPropertyValue("--d")) c.style.setProperty("--d", Math.min(i, 8) * step + "ms");
      });
    });
  }

  stagger(document);
  scan(document.body);

  // Conteúdo criado depois pelo JS (cards do Supabase, listas, formulários)
  if ("MutationObserver" in window) {
    new MutationObserver(function (muts) {
      muts.forEach(function (m) { m.addedNodes.forEach(function (n) { stagger(n); scan(n); }); });
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- 2. Scroll: progresso, header, parallax, scrub ---------- */
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  var header = document.querySelector(".site-header");
  var parallax = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var scrubs = Array.prototype.slice.call(document.querySelectorAll("[data-scrub]"));
  var hero = document.querySelector("[data-hero-scroll]");
  var horizontalSection = document.querySelector(".horizontal-scroll-section");
  var horizontalTrack = document.querySelector(".horizontal-track");
  var horizontalProgress = document.querySelector(".horizontal-progress span");
  var horizontalCards = horizontalTrack ? Array.prototype.slice.call(horizontalTrack.querySelectorAll(".feature-card")) : [];
  var chapterLabel = document.querySelector(".scroll-chapter strong");
  var chapterSections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  var previousScrollY = window.scrollY;
  var scrollVelocity = 0;
  var wordStory = document.querySelector("[data-scroll-words]");
  var storyWords = wordStory ? Array.prototype.slice.call(wordStory.querySelectorAll("span")) : [];
  var dots = Array.prototype.slice.call(document.querySelectorAll(".scroll-dots a"));
  var topButton = document.querySelector(".back-to-top");
  var lastY = window.scrollY, ticking = false;

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function frame() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    bar.style.transform = "scaleX(" + (max > 0 ? clamp(y / max) : 0) + ")";

    if (header) {
      var focusInside = header.contains(document.activeElement);
      if (y > 140 && y > lastY + 4 && !focusInside) header.classList.add("is-hidden");
      else if (y < lastY - 4 || y <= 140) header.classList.remove("is-hidden");
    }
    // Scroll velocity: subtle inertial effect, clamped to avoid harsh motion.
    scrollVelocity = (y - previousScrollY) * 0.72 + scrollVelocity * 0.28;
    previousScrollY = y;
    root.style.setProperty("--scroll-velocity", Math.max(-18, Math.min(18, scrollVelocity)).toFixed(1) + "px");
    root.style.setProperty("--scroll-direction", y >= lastY ? "1" : "-1");
    root.style.setProperty("--scroll-skew", (Math.max(-18, Math.min(18, scrollVelocity)) * 0.12).toFixed(2) + "deg");

    lastY = y;

    // Hero: dissolve/scale gently as the user leaves the first screen.
    if (hero && !reduce) {
      var heroRect = hero.getBoundingClientRect();
      var heroRange = Math.max(1, heroRect.height * 0.72);
      var heroP = clamp(Math.max(0, -heroRect.top) / heroRange);
      hero.style.setProperty("--hero-progress", heroP.toFixed(3));
      hero.style.opacity = String(1 - heroP * 0.42);
      hero.style.transform = "scale(" + (1 - heroP * 0.035).toFixed(3) + ")";
    }

    // Sticky horizontal card rail driven by vertical scroll (desktop).
    if (horizontalSection && horizontalTrack && window.innerWidth > 760 && !reduce) {
      var hs = horizontalSection.getBoundingClientRect();
      var total = Math.max(1, horizontalSection.offsetHeight - vh);
      var hp = clamp(-hs.top / total);
      var maxTravel = Math.max(0, horizontalTrack.scrollWidth - window.innerWidth + 48);
      horizontalTrack.style.setProperty("--horizontal-x", (-maxTravel * hp).toFixed(1) + "px");
      if (horizontalProgress) horizontalProgress.style.transform = "scaleX(" + hp.toFixed(3) + ")";
      // Cards subtly rotate/float according to their position in the moving rail.
      horizontalCards.forEach(function (card, index) {
        var cardP = clamp((index / Math.max(1, horizontalCards.length - 1)) - hp);
        var tilt = (cardP - 0.5) * 2.4;
        card.style.setProperty("--card-tilt", tilt.toFixed(2) + "deg");
        card.style.setProperty("--card-float", (Math.sin((hp + index * 0.22) * Math.PI) * 7).toFixed(1) + "px");
      });
    } else if (horizontalTrack && window.innerWidth <= 760) {
      horizontalTrack.style.removeProperty("--horizontal-x");
    }

    // Word-by-word highlight based on how far the story is in the viewport.
    if (wordStory && storyWords.length && !reduce) {
      var wr = wordStory.getBoundingClientRect();
      var wp = clamp((vh * 0.78 - wr.top) / Math.max(1, wr.height + vh * 0.35));
      storyWords.forEach(function (word, i) {
        word.classList.toggle("is-lit", wp >= (i + 0.15) / storyWords.length);
      });
    }

    if (topButton) topButton.classList.toggle("visible", y > 650);
    if (chapterLabel && chapterSections.length) {
      var activeChapter = chapterSections[0];
      chapterSections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= vh * 0.42) activeChapter = section;
      });
      chapterLabel.textContent = activeChapter.getAttribute("data-chapter") || activeChapter.querySelector("h1,h2")?.textContent.trim().replace(/\s+/g, " ").slice(0, 36) || "Agendaí";
    }
    if (reduce) return;

    parallax.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var speed = parseFloat(el.getAttribute("data-parallax")) || 0.1;
      var off = (r.top + r.height / 2 - vh / 2) * speed * -1;
      el.style.transform = "translate3d(0," + off.toFixed(1) + "px,0)";
    });

    scrubs.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var mode = el.getAttribute("data-scrub");
      var p = mode === "draw"
        ? clamp((vh * 0.7 - r.top) / r.height)          // linha desenha conforme o bloco passa
        : clamp((vh - r.top) / (vh + r.height));          // progresso geral na tela
      el.style.setProperty("--p", p.toFixed(3));
    });
  }

  if (topButton) topButton.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });

  // Dots reflect the section currently nearest the center of the viewport.
  if (dots.length && "IntersectionObserver" in window) {
    var dotTargets = dots.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
    var dotObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        dots.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id); });
      });
    }, { rootMargin: "-42% 0px -42% 0px", threshold: 0 });
    dotTargets.forEach(function (target) { dotObserver.observe(target); });
  }

  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  frame();

  /* ---------- 2.5. Sequência cinematográfica + cursor ---------- */
  var cinematic = document.querySelector("[data-cinematic]");
  var cinematicCopy = cinematic && cinematic.querySelector(".cinematic-copy");
  var cinematicCard = cinematic && cinematic.querySelector(".cinematic-appointment");
  var cinematicBackdrop = cinematic && cinematic.querySelector(".cinematic-backdrop");
  if (cinematic && !reduce) {
    // progressão com scroll: cenário aproxima, texto recua e reserva surge
    var updateCinema = function () {
      var rect = cinematic.getBoundingClientRect();
      var range = Math.max(1, cinematic.offsetHeight - window.innerHeight);
      var p = clamp(-rect.top / range);
      cinematic.style.setProperty("--cinema-progress", p.toFixed(3));
      if (cinematicBackdrop) cinematicBackdrop.style.setProperty("--cinema-scale", (1 + p * .22).toFixed(3));
      if (cinematicCopy) {
        cinematicCopy.style.setProperty("--cinema-copy-x", (-p * 90).toFixed(1) + "px");
        cinematicCopy.style.setProperty("--cinema-copy-opacity", (1 - clamp((p - .32) / .48)).toFixed(3));
      }
      if (cinematicCard) {
        var reveal = clamp((p - .12) / .55);
        cinematicCard.style.setProperty("--cinema-card-opacity", reveal.toFixed(3));
        cinematicCard.style.setProperty("--cinema-card-scale", (.72 + reveal * .28).toFixed(3));
        cinematicCard.style.setProperty("--cinema-card-x", ((1 - reveal) * 100).toFixed(1) + "px");
        cinematicCard.style.setProperty("--cinema-card-y", ((1 - reveal) * 24).toFixed(1) + "px");
        cinematicCard.style.setProperty("--cinema-card-rotate", ((1 - reveal) * 5).toFixed(2) + "deg");
      }
    };
    window.addEventListener("scroll", updateCinema, { passive: true });
    window.addEventListener("resize", updateCinema);
    updateCinema();
  }

  // Cursor spotlight e tilt sutil, somente em dispositivos com mouse.
  var glow = document.querySelector(".cursor-glow");
  var finePointer = window.matchMedia("(pointer:fine)").matches;
  if (glow && finePointer && !reduce) {
    root.classList.add("has-pointer");
    window.addEventListener("pointermove", function (e) {
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    }, { passive: true });
    document.querySelectorAll(".feature-card,.business-card,.agenda-preview").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - .5;
        var ny = (e.clientY - r.top) / r.height - .5;
        card.style.setProperty("--pointer-x", (nx * 8).toFixed(2) + "deg");
        card.style.setProperty("--pointer-y", (ny * -6).toFixed(2) + "deg");
      });
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--pointer-x", "0deg"); card.style.setProperty("--pointer-y", "0deg");
      });
    });
  }

  /* ---------- 3. Link ativo no menu (scrollspy) ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.site-header nav a[href^="#"]'));
  if (links.length && io) {
    var map = {};
    links.forEach(function (a) { var t = document.querySelector(a.getAttribute("href")); if (t) map[t.id] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = map[e.target.id]; if (!a) return;
        if (e.isIntersecting) { links.forEach(function (l) { l.classList.remove("is-active"); }); a.classList.add("is-active"); }
        else a.classList.remove("is-active");
      });
    }, { rootMargin: "-40% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { spy.observe(document.getElementById(id)); });
  }
})();
