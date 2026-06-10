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
};

function shortAddress(address) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect wallet";
}

function connectedHtml(address) {
  return `
    <div class="connect-icon">◫</div>
    <div class="connect-copy">
      <strong>${shortAddress(address)}</strong>
      <span>Wallet connected</span>
    </div>
    <div class="connect-caret">⌄</div>
  `;
}

function disconnectedHtml() {
  return `
    <div class="connect-icon">◫</div>
    <div class="connect-copy">
      <strong>Connect wallet</strong>
      <span>Wallet not connected</span>
    </div>
    <div class="connect-caret">⌄</div>
  `;
}

function setConnectedState(address) {
  document.querySelectorAll("[data-connect]").forEach((btn) => {
    btn.innerHTML = connectedHtml(address);
  });
}

function setDisconnectedState() {
  document.querySelectorAll("[data-connect]").forEach((btn) => {
    btn.innerHTML = disconnectedHtml();
  });
}

async function addLustNetwork() {
  if (!window.ethereum) {
    alert("MetaMask not found.");
    return false;
  }

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [LUST_CHAIN]
    });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not found. Use MetaMask or a browser wallet.");
    return;
  }

  try {
    await addLustNetwork();
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    if (accounts && accounts[0]) {
      setConnectedState(accounts[0]);
    }
  } catch (err) {
    console.error(err);
    setDisconnectedState();
  }
}

async function hydrateWallet() {
  if (!window.ethereum) {
    setDisconnectedState();
    return;
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_accounts"
    });

    if (accounts && accounts[0]) {
      setConnectedState(accounts[0]);
    } else {
      setDisconnectedState();
    }
  } catch (err) {
    console.error(err);
    setDisconnectedState();
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

document.querySelectorAll("[data-connect]").forEach((el) => {
  el.addEventListener("click", connectWallet);
});

document.querySelector("#bridgeAmount")?.addEventListener("input", bridgeCalc);
bridgeCalc();

document.querySelectorAll("[data-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    const mode = tab.getAttribute("data-tab");
    const route = document.querySelector("#bridgeRoute");

    if (route) {
      route.textContent =
        mode === "buy"
          ? "Polygon/BSC → LUST Chain"
          : "LUST Chain → Polygon/BSC";
    }
  });
});

hydrateWallet();
