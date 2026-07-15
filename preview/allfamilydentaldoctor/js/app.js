/* All Family Dental - preview interactions (native scroll + GSAP reveals)
   No smooth-scroll library: native scrolling is used for reliability.
   Content is always made visible even if GSAP fails to load. */
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals = document.querySelectorAll(".reveal");

  function showAll() {
    reveals.forEach((el) => { el.style.opacity = "1"; el.style.transform = "none"; });
  }

  // --- header scrolled state ---
  const header = document.getElementById("header");
  const onScroll = () => {
    if (window.scrollY > 30) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Safety net: if anything goes wrong or GSAP is missing/slow, reveal everything.
  if (reduce || !window.gsap) { showAll(); return; }
  window.addEventListener("load", () => {
    setTimeout(() => { if (!window.__revealed) showAll(); }, 1200);
  });

  gsap.registerPlugin(ScrollTrigger);
  window.__revealed = true;

  // --- staggered reveals per section ---
  gsap.utils.toArray("section").forEach((section) => {
    const items = section.querySelectorAll(".reveal");
    if (!items.length) return;
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.1,
      scrollTrigger: { trigger: section, start: "top 80%" },
    });
  });

  // --- hero reveal on load (don't wait for scroll) ---
  gsap.to(".hero .reveal", {
    opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.15,
  });

  // --- count-up stats ---
  document.querySelectorAll(".stat-num").forEach((el) => {
    const target = parseFloat(el.dataset.value || el.textContent);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: () => { el.textContent = obj.v.toFixed(decimals) + suffix; },
        });
      },
    });
  });
})();
