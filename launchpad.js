document.addEventListener("DOMContentLoaded",()=>{
  const back=document.getElementById("backToTop");
  if(back){const sync=()=>back.classList.toggle("show",window.scrollY>420);window.addEventListener("scroll",sync,{passive:true});sync();back.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"));}
  const $=id=>document.getElementById(id);
  const els={name:$("lpName"),symbol:$("lpSymbol"),quote:$("lpQuote"),curve:$("lpCurve"),allocation:$("lpAllocation"),target:$("lpTarget"),share:$("lpCurveAllocation"),lock:$("lpLock"),fair:$("lpFair"),confirm:$("lpConfirm"),token:$("lpToken")};
  if(!els.name)return;
  const format=n=>{const value=Number(n||0);return Number.isFinite(value)?new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(value):"0"};
  const update=()=>{
    const name=(els.name.value||"Untitled Token").trim();
    const symbol=(els.symbol.value||"TOKEN").trim().toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,10);
    els.symbol.value=symbol;
    $("lpPreviewName").textContent=name; $("lpPreviewSymbol").textContent=symbol||"TOKEN"; $("lpAvatar").textContent=(symbol||name||"T").charAt(0).toUpperCase();
    $("lpPreviewQuote").textContent=els.quote.value; $("lpTargetAsset").textContent=els.quote.value; $("lpPreviewCurve").textContent=els.curve.value;
    $("lpPreviewAmount").textContent=`${format(els.allocation.value)} tokens`; $("lpPreviewTarget").textContent=`${format(els.target.value)} ${els.quote.value}`;
    $("lpCurveOutput").textContent=`${els.share.value}%`; $("lpPreviewShare").textContent=`${els.share.value}%`; $("lpPreviewLock").textContent=els.lock.value;
    $("lpPreviewPrivate").textContent=els.fair.checked&&Number(els.share.value)===100?"None":`${100-Number(els.share.value)}% retained`;
    let readiness=60; if(/^0x[a-fA-F0-9]{40}$/.test(els.token.value.trim()))readiness+=15; if(name&&symbol)readiness+=10; if(els.fair.checked)readiness+=5; if(els.confirm.checked)readiness+=10;
    readiness=Math.min(100,readiness); $("lpReadinessText").textContent=`${readiness}%`; $("lpProgressBar").style.width=`${readiness}%`; $("lpPreviewStatus").textContent=readiness===100?"READY FOR REVIEW":"DRAFT";
  };
  Object.values(els).forEach(el=>el&&el.addEventListener("input",update));
  $("lpReset").addEventListener("click",()=>{els.token.value="";els.name.value="My Creator Token";els.symbol.value="CREATOR";els.quote.value="LUSDT";els.curve.value="Linear bonding curve";els.allocation.value="1000000";els.target.value="10000";els.share.value="100";els.lock.value="Permanent lock";els.fair.checked=true;els.confirm.checked=false;update();});
  update();
});