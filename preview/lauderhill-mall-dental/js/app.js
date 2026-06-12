/* Lauderhill Mall Dental — scroll reveals + header state.
   Native scroll + GSAP ScrollTrigger (no Lenis, per build gotchas).
   Always-visible fallback if GSAP fails or reduced-motion is on. */

(function () {
  "use strict";

  // year stamp
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // header scrolled state
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (window.scrollY > 24) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // force everything visible — the safety net
  function showAll() {
    document.body.classList.add("no-gsap");
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  if (!window.gsap || !window.ScrollTrigger || reduced) {
    showAll();
    return;
  }

  try {
    gsap.registerPlugin(ScrollTrigger);

    // group reveals by their parent section so children stagger together
    document.querySelectorAll("section, footer, .trust").forEach(function (section) {
      var items = section.querySelectorAll(".reveal");
      if (!items.length) return;
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: section, start: "top 82%" },
        onStart: function () {
          items.forEach(function (el) { el.classList.add("is-in"); });
        }
      });
    });

    // hero loads immediately (no scroll wait)
    var heroItems = document.querySelectorAll(".hero .reveal");
    gsap.to(heroItems, {
      opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.09, delay: 0.15,
      onStart: function () { heroItems.forEach(function (el) { el.classList.add("is-in"); }); }
    });

    // failsafe: if anything is still hidden after load, reveal it
    window.addEventListener("load", function () {
      setTimeout(function () {
        document.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight) el.classList.add("is-in");
        });
        ScrollTrigger.refresh();
      }, 400);
    });
  } catch (e) {
    showAll();
  }
})();
