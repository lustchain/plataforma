// LUST V13 NFT FULL RESCUE — direct NFT links + back-to-top only. No contracts/RPC/mint logic touched.
(function(){
  function ensureBackTop(){
    var btn = document.getElementById('backToTop') || document.querySelector('.back-to-top');
    if(!btn){
      btn = document.createElement('button');
      btn.id = 'backToTop';
      btn.className = 'back-to-top';
      btn.type = 'button';
      btn.setAttribute('aria-label','Back to top');
      btn.textContent = '↑';
      document.body.appendChild(btn);
    }
    btn.style.display = 'flex';
    btn.onclick = function(){ window.scrollTo({top:0, behavior:'smooth'}); };
  }
  function markActive(){
    var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.nav a').forEach(function(a){
      var href = (a.getAttribute('href') || '').replace('./','').split('#')[0].split('?')[0].toLowerCase();
      if((path === '' && href === 'index.html') || href === path){ a.classList.add('active'); }
    });
  }
  document.addEventListener('DOMContentLoaded', function(){ ensureBackTop(); markActive(); });
  window.addEventListener('load', ensureBackTop);
})();
