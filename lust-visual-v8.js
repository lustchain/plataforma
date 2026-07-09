// LUST VISUAL V8 BLACK ROSE SITE - UI only. No chain/contract logic.
(function(){
  function normalize(path){ return (path || '').split('/').pop() || 'index.html'; }
  var current = normalize(location.pathname);
  document.querySelectorAll('.nav a').forEach(function(a){
    var href = a.getAttribute('href') || '';
    var file = normalize(href.split('#')[0].split('?')[0]);
    if(file === current || (current === '' && file === 'index.html')) a.classList.add('active');
    else if(!a.classList.contains('active')) a.classList.remove('active');
  });
  var nftPages = ['nfts.html','pioneer.html','pioneer-owner-launch.html'];
  if(nftPages.indexOf(current) !== -1){
    var menu = document.querySelector('.nav-nft-menu');
    if(menu){ menu.classList.add('is-active'); var s = menu.querySelector('summary'); if(s) s.classList.add('active'); }
  }
  var btn = document.getElementById('backToTop');
  if(!btn){
    btn = document.createElement('button'); btn.id = 'backToTop'; btn.className = 'back-to-top'; btn.type = 'button'; btn.setAttribute('aria-label','Back to top'); btn.textContent = '↑'; document.body.appendChild(btn);
  }
  function onScroll(){ if(window.scrollY > 360) btn.classList.add('show'); else btn.classList.remove('show'); }
  btn.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
})();
