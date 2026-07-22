/* Vento Dental - scroll motion
   Native scroll only (no smooth-scroll library). GSAP + ScrollTrigger for
   reveals. Always-visible fallback if GSAP fails to load or the visitor
   prefers reduced motion, so the page never renders blank/stuck. */

(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsapReady = !!(window.gsap && window.ScrollTrigger);

  function showAll() {
    document.documentElement.classList.remove('reveal-ready');
    document.documentElement.classList.add('reveal-fallback');
  }

  if (!gsapReady || reduceMotion) {
    showAll();
  } else {
    document.documentElement.classList.add('reveal-ready');
    runReveals();
    runCountUps();
  }

  // Mobile nav toggle (independent of GSAP availability)
  var toggle = document.getElementById('mobileToggle');
  var mobileNav = document.getElementById('mobileNav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var open = toggle.classList.toggle('open');
      mobileNav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        toggle.classList.remove('open');
        mobileNav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function runReveals() {
    gsap.registerPlugin(ScrollTrigger);

    // Animate each .reveal individually, staggered by data-delay, triggered
    // by its own section entering view. Distinct entrance per data-reveal
    // type gives each section a different feel.
    var sections = document.querySelectorAll('section, footer');
    sections.forEach(function (section) {
      var items = section.querySelectorAll('.reveal');
      if (!items.length) return;

      ScrollTrigger.create({
        trigger: section,
        start: 'top 78%',
        once: true,
        onEnter: function () {
          items.forEach(function (el) {
            var type = el.getAttribute('data-reveal') || 'fade-up';
            var delay = parseFloat(el.getAttribute('data-delay') || '0') * 0.1;
            var vars = { opacity: 1, duration: 0.9, ease: 'power3.out', delay: delay };

            if (type === 'fade-up') { vars.y = 0; }
            else if (type === 'fade-left') { vars.x = 0; }
            else if (type === 'fade-right') { vars.x = 0; }
            else if (type === 'scale-in') { vars.scale = 1; }
            else if (type === 'clip-reveal') {
              gsap.to(el, { clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power4.out', delay: delay });
              return;
            }
            gsap.to(el, vars);
          });
        }
      });
    });

    // Hero decorative wind lines: slow parallax drift on scroll
    var windLines = document.querySelector('.wind-lines');
    if (windLines) {
      gsap.to(windLines, {
        y: 60,
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
      });
    }
    var orbA = document.querySelector('.glow-orb-a');
    var orbB = document.querySelector('.glow-orb-b');
    if (orbA) gsap.to(orbA, { y: 40, x: -20, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 } });
    if (orbB) gsap.to(orbB, { y: -30, x: 20, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 } });
  }

  function runCountUps() {
    var stats = document.querySelectorAll('.stat-num[data-count-to]');
    if (!stats.length) return;

    stats.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count-to'));
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var proxy = { val: 0 };

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          gsap.to(proxy, {
            val: target,
            duration: 1.6,
            ease: 'power2.out',
            onUpdate: function () {
              el.textContent = proxy.val.toFixed(decimals);
            },
            onComplete: function () {
              el.textContent = target.toFixed(decimals);
            }
          });
        }
      });
    });
  }
})();
