import { createAppKit } from "https://esm.sh/@reown/appkit@1.8.20";
import { EthersAdapter } from "https://esm.sh/@reown/appkit-adapter-ethers@1.8.20";
import { defineChain } from "https://esm.sh/@reown/appkit@1.8.20/networks";

const LUST_CHAIN_ID_DECIMAL = 6923;
const LUST_CHAIN_ID_HEX = "0x1b0b";
const LUST_REOWN_PROJECT_ID = "abda6475ac4aba59197da882facababc";

const lustNetwork = defineChain({
  id: LUST_CHAIN_ID_DECIMAL,
  caipNetworkId: "eip155:6923",
  chainNamespace: "eip155",
  name: "LUST Chain",
  nativeCurrency: { decimals: 18, name: "LST", symbol: "LST" },
  rpcUrls: {
    default: { http: ["https://rpc.lustchain.org"] },
    public: { http: ["https://rpc.lustchain.org"] }
  },
  blockExplorers: {
    default: { name: "LUST Explorer", url: "https://explorer.lustchain.org" }
  }
});

const ethereumNetwork = defineChain({
  id: 1,
  caipNetworkId: "eip155:1",
  chainNamespace: "eip155",
  name: "Ethereum",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: {
    default: { http: ["https://ethereum-rpc.publicnode.com"] },
    public: { http: ["https://ethereum-rpc.publicnode.com"] }
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://etherscan.io" }
  }
});

const polygonNetwork = defineChain({
  id: 137,
  caipNetworkId: "eip155:137",
  chainNamespace: "eip155",
  name: "Polygon",
  nativeCurrency: { decimals: 18, name: "POL", symbol: "POL" },
  rpcUrls: {
    default: { http: ["https://polygon-rpc.com"] },
    public: { http: ["https://polygon-rpc.com"] }
  },
  blockExplorers: {
    default: { name: "PolygonScan", url: "https://polygonscan.com" }
  }
});

const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [lustNetwork, ethereumNetwork, polygonNetwork],
  defaultNetwork: lustNetwork,
  defaultAccountTypes: { eip155: "eoa" },
  projectId: LUST_REOWN_PROJECT_ID,
  metadata: {
    name: "LUST Platform",
    description: "Official LUST Chain platform",
    url: window.location.origin,
    icons: [`${window.location.origin}/icon.png`]
  },
  customRpcUrls: {
    "eip155:6923": [{ url: "https://rpc.lustchain.org" }],
    "eip155:1": [{ url: "https://ethereum-rpc.publicnode.com" }],
    "eip155:137": [{ url: "https://polygon-rpc.com" }]
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#f70375",
    "--w3m-border-radius-master": "12px"
  },
  allWallets: "SHOW",
  enableWallets: true,
  enableWalletGuide: true,
  enableNetworkSwitch: true,
  enableReconnect: true,
  enableMobileFullScreen: true,
  allowUnsupportedChain: true,
  enableCoinbase: true,
  coinbasePreference: "eoaOnly",
  features: {
    analytics: true,
    email: false,
    socials: false,
    swaps: false,
    onramp: false,
    connectMethodsOrder: ["wallet"]
  }
});

window.lustAppKit = appKit;

let walletState = { address: "", chainId: "", connected: false };

function normalizeChainId(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) return `0x${value.toString(16)}`;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return "";
  if (raw.startsWith("0x")) return raw;
  if (raw.startsWith("eip155:")) {
    const parsed = Number(raw.replace("eip155:", ""));
    return Number.isFinite(parsed) ? `0x${parsed.toString(16)}` : "";
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? `0x${parsed.toString(16)}` : raw;
}

function shortAddress(address) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect wallet";
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

function connectedHtml() {
  const ready = normalizeChainId(walletState.chainId) === LUST_CHAIN_ID_HEX;
  return `
    <div class="connect-icon ${ready ? "ready" : "warn"}">${ready ? "✓" : "!"}</div>
    <div class="connect-copy">
      <strong>${shortAddress(walletState.address)}</strong>
      <span>${ready ? "LUST CHAIN · LST" : "SWITCH TO LUST CHAIN"}</span>
    </div>
    <div class="connect-caret">⌄</div>
  `;
}

