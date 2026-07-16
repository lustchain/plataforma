(() => {
  const header = document.querySelector('.topbar');
  const toggle = document.querySelector('.mobile-nav-toggle');
  const nav = document.querySelector('#site-navigation');
  if (!header || !toggle || !nav) return;

  const closeMenu = () => {
    document.body.classList.remove('mobile-nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
  };

  const openMenu = () => {
    document.body.classList.add('mobile-nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation menu');
  };

  toggle.addEventListener('click', () => {
    document.body.classList.contains('mobile-nav-open') ? closeMenu() : openMenu();
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) closeMenu();
  });
})();
