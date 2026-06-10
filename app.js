const LUST_CHAIN = {
  chainId: "0x1b0b",
  chainName: "LUST Chain",
  nativeCurrency: {
    name: "LST",
    symbol: "LST",
    decimals: 18
  },
  rpcUrls: ["https://rpc.lustchain.org"],
  blockExplorerUrls: ["https://explorer.lustchain.org"]
}

function shortAddress(address) {
  if (!address) return "Connect"
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

async function addLustNetwork() {
  if (!window.ethereum) {
    alert("MetaMask not found. Install MetaMask first.")
    return
  }

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [LUST_CHAIN]
    })
  } catch (err) {
    console.error(err)
    alert("Could not add LUST Chain.")
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found. Install MetaMask first.")
    return
  }

  try {
    await addLustNetwork()
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    })

    const account = accounts && accounts[0]
    const btn = document.getElementById("connectBtn")
    if (btn && account) btn.textContent = shortAddress(account)
  } catch (err) {
    console.error(err)
    alert("Wallet connection cancelled or failed.")
  }
}

document.getElementById("addNetworkBtn")?.addEventListener("click", addLustNetwork)
document.getElementById("addNetworkBtn2")?.addEventListener("click", addLustNetwork)
document.getElementById("connectBtn")?.addEventListener("click", connectWallet)