function renderWalletButton() {
  document.querySelectorAll("[data-connect-wallet]").forEach((btn) => {
    btn.innerHTML = walletState.connected && walletState.address ? connectedHtml() : disconnectedHtml();
  });
}

function readState() {
  try {
    const address = appKit.getAddress?.() || "";
    const chainId = normalizeChainId(appKit.getChainId?.() || "");
    const connected = Boolean(appKit.getIsConnected?.() || address);
    walletState = { address, chainId, connected };
  } catch (err) {
    console.warn(err);
  }
  renderWalletButton();
}

async function switchToLust() {
  try {
    await appKit.switchNetwork(lustNetwork);
  } catch (err) {
    console.warn("Switch rejected or failed", err);
  }
  setTimeout(readState, 350);
  setTimeout(readState, 1200);
}

async function openLustWallet(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();

  readState();

  try {
    if (walletState.connected && walletState.address) {
      await appKit.open({ view: "Account" });
    } else {
      await appKit.open({ view: "Connect", namespace: "eip155" });
    }
  } catch (err) {
    console.error(err);
  }

  setTimeout(readState, 400);
  setTimeout(readState, 1200);
  setTimeout(readState, 2500);
}

window.openLustWallet = openLustWallet;

appKit.subscribeProvider?.((state) => {
  walletState = {
    address: state?.address || appKit.getAddress?.() || "",
    chainId: normalizeChainId(state?.chainId || appKit.getChainId?.() || ""),
    connected: Boolean(state?.isConnected || state?.address || appKit.getIsConnected?.())
  };
  renderWalletButton();

  if (walletState.connected && walletState.address && normalizeChainId(walletState.chainId) !== LUST_CHAIN_ID_HEX) {
    setTimeout(switchToLust, 350);
  }
});

appKit.subscribeState?.(() => {
  setTimeout(readState, 100);
  setTimeout(readState, 900);
});

appKit.subscribeEvents?.(() => {
  setTimeout(readState, 120);
  setTimeout(readState, 900);
});

document.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-connect-wallet]");
  if (btn) openLustWallet(event);
});

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

document.querySelector("#bridgeAmount")?.addEventListener("input", bridgeCalc);
bridgeCalc();

document.querySelectorAll("[data-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    const mode = tab.getAttribute("data-tab");
    const route = document.querySelector("#bridgeRoute");

    if (route) {
      route.textContent = mode === "buy"
        ? "Polygon/BSC → LUST Chain"
        : "LUST Chain → Polygon/BSC";
    }
  });
});

renderWalletButton();
readState();
setTimeout(readState, 900);
setTimeout(readState, 2500);


// Back to top button
const backToTopButton = document.querySelector("#backToTop");

function syncBackToTopButton() {
  if (!backToTopButton) return;
  if (window.scrollY > 360) {
    backToTopButton.classList.add("show");
  } else {
    backToTopButton.classList.remove("show");
  }
}

backToTopButton?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("scroll", syncBackToTopButton, { passive: true });
syncBackToTopButton();

// LUST miner registration + mining page helpers v20260610-miner-launch-v1
const LUST_REGISTRY_ADDRESS = "0x0000000000000000000000000000000000006923";
const LUST_REGISTER_DATA = "0x4c5143525f5631";
const LUST_RPC_URL = "https://rpc.lustchain.org";
const LUST_EXPLORER_URL = "https://explorer.lustchain.org";
const LUST_SNAPSHOT_INFO_URL = "https://snapshot.lustchain.org/snapshot/snapshot-info.json";
const LUST_FAUCET_STATUS_URL = "https://downloads.lustchain.org/faucet/status";
const LUST_FAUCET_CLAIM_URL = "https://downloads.lustchain.org/faucet/claim";

function setMinerLog(message, tone = "") {
  document.querySelectorAll("[data-miner-log]").forEach((el) => {
    el.textContent = message;
    el.dataset.tone = tone;
  });
}

function setText(selector, text) {
  document.querySelectorAll(selector).forEach((el) => { el.textContent = text; });
}

function getInjectedEthereum() {
  return window.ethereum || null;
}

function localRegistrationKey(address) {
  return `lustMinerRegistered:${String(address || "").toLowerCase()}`;
}

async function lustRpc(method, params = []) {
  const res = await fetch(LUST_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "RPC error");
  return json.result;
}

