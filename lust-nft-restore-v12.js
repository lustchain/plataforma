/* LUST NFT RESTORE ORIGINAL V12 - UI only */
(function(){
  function ready(fn){ if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', fn); } else { fn(); } }
  ready(function(){
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
    btn.style.opacity = '1';
    btn.style.visibility = 'visible';
    btn.style.pointerEvents = 'auto';
    if(!btn.dataset.lustV12){
      btn.dataset.lustV12 = '1';
      btn.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });
    }

    var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.nav a').forEach(function(a){
      var href = (a.getAttribute('href') || '').replace('./','').toLowerCase();
      if(href === path) a.classList.add('active');
    });
    if(path === 'nfts.html' || path === 'pioneer.html' || path === 'pioneer-owner-launch.html'){
      var sum = document.querySelector('.nav-nft-menu summary');
      if(sum) sum.classList.add('active');
    }
  });
})();
