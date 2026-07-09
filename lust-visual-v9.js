
/* LUST Visual V9 helper: navigation state and back-to-top only. */
(function(){
  try{
    var path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    var nftPages={"nfts.html":1,"pioneer.html":1,"pioneer-owner-launch.html":1};
    document.querySelectorAll('.lust-v9-nav a').forEach(function(a){
      var href=(a.getAttribute('href')||'').split('/').pop().toLowerCase();
      var active=(path===href)||(path===''&&href==='index.html')||(nftPages[path]&&href==='nfts.html');
      a.classList.toggle('active',!!active);
    });
    var btn=document.getElementById('backToTop');
    if(btn){
      btn.addEventListener('click',function(e){e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});});
      btn.innerHTML='⌃';
    }
  }catch(e){console.warn('LUST V9 visual helper',e);}
})();
