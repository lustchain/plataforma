
// LUST VISUAL V16 PRO RESET — navigation, active state and back-to-top only
(function(){
  const body = document.body;
  document.documentElement.classList.add('lust-v16-ready');

  const nav = document.querySelector('.topbar .nav');
  const topbar = document.querySelector('.topbar');
  if (nav && topbar && !document.querySelector('.v16-mobile-toggle')) {
    const btn = document.createElement('button');
    btn.className = 'v16-mobile-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label','Open menu');
    btn.setAttribute('aria-expanded','false');
    btn.innerHTML = '<span></span>';
    topbar.insertBefore(btn, nav);
    const overlay = document.createElement('div');
    overlay.className = 'v16-menu-overlay';
    document.body.appendChild(overlay);
    const close = () => { body.classList.remove('v16-menu-open'); btn.setAttribute('aria-expanded','false'); };
    btn.addEventListener('click', () => {
      const open = !body.classList.contains('v16-menu-open');
      body.classList.toggle('v16-menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    overlay.addEventListener('click', close);
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    window.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
  }

  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.topbar .nav a').forEach(a => {
    const href = (a.getAttribute('href') || '').split('#')[0].split('?')[0].split('/').pop().toLowerCase() || 'index.html';
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
      a.setAttribute('aria-current','page');
    } else if (href !== 'index.html') {
      a.classList.remove('active');
      a.removeAttribute('aria-current');
    }
  });

  let back = document.querySelector('#backToTop') || document.querySelector('.back-to-top') || document.querySelector('.lust-back-to-top');
  if (!back) {
    back = document.createElement('button');
    back.type = 'button';
    back.className = 'lust-back-to-top';
    back.id = 'backToTop';
    back.setAttribute('aria-label','Back to top');
    back.textContent = '↑';
    document.body.appendChild(back);
  }
  back.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
})();
