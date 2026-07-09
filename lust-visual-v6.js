/* LUST VISUAL V6 BLACK ROSE SITE - UI only */
(function(){
  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }
  ready(function(){
    var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if(path === '') path = 'index.html';
    var nftPages = {'nfts.html':true,'pioneer.html':true,'pioneer-owner-launch.html':true};
    document.querySelectorAll('.nav a').forEach(function(a){
      var href = (a.getAttribute('href') || '').split('#')[0].split('?')[0].replace(/^\.\//,'').toLowerCase();
      var active = href === path || (path === 'index.html' && (href === '' || href === 'index.html'));
      a.classList.toggle('active', active);
      if(active){ a.setAttribute('aria-current','page'); }
      else { a.removeAttribute('aria-current'); }
    });
    document.querySelectorAll('.nav-nft-menu').forEach(function(menu){
      menu.classList.toggle('active', !!nftPages[path]);
    });

    var btn = document.getElementById('backToTop') || document.querySelector('.back-to-top');
    if(!btn){
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'back-to-top';
      btn.id = 'backToTop';
      btn.setAttribute('aria-label','Back to top');
      btn.textContent = '↑';
      document.body.appendChild(btn);
    }
    function updateBackTop(){
      var show = window.scrollY > 420;
      btn.classList.toggle('show', show);
    }
    btn.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });
    updateBackTop();
    window.addEventListener('scroll', updateBackTop, {passive:true});
  });
})();
