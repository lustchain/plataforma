// LUST VISUAL V15 HOME MOBILE PRO
(function(){
  const VERSION = '20260709-v15-home-mobile-pro';
  function ready(fn){ if(document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    document.documentElement.setAttribute('data-lust-v15', VERSION);
    const topbar = document.querySelector('.topbar');
    const nav = document.querySelector('.topbar .nav, .nav');
    if(topbar && nav && !document.querySelector('.lust-mobile-toggle')){
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lust-mobile-toggle';
      btn.setAttribute('aria-label','Open menu');
      btn.setAttribute('aria-expanded','false');
      btn.innerHTML = '<span></span>';
      const actions = topbar.querySelector('.actions');
      if(actions){ topbar.insertBefore(btn, actions); } else { topbar.appendChild(btn); }
      btn.addEventListener('click', function(){
        const open = !document.body.classList.contains('lust-menu-open');
        document.body.classList.toggle('lust-menu-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });
      nav.addEventListener('click', function(e){
        if(e.target && e.target.closest('a')){
          document.body.classList.remove('lust-menu-open');
          btn.setAttribute('aria-expanded','false');
          btn.setAttribute('aria-label','Open menu');
        }
      });
      document.addEventListener('keydown', function(e){
        if(e.key === 'Escape'){
          document.body.classList.remove('lust-menu-open');
          btn.setAttribute('aria-expanded','false');
          btn.setAttribute('aria-label','Open menu');
        }
      });
    }
    try{
      const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
      document.querySelectorAll('.nav a').forEach(function(a){
        const href = (a.getAttribute('href') || '').split('#')[0].split('?')[0].replace('./','').toLowerCase();
        if(href === current || (!href && current === 'index.html')) a.classList.add('active');
        if(current === 'index.html' && href === 'index.html') a.classList.add('active');
      });
    }catch(e){}
    let back = document.getElementById('backToTop') || document.querySelector('.back-to-top');
    if(!back){
      back = document.createElement('button');
      back.type='button';
      back.id='backToTop';
      back.className='back-to-top lust-v15-backtop';
      back.setAttribute('aria-label','Back to top');
      back.textContent='↑';
      document.body.appendChild(back);
    }else{
      back.classList.add('lust-v15-backtop');
    }
    back.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });
  });
})();
