(() => {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('#mainNavigation');
  if (!toggle || !nav) return;

  const unlockDocument = () => {
    const root = document.documentElement;
    const body = document.body;
    for (const el of [root, body]) {
      el.style.removeProperty('overflow');
      el.style.removeProperty('overflow-y');
      el.style.removeProperty('position');
      el.style.removeProperty('height');
      el.style.removeProperty('max-height');
      el.style.removeProperty('top');
      el.style.removeProperty('width');
      el.style.removeProperty('touch-action');
    }
  };

  const closeMenu = () => {
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    document.querySelectorAll('.nav-dropdown-menu[open]').forEach((menu) => { menu.open = false; });
    unlockDocument();
  };

  toggle.addEventListener('click', () => {
    unlockDocument();
    const opening = !document.body.classList.contains('nav-open');
    document.body.classList.toggle('nav-open', opening);
    toggle.setAttribute('aria-expanded', String(opening));
    toggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
  }, { passive: true });

  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { unlockDocument(); if (window.innerWidth > 900) closeMenu(); }, { passive: true });
  window.addEventListener('orientationchange', unlockDocument, { passive: true });
  window.addEventListener('pageshow', unlockDocument, { passive: true });
  window.addEventListener('pagehide', unlockDocument, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) unlockDocument(); });
  unlockDocument();
})();
