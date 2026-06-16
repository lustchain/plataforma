(() => {
  const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const menus = Array.from(document.querySelectorAll('.nav-nft-menu'));
  const CLOSE_DELAY_MS = 320;

  const isDesktop = () => desktopPointer.matches;

  menus.forEach((menu) => {
    const summary = menu.querySelector(':scope > summary');
    const dropdown = menu.querySelector(':scope > .nav-nft-dropdown');
    if (!summary || !dropdown) return;

    let closeTimer = null;

    const cancelClose = () => {
      if (closeTimer !== null) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
    };

    const openDesktop = () => {
      if (!isDesktop()) return;
      cancelClose();
      menu.open = true;
    };

    const scheduleCloseDesktop = () => {
      if (!isDesktop()) return;
      cancelClose();
      closeTimer = window.setTimeout(() => {
        menu.open = false;
        closeTimer = null;
      }, CLOSE_DELAY_MS);
    };

    // Desktop hover behavior. The delay prevents the dropdown from closing
    // while the pointer moves from the NFTs label into the menu panel.
    menu.addEventListener('pointerenter', openDesktop);
    menu.addEventListener('pointerleave', scheduleCloseDesktop);
    summary.addEventListener('pointerenter', openDesktop);
    dropdown.addEventListener('pointerenter', openDesktop);
    dropdown.addEventListener('pointerleave', scheduleCloseDesktop);

    // Keyboard accessibility.
    menu.addEventListener('focusin', openDesktop);
    menu.addEventListener('focusout', (event) => {
      if (isDesktop() && !menu.contains(event.relatedTarget)) {
        scheduleCloseDesktop();
      }
    });

    // On desktop, clicking the NFTs label does not navigate or close it.
    // On mobile/touch, native <details> click behavior opens/closes the menu.
    summary.addEventListener('click', (event) => {
      if (isDesktop()) {
        event.preventDefault();
        openDesktop();
      }
    });

    dropdown.querySelectorAll('a').forEach((link) => {
      link.addEventListener('pointerenter', openDesktop);
      link.addEventListener('click', () => {
        cancelClose();
        menu.open = false;
      });
    });
  });

  // Touch/mobile: tap outside closes the dropdown.
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
