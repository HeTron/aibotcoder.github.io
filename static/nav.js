/* Shared site nav: single source of truth for the top nav on every aibotcoder.com page.
   Edit the `links` array here and every page updates. Renders into <nav class="nav" id="nav"></nav>.
   All values below are hardcoded literals (no user input), so innerHTML is safe here. */
(function () {
  var links = [
    { label: 'What I Automate', href: '/#automate', match: ['/', '/index.html'] },
    { label: 'Services',        href: '/services.html',               match: ['/services.html'] },
    { label: 'Pricing',         href: '/pricing.html',                match: ['/pricing.html'] },
    { label: 'Portfolio',       href: '/portfolio.html',              match: ['/portfolio.html'] },
    { label: 'Tools',           href: '/tools.html',                  match: ['/tools.html'] },
    { label: 'Calculator',      href: '/missed-call-calculator.html', match: ['/missed-call-calculator.html'] },
    { label: 'Español',         href: '/es/ai-phone-receptionist.html', match: ['/es/ai-phone-receptionist.html'], es: true }
  ];

  var path = location.pathname.replace(/\/index\.html$/, '/');

  var linksHTML = links.map(function (l) {
    var attrs  = l.es ? ' lang="es" hreflang="es"' : '';
    var active = l.match.indexOf(path) !== -1 ? ' class="active"' : '';
    return '<a href="' + l.href + '"' + attrs + active + '>' + l.label + '</a>';
  }).join('');

  var html =
    '<a class="brand" href="/"><span class="dot"></span><b>AI&nbsp;Bot</b><span>Coder</span></a>' +
    '<div class="nav-links">' + linksHTML + '</div>' +
    '<a class="nav-cta" href="tel:+19545688788"><span class="rdot"></span><span class="cta-lbl">Call the AI · </span>(954)&nbsp;568-8788</a>' +
    '<button class="nav-toggle" type="button" aria-label="Menu" aria-expanded="false"><span class="bar"></span></button>';

  var nav = document.getElementById('nav');
  if (!nav) { return; }
  nav.className = 'nav';
  nav.innerHTML = html;

  var toggle = nav.querySelector('.nav-toggle');
  function setOpen(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
  // close the menu after tapping a link, or when the viewport grows back to desktop
  Array.prototype.forEach.call(nav.querySelectorAll('.nav-links a'), function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });
  addEventListener('resize', function () { if (innerWidth > 900) { setOpen(false); } });
})();
