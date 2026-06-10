const LUST_CHAIN = {
  chainId: "0x1b0b",
  chainName: "LUST Chain",
  nativeCurrency: { name: "LST", symbol: "LST", decimals: 18 },
  rpcUrls: ["https://rpc.lustchain.org"],
  blockExplorerUrls: ["https://explorer.lustchain.org"]
}
function short(addr){return addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : "Connect"}
async function addNetwork(){
  if(!window.ethereum){alert("MetaMask not found.");return}
  try{await window.ethereum.request({method:"wallet_addEthereumChain",params:[LUST_CHAIN]})}
  catch(e){console.error(e);alert("Could not add LUST Chain.")}
}
async function connectWallet(){
  if(!window.ethereum){alert("MetaMask not found.");return}
  try{await addNetwork(); const accounts=await window.ethereum.request({method:"eth_requestAccounts"}); document.querySelectorAll("[data-connect]").forEach(b=>b.textContent=short(accounts?.[0]))}
  catch(e){console.error(e)}
}
document.querySelectorAll("[data-add-network]").forEach(b=>b.addEventListener("click",addNetwork))
document.querySelectorAll("[data-connect]").forEach(b=>b.addEventListener("click",connectWallet))
const amount = document.getElementById("amount")
const receive = document.getElementById("receive")
const fee = document.getElementById("fee")
const route = document.getElementById("route")
const buyTab = document.getElementById("buyTab")
const sellTab = document.getElementById("sellTab")
let mode = "buy"
function calc(){
  if(!amount || !receive || !fee) return
  const value = Math.max(0, Number(amount.value || 0))
  const f = value * 0.002
  const r = Math.max(0, value - f)
  fee.textContent = `${f.toFixed(4)} LUSDT`
  receive.textContent = `${r.toFixed(4)} LUSDT`
  if(route) route.textContent = mode === "buy" ? "Polygon/BSC → LUST" : "LUST → Polygon/BSC"
}
function setMode(next){mode=next; buyTab?.classList.toggle("active",mode==="buy"); sellTab?.classList.toggle("active",mode==="sell"); calc()}
buyTab?.addEventListener("click",()=>setMode("buy"))
sellTab?.addEventListener("click",()=>setMode("sell"))
amount?.addEventListener("input",calc)
calc()