function weiHexToLst(hexValue) {
  try {
    const raw = BigInt(hexValue || "0x0");
    const whole = raw / 1000000000000000000n;
    const frac = raw % 1000000000000000000n;
    return `${whole}.${frac.toString().padStart(18, "0").slice(0, 6)} LST`;
  } catch (_) {
    return "--";
  }
}

async function addLustChainToWallet() {
  const eth = getInjectedEthereum();
  if (!eth) {
    setMinerLog("MetaMask or an injected wallet was not found. Install MetaMask and try again.", "warn");
    return false;
  }

  try {
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: LUST_CHAIN_ID_HEX,
        chainName: "LUST Chain",
        nativeCurrency: { name: "LST", symbol: "LST", decimals: 18 },
        rpcUrls: ["https://rpc.lustchain.org"],
        blockExplorerUrls: ["https://explorer.lustchain.org"]
      }]
    });
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: LUST_CHAIN_ID_HEX }] });
    setMinerLog("LUST Chain is selected in your wallet.", "ok");
    setTimeout(readState, 300);
    setTimeout(updateMinerPage, 700);
    return true;
  } catch (err) {
    console.error(err);
    setMinerLog(err?.message || "Could not add/switch to LUST Chain.", "warn");
    return false;
  }
}

async function getWalletAccount() {
  const eth = getInjectedEthereum();
  if (!eth) throw new Error("MetaMask or injected wallet not found.");
  const accounts = await eth.request({ method: "eth_requestAccounts" });
  const account = accounts?.[0] || "";
  if (!account) throw new Error("No wallet account selected.");
  return account;
}

async function waitForTxReceipt(txHash, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const receipt = await lustRpc("eth_getTransactionReceipt", [txHash]).catch(() => null);
    if (receipt) return receipt;
    await new Promise((resolve) => setTimeout(resolve, 3500));
  }
  return null;
}

async function registerMinerWallet() {
  try {
    setMinerLog("Opening wallet confirmation for miner registration...", "");
    const eth = getInjectedEthereum();
    if (!eth) throw new Error("MetaMask or injected wallet not found.");

    const account = await getWalletAccount();
    await addLustChainToWallet();

    const chainId = normalizeChainId(await eth.request({ method: "eth_chainId" }));
    if (chainId !== LUST_CHAIN_ID_HEX) {
      throw new Error("Please switch to LUST Chain before registering.");
    }

    const txHash = await eth.request({
      method: "eth_sendTransaction",
      params: [{
        from: account,
        to: LUST_REGISTRY_ADDRESS,
        value: "0x0",
        data: LUST_REGISTER_DATA
      }]
    });

    setMinerLog(`Registration sent. Waiting confirmation: ${txHash}`, "");
    const receipt = await waitForTxReceipt(txHash);

    if (receipt?.status === "0x1") {
      localStorage.setItem(localRegistrationKey(account), JSON.stringify({ txHash, time: Date.now() }));
      setMinerLog(`Miner wallet registered successfully. Tx: ${txHash}`, "ok");
    } else if (receipt) {
      setMinerLog(`Registration transaction failed. Tx: ${txHash}`, "warn");
    } else {
      setMinerLog(`Transaction sent but confirmation is still pending. Check explorer: ${txHash}`, "warn");
    }

    updateMinerPage();
  } catch (err) {
    console.error(err);
    setMinerLog(err?.message || "Registration rejected or failed.", "warn");
  }
}

async function updateMinerPage() {
  const hasMinerPage = document.querySelector("[data-registration-state]") || document.querySelector("[data-snapshot-block]");
  if (!hasMinerPage) return;

  readState();
  const address = walletState.address || "";
  const chain = normalizeChainId(walletState.chainId || "");
  setText("[data-connected-address]", address ? shortAddress(address) : "Not connected");
  setText("[data-chain-state]", chain === LUST_CHAIN_ID_HEX ? "LUST Chain" : (address ? "Wrong network" : "Not connected"));

  if (address) {
    try {
      const bal = await lustRpc("eth_getBalance", [address, "latest"]);
      setText("[data-lust-balance]", weiHexToLst(bal));
    } catch (_) {
      setText("[data-lust-balance]", "--");
    }

    const saved = localStorage.getItem(localRegistrationKey(address));
    if (saved) {
      const parsed = JSON.parse(saved);
      setText("[data-registration-state]", `Saved tx ${shortAddress(parsed.txHash || "")}`);
    } else {
      setText("[data-registration-state]", "Ready to register");
    }
  } else {
    setText("[data-lust-balance]", "--");
    setText("[data-registration-state]", "Connect wallet first");
  }

  try {
    const snap = await fetch(LUST_SNAPSHOT_INFO_URL, { cache: "no-store" }).then((r) => r.json());
    if (snap?.block) setText("[data-snapshot-block]", String(snap.block));
    if (snap?.sha256) setText("[data-snapshot-sha]", snap.sha256);
  } catch (_) {
    // HTTP snapshot info may be blocked by HTTPS pages until final HTTPS snapshot domain is live.
  }
}


