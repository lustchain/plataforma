const LUST_CHAIN = {
  chainId: "0x1b0b",
  chainName: "LUST Chain",
  nativeCurrency: { name: "LST", symbol: "LST", decimals: 18 },
  rpcUrls: ["https://rpc.lustchain.org"],
  blockExplorerUrls: ["https://explorer.lustchain.org"]
};

function shortAddress(address) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect";
}

async function addLustNetwork() {
  if (!window.ethereum) {
    alert("MetaMask not found.");
    return;
  }
  try {
    await window.ethereum.request({ method: "wallet_addEthereumChain", params: [LUST_CHAIN] });
  } catch (err) {
    console.error(err);
    alert("Could not add LUST Chain.");
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found.");
    return;
  }
  try {
    await addLustNetwork();
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const account = accounts && accounts[0];
    document.querySelectorAll("[data-connect]").forEach((el) => {
      el.textContent = shortAddress(account);
    });
  } catch (err) {
    console.error(err);
  }
}

function bridgeCalc() {
  const amountEl = document.querySelector("#bridgeAmount");
  const feeEl = document.querySelector("#bridgeFee");
  const receiveEl = document.querySelector("#bridgeReceive");
  if (!amountEl || !feeEl || !receiveEl) return;
  const amount = Number(amountEl.value || 0);
  const fee = amount * 0.002;
  const receive = Math.max(amount - fee, 0);
  feeEl.textContent = `${fee.toFixed(4)} LUSDT`;
  receiveEl.textContent = `${receive.toFixed(4)} LUSDT`;
}

document.querySelectorAll("[data-add-network]").forEach((el) => el.addEventListener("click", addLustNetwork));
document.querySelectorAll("[data-connect]").forEach((el) => el.addEventListener("click", connectWallet));
document.querySelector("#bridgeAmount")?.addEventListener("input", bridgeCalc);
bridgeCalc();

document.querySelectorAll("[data-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const mode = tab.getAttribute("data-tab");
    const route = document.querySelector("#bridgeRoute");
    if (route) route.textContent = mode === "buy" ? "Polygon/BSC → LUST Chain" : "LUST Chain → Polygon/BSC";
  });
});
