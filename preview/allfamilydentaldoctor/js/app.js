/* All Family Dental — preview interactions (Lenis smooth scroll + GSAP reveals) */
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- Lenis smooth scroll ---
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  // --- header scrolled state ---
  const header = document.getElementById("header");
  const onScroll = () => {
    if (window.scrollY > 30) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // --- anchor links through Lenis ---
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id === "#" || id === "#top") return;
      const el = document.querySelector(id);
      if (el && lenis) { e.preventDefault(); lenis.scrollTo(el, { offset: -70 }); }
    });
  });

  if (reduce || !window.gsap) return;

  gsap.registerPlugin(ScrollTrigger);
  if (lenis) lenis.on("scroll", ScrollTrigger.update);

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
      scrollTrigger: { trigger: section, start: "top 78%" },
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