function setFaucetLog(message, tone = "") {
  document.querySelectorAll("[data-faucet-log]").forEach((el) => {
    el.textContent = message;
    el.dataset.tone = tone;
  });
}

async function updateFaucetPanel() {
  const hasFaucet = document.querySelector("[data-faucet-eligibility]") || document.querySelector("[data-faucet-balance]");
  if (!hasFaucet) return;

  const address = walletState.address || "";
  const url = address ? `${LUST_FAUCET_STATUS_URL}?address=${encodeURIComponent(address)}` : LUST_FAUCET_STATUS_URL;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();

    if (!json.ok) throw new Error(json.message || "Faucet status failed");

    setText("[data-faucet-amount]", `${json.amountLST || "0.01"} LST`);
    setText("[data-faucet-balance]", `${json.faucetBalanceLST || "--"} LST`);
    setText("[data-faucet-wallet-balance]", json.walletBalanceLST ? `${json.walletBalanceLST} LST` : "Connect wallet");
    setText("[data-faucet-eligibility]", json.eligible ? "Eligible" : (json.reason || "Not eligible"));

    if (!address) {
      setFaucetLog("Connect your wallet to check faucet eligibility.", "");
    } else if (json.eligible) {
      setFaucetLog("Your wallet can claim 0.01 LST for miner registration gas.", "ok");
    } else {
      setFaucetLog(json.reason || "This wallet is not eligible for the faucet.", "warn");
    }
  } catch (err) {
    console.error(err);
    setFaucetLog(err?.message || "Could not read faucet status.", "warn");
  }
}

async function claimLustFaucet() {
  try {
    const eth = getInjectedEthereum();
    if (!eth) throw new Error("MetaMask or injected wallet not found.");

    setFaucetLog("Checking wallet and faucet eligibility...", "");
    const account = await getWalletAccount();
    await addLustChainToWallet();

    const res = await fetch(LUST_FAUCET_CLAIM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: account })
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      throw new Error(json.message || json.reason || "Faucet claim failed.");
    }

    setFaucetLog(`Faucet sent ${json.amountLST || "0.01"} LST. Tx: ${json.txHash}`, "ok");
    setTimeout(updateFaucetPanel, 2500);
    setTimeout(updateMinerPage, 3500);
  } catch (err) {
    console.error(err);
    setFaucetLog(err?.message || "Faucet claim rejected or failed.", "warn");
  }
}

window.addLustChainToWallet = addLustChainToWallet;
window.registerMinerWallet = registerMinerWallet;
window.updateMinerPage = updateMinerPage;
window.updateFaucetPanel = updateFaucetPanel;
window.claimLustFaucet = claimLustFaucet;

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-add-lust-chain]")) {
    event.preventDefault();
    addLustChainToWallet();
  }
  if (event.target.closest("[data-register-miner]")) {
    event.preventDefault();
    registerMinerWallet();
  }
  if (event.target.closest("[data-refresh-miner]")) {
    event.preventDefault();
    updateMinerPage();
    updateFaucetPanel();
  }
  if (event.target.closest("[data-claim-faucet]")) {
    event.preventDefault();
    claimLustFaucet();
  }
  if (event.target.closest("[data-refresh-faucet]")) {
    event.preventDefault();
    updateFaucetPanel();
  }
});

setTimeout(updateMinerPage, 800);
setTimeout(updateFaucetPanel, 1200);
setInterval(updateMinerPage, 15000);
setInterval(updateFaucetPanel, 20000);
