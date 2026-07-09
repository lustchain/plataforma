// LUST VISUAL V10 CLEAN FINAL - UI only: active nav + back-to-top fallback. No wallet/contract/RPC logic touched.
(function(){
  function pageName(){
    var p=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    return p===''?'index.html':p;
  }
  function markActive(){
    var p=pageName();
    document.querySelectorAll('.nav a').forEach(function(a){
      var h=(a.getAttribute('href')||'').split('#')[0].split('?')[0].replace('./','').toLowerCase();
      var active = h===p || (p==='index.html' && (h==='' || h==='index.html'));
      a.classList.toggle('active', active);
      if(active) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
    var nftPages=['nfts.html','pioneer.html','pioneer-owner-launch.html'];
    document.querySelectorAll('.nav-nft-menu').forEach(function(d){ d.classList.toggle('active', nftPages.indexOf(p)!==-1); });
  }
  function topButton(){
    var b=document.getElementById('backToTop');
    if(!b) return;
    var sync=function(){ b.classList.toggle('show', window.scrollY>240); };
    b.addEventListener('click',function(){ window.scrollTo({top:0,behavior:'smooth'}); });
    window.addEventListener('scroll',sync,{passive:true});
    sync();
  }
  document.addEventListener('DOMContentLoaded',function(){markActive();topButton();});
})();
