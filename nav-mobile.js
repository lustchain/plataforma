(() => {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('#mainNavigation');
  if (!toggle || !nav) return;

  const closeMenu = () => {
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    document.querySelectorAll('.nav-dropdown-menu[open]').forEach((menu) => { menu.open = false; });
  };

  toggle.addEventListener('click', () => {
    const opening = !document.body.classList.contains('nav-open');
    document.body.classList.toggle('nav-open', opening);
    toggle.setAttribute('aria-expanded', String(opening));
    toggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
  });

  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMenu(); });
})();
