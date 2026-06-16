(() => {
  const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const menus = Array.from(document.querySelectorAll('.nav-nft-menu'));

  const isDesktop = () => desktopPointer.matches;

  menus.forEach((menu) => {
    const summary = menu.querySelector(':scope > summary');
    if (!summary) return;

    const openDesktop = () => {
      if (isDesktop()) menu.open = true;
    };

    const closeDesktop = () => {
      if (isDesktop()) menu.open = false;
    };

    menu.addEventListener('mouseenter', openDesktop);
    menu.addEventListener('mouseleave', closeDesktop);

    menu.addEventListener('focusin', openDesktop);
    menu.addEventListener('focusout', (event) => {
      if (isDesktop() && !menu.contains(event.relatedTarget)) menu.open = false;
    });

    summary.addEventListener('click', (event) => {
      if (isDesktop()) {
        event.preventDefault();
        menu.open = true;
      }
    });

    menu.querySelectorAll('.nav-nft-dropdown a').forEach((link) => {
      link.addEventListener('click', () => {
        if (!isDesktop()) menu.open = false;
      });
    });
  });

  document.addEventListener('click', (event) => {
    if (isDesktop()) return;
    menus.forEach((menu) => {
      if (!menu.contains(event.target)) menu.open = false;
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    menus.forEach((menu) => { menu.open = false; });
  });

  const resetMenus = () => menus.forEach((menu) => { menu.open = false; });
  if (typeof desktopPointer.addEventListener === 'function') {
    desktopPointer.addEventListener('change', resetMenus);
  } else if (typeof desktopPointer.addListener === 'function') {
    desktopPointer.addListener(resetMenus);
  }
})();
