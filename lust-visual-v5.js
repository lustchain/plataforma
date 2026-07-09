/*
  LUST VISUAL V5 HELPER — visual/navigation only.
  It only highlights the current nav item and powers the Back to Top button on pages that do not load app.js.
*/
(function(){
  function normalize(path){
    if(!path) return 'index.html';
    path = String(path).split('#')[0].split('?')[0];
    path = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    return path.toLowerCase();
  }
  function mappedPage(page){
    if(page === '' || page === '/') return 'index.html';
    if(page === 'liquidity.html') return 'presale.html';
    if(page === 'pioneer-owner-launch.html') return 'pioneer.html';
    if(page === 'privacy-policy.html' || page === 'risk-disclosure.html' || page === 'terms-and-conditions.html') return 'docs.html';
    return page;
  }
  function markActiveNav(){
    var page = mappedPage(normalize(window.location.pathname));
    var nav = document.querySelector('.topbar .nav');
    if(!nav) return;
    nav.querySelectorAll('a').forEach(function(a){
      var href = normalize(a.getAttribute('href'));
      var active = href === page;
      a.classList.toggle('active', active);
      if(active) a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    });
    nav.querySelectorAll('.nav-nft-menu').forEach(function(menu){
      var hasActive = !!menu.querySelector('a.active');
      menu.classList.toggle('active-parent', hasActive || page === 'nfts.html' || page === 'pioneer.html');
    });
  }
  function ensureBackToTop(){
    var btn = document.getElementById('backToTop');
    if(!btn){
      btn = document.createElement('button');
      btn.className = 'back-to-top';
      btn.id = 'backToTop';
      btn.type = 'button';
      btn.setAttribute('aria-label','Back to top');
      btn.textContent = '↑';
      document.body.appendChild(btn);
    }
    function sync(){
      var show = window.scrollY > 260;
      btn.classList.toggle('show', show);
      btn.classList.toggle('lust-v5-show', show);
    }
    btn.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });
    window.addEventListener('scroll', sync, {passive:true});
    sync();
  }
  function boot(){ markActiveNav(); ensureBackToTop(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
