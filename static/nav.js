/* Shared site nav + language switch: single source of truth for the top nav on every
   aibotcoder.com page (English and Spanish). Renders into <nav class="nav" id="nav"></nav>.
   Loaded synchronously right after <body> so the language redirect fires before paint.

   TO ADD A SPANISH TWIN FOR A NEW PAGE: add its English path to MIRRORED below and create
   the matching /es/<page>. Every entry in MIRRORED must have a real /es/ file or the
   language redirect will 404. All values below are hardcoded literals (no user input),
   so innerHTML is safe here. */
(function () {
  'use strict';

  // English canonical paths that have a Spanish twin under /es/.
  var MIRRORED = [
    '/', '/ai-phone-receptionist.html', '/services.html', '/pricing.html',
    '/portfolio.html', '/about.html', '/contact.html', '/tools.html',
    '/missed-call-calculator.html'
  ];

  // Nav items: label per language + the English/Spanish hrefs. All six have Spanish twins.
  var ITEMS = [
    { en: 'What I Automate', es: 'Qué Automatizo', enHref: '/#automate',                   esHref: '/es/#automate',                   path: '/' },
    { en: 'Services',        es: 'Servicios',      enHref: '/services.html',               esHref: '/es/services.html',               path: '/services.html' },
    { en: 'Marketing Suite', es: 'Marketing Suite', enHref: '/marketing-suite.html',        esHref: '/marketing-suite.html',           path: '/marketing-suite.html' },
    { en: 'Pricing',         es: 'Precios',        enHref: '/pricing.html',                esHref: '/es/pricing.html',                path: '/pricing.html' },
    { en: 'Portfolio',       es: 'Portafolio',     enHref: '/portfolio.html',              esHref: '/es/portfolio.html',              path: '/portfolio.html' },
    { en: 'Tools',           es: 'Herramientas',   enHref: '/tools.html',                  esHref: '/es/tools.html',                  path: '/tools.html' },
    { en: 'Calculator',      es: 'Calculadora',    enHref: '/missed-call-calculator.html', esHref: '/es/missed-call-calculator.html', path: '/missed-call-calculator.html' }
  ];

  var PREF_KEY = 'aibc_lang';

  // ── Language state ──
  var raw    = location.pathname.replace(/\/index\.html$/, '/');
  var isES   = /^\/es(\/|$)/.test(raw);
  var enPath = isES ? (raw.replace(/^\/es/, '') || '/') : raw;
  if (enPath === '') { enPath = '/'; }
  var hasTwin = MIRRORED.indexOf(enPath) !== -1;
  var esPath  = enPath === '/' ? '/es/' : '/es' + enPath;

  function getPref() { try { return localStorage.getItem(PREF_KEY); } catch (e) { return null; } }
  function setPref(v) { try { localStorage.setItem(PREF_KEY, v); } catch (e) {} }

  // ── Remembered-choice redirect (only on pages that have a twin) ──
  if (hasTwin) {
    var pref = getPref();
    if (pref === 'es' && !isES) { location.replace(esPath); return; }
    if (pref === 'en' &&  isES) { location.replace(enPath); return; }
  }

  // ── Render (waits for the #nav element) ──
  function render() {
    var nav = document.getElementById('nav');
    if (!nav) { return; }

    var here = raw; // normalized current path, for active-state matching

    var linksHTML = ITEMS.map(function (it) {
      var href   = isES ? it.esHref : it.enHref;
      var label  = isES ? it.es     : it.en;
      var itHere = it.path === '/' ? (isES ? '/es/' : '/') : (isES ? '/es' + it.path : it.path);
      var active = (here === itHere) ? ' class="active"' : '';
      return '<a href="' + href + '"' + active + '>' + label + '</a>';
    });

    // Language toggle: English pages offer Español; Spanish pages offer English.
    var toggleHref, toggleLabel, toggleTo, toggleAttrs;
    if (isES) {
      toggleHref = enPath; toggleLabel = 'English'; toggleTo = 'en';
      toggleAttrs = ' lang="en" hreflang="en"';
    } else {
      toggleHref = hasTwin ? esPath : '/es/'; toggleLabel = 'Español'; toggleTo = 'es';
      toggleAttrs = ' lang="es" hreflang="es"';
    }
    linksHTML.push('<a href="' + toggleHref + '"' + toggleAttrs +
      ' data-lang-set="' + toggleTo + '">' + toggleLabel + '</a>');

    var brandHref = isES ? '/es/' : '/';
    var ctaLabel  = isES ? 'Llame a la IA · ' : 'Call the AI · ';

    var html =
      '<a class="brand" href="' + brandHref + '"><span class="dot"></span><b>AI&nbsp;Bot</b><span>Coder</span></a>' +
      '<div class="nav-links">' + linksHTML.join('') + '</div>' +
      '<a class="nav-cta" href="tel:+19545688788"><span class="rdot"></span><span class="cta-lbl">' + ctaLabel + '</span>(954)&nbsp;568-8788</a>' +
      '<button class="nav-toggle" type="button" aria-label="Menu" aria-expanded="false"><span class="bar"></span></button>';

    nav.className = 'nav';
    nav.innerHTML = html;

    // Persist the language choice the instant the toggle is clicked, before navigation.
    var langLink = nav.querySelector('a[data-lang-set]');
    if (langLink) {
      langLink.addEventListener('click', function () { setPref(this.getAttribute('data-lang-set')); });
    }

    // Mobile hamburger
    var toggle = nav.querySelector('.nav-toggle');
    function setOpen(open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    Array.prototype.forEach.call(nav.querySelectorAll('.nav-links a'), function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    addEventListener('resize', function () { if (innerWidth > 900) { setOpen(false); } });
  }

  if (document.getElementById('nav')) { render(); }
  else if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', render); }
  else { render(); }
})();
