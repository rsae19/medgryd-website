/* Site-wide behavior: nav, reveals, the manifesto's word-by-word light-up, counters. */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Nav: frosted once the page moves; burger opens the sheet on small screens.
  const nav = document.querySelector(".nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const burger = nav.querySelector(".nav-burger");
    const sheet = document.querySelector(".nav-sheet");
    if (burger && sheet) {
      const set = (open) => {
        nav.classList.toggle("open", open);
        burger.setAttribute("aria-expanded", String(open));
        sheet.toggleAttribute("inert", !open);
      };
      set(false);
      burger.addEventListener("click", () => set(!nav.classList.contains("open")));
      sheet.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
    }
  }

  // Hero entrance
  // rAF alone never fires in a background tab, which would leave the hero blank; the timer covers it.
  const enter = () => document.documentElement.classList.add("is-in");
  requestAnimationFrame(() => requestAnimationFrame(enter));
  setTimeout(enter, 120);

  // Reveal on scroll
  const reveals = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) reveals.forEach((el) => el.classList.add("in"));
  else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach((el, i) => {
      if (el.dataset.delay) el.style.transitionDelay = el.dataset.delay + "ms";
      io.observe(el);
    });
  }

  // Manifesto: split into words once, then light each word as the line passes the reading band.
  document.querySelectorAll("[data-manifesto]").forEach((el) => {
    const walk = (node) => {
      [...node.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement("span");
            s.className = "w" + (node.tagName === "EM" ? " acc" : "");
            s.textContent = part;
            frag.appendChild(s);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1) walk(c);
      });
    };
    walk(el);
    const words = [...el.querySelectorAll(".w")];
    if (reduce) { words.forEach((w) => w.classList.add("lit")); return; }
    let ticking = false;
    const update = () => {
      ticking = false;
      const band = window.innerHeight * 0.72;
      words.forEach((w) => { w.classList.toggle("lit", w.getBoundingClientRect().top < band); });
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  });

  // Counters count up once, when seen.
  const counters = document.querySelectorAll("[data-count]");
  const run = (el) => {
    const to = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (reduce) { el.textContent = to.toLocaleString() + suffix; return; }
    const t0 = performance.now(), dur = 1600;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 4);
      el.textContent = Math.round(to * e).toLocaleString() + suffix;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { run(en.target); cio.unobserve(en.target); } }), { threshold: 0.4 });
    counters.forEach((c) => cio.observe(c));
  } else counters.forEach(run);

  // Marquee: duplicate the run once so the loop is seamless.
  document.querySelectorAll(".marquee-track").forEach((t) => { t.innerHTML += t.innerHTML; t.lastElementChild && [...t.children].slice(t.children.length / 2).forEach((c) => c.setAttribute("aria-hidden", "true")); });

  // Hero telemetry: a few honest-looking readouts cycling, like a status board.
  const tele = document.querySelector("[data-telemetry]");
  if (tele && !reduce) {
    const rows = [
      [["4 days", "to next exam"], ["18 / 27", "Tasks today"], ["2h 14m", "Focus logged"]],
      [["182", "Anki due"], ["7", "Reviews due"], ["450", "Comfort margin"]],
      [["Level 34", "GrydRank"], ["86", "Productivity"], ["12 days", "Streak"]],
    ];
    let i = 0;
    setInterval(() => {
      i = (i + 1) % rows.length;
      const spans = tele.querySelectorAll("div");
      rows[i].forEach((r, j) => { if (spans[j]) spans[j].innerHTML = (j === 0 ? '<span class="live"></span>' : "") + "<b>" + r[0] + "</b>" + r[1]; });
    }, 4200);
  }

  const y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
