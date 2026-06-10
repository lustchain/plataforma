const OFFICIAL_BRIDGE_URL = 'https://lusdt-bridge.lustchain.org'
const FEE = 0.002
const chain = {
  chainId: '0x1b0b',
  chainName: 'LUST Chain',
  nativeCurrency: { name: 'LST', symbol: 'LST', decimals: 18 },
  rpcUrls: ['https://rpc.lustchain.org'],
  blockExplorerUrls: ['https://explorer.lustchain.org']
}
let direction = 'buy'
function qs(s){return document.querySelector(s)}
function qsa(s){return [...document.querySelectorAll(s)]}
function short(a){return a ? `${a.slice(0,6)}...${a.slice(-4)}` : 'Connect'}
function updateBridge(){
  const amount = Number(qs('#amountInput')?.value || 0)
  const fee = Math.max(0, amount * FEE)
  const receive = Math.max(0, amount - fee)
  qs('#feeValue').textContent = `${fee.toFixed(amount < 10 ? 4 : 2)} LUSDT`
  qs('#receiveValue').textContent = `${receive.toFixed(amount < 10 ? 4 : 2)} LUSDT`
  const buy = direction === 'buy'
  qs('#fromNetwork').textContent = buy ? 'Polygon' : 'LUST Chain'
  qs('#fromToken').textContent = buy ? 'USDT' : 'LUSDT'
  qs('#toNetwork').textContent = buy ? 'LUST Chain' : 'Polygon'
  qs('#toToken').textContent = buy ? 'LUSDT' : 'USDT'
}
async function addNetwork(){
  if(!window.ethereum){ alert('MetaMask not found.'); return }
  try{ await window.ethereum.request({ method:'wallet_addEthereumChain', params:[chain] }) }
  catch(e){ console.error(e); alert('Could not add LUST Chain.') }
}
async function connect(){
  if(!window.ethereum){ alert('MetaMask not found.'); return }
  try{
    await addNetwork()
    const accounts = await window.ethereum.request({ method:'eth_requestAccounts' })
    qs('#connectBtn').textContent = short(accounts?.[0])
  }catch(e){ console.error(e) }
}
qsa('[data-add-network]').forEach(b=>b.addEventListener('click',addNetwork))
qs('#connectBtn')?.addEventListener('click',connect)
qsa('.tab').forEach(tab=>tab.addEventListener('click',()=>{
  direction = tab.dataset.direction || 'buy'
  qsa('.tab').forEach(t=>t.classList.remove('active'))
  tab.classList.add('active')
  updateBridge()
}))
qs('#amountInput')?.addEventListener('input',updateBridge)
qs('#maxBtn')?.addEventListener('click',()=>{ qs('#amountInput').value='100'; updateBridge() })
qs('#openBridgeBtn')?.addEventListener('click',()=>{ window.open(OFFICIAL_BRIDGE_URL, '_blank', 'noopener,noreferrer') })
updateBridge()
