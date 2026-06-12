import { createAppKit } from "https://esm.sh/@reown/appkit@1.8.20";
import { EthersAdapter } from "https://esm.sh/@reown/appkit-adapter-ethers@1.8.20";
import { defineChain } from "https://esm.sh/@reown/appkit@1.8.20/networks";
import { ethers } from "https://esm.sh/ethers@6.16.0";

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


const bscNetwork = defineChain({
  id: 56,
  caipNetworkId: "eip155:56",
  chainNamespace: "eip155",
  name: "BNB Smart Chain",
  nativeCurrency: { decimals: 18, name: "BNB", symbol: "BNB" },
  rpcUrls: {
    default: { http: ["https://bsc-rpc.publicnode.com"] },
    public: { http: ["https://bsc-rpc.publicnode.com"] }
  },
  blockExplorers: {
    default: { name: "BscScan", url: "https://bscscan.com" }
  }
});

const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [lustNetwork, ethereumNetwork, polygonNetwork, bscNetwork],
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
    "eip155:137": [{ url: "https://polygon-bor-rpc.publicnode.com" }],
    "eip155:56": [{ url: "https://bsc-rpc.publicnode.com" }]
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
  const normalized = normalizeChainId(walletState.chainId);
  const isBridgePage = Boolean(document.querySelector("[data-lusdt-bridge]"));
  const allowedBridgeChains = new Set([LUST_CHAIN_ID_HEX, "0x89", "0x38"]);
  const ready = isBridgePage ? allowedBridgeChains.has(normalized) : normalized === LUST_CHAIN_ID_HEX;
  const label = normalized === LUST_CHAIN_ID_HEX ? "LUST CHAIN · LST"
    : normalized === "0x89" ? "POLYGON · USDT"
    : normalized === "0x38" ? "BSC · USDT"
    : isBridgePage ? "SELECT BRIDGE NETWORK" : "SWITCH TO LUST CHAIN";
  return `
    <div class="connect-icon ${ready ? "ready" : "warn"}">${ready ? "✓" : "!"}</div>
    <div class="connect-copy">
      <strong>${shortAddress(walletState.address)}</strong>
      <span>${label}</span>
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

  const isBridgePage = Boolean(document.querySelector("[data-lusdt-bridge]"));
  if (!isBridgePage && walletState.connected && walletState.address && normalizeChainId(walletState.chainId) !== LUST_CHAIN_ID_HEX) {
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

// LUST miner registration + mining page helpers v20260611-txfeed-v3-final
const LUST_REGISTRY_ADDRESS = "0x0000000000000000000000000000000000006923";
const LUST_REGISTER_DATA = "0x4c5143525f5631";
const LUST_RPC_URL = "https://rpc.lustchain.org";
const LUST_EXPLORER_URL = "https://explorer.lustchain.org";
const LUST_SNAPSHOT_INFO_URL = "https://snapshot.lustchain.org/snapshot/snapshot-info.json";
const LUST_FAUCET_STATUS_URL = "https://downloads.lustchain.org/faucet/status";
const LUST_FAUCET_CLAIM_URL = "https://downloads.lustchain.org/faucet/claim";
const LUST_MINING_STATS_URL = "https://rpc.lustchain.org/mining-stats";
const LUST_PENDING_RAW_URL = "https://rpc.lustchain.org/pending-raw";

function setMinerLog(message, tone = "") {
  document.querySelectorAll("[data-miner-log]").forEach((el) => {
    el.textContent = message;
    el.dataset.tone = tone;
  });
}

function setText(selector, text) {
  document.querySelectorAll(selector).forEach((el) => { el.textContent = text; });
}

function setMiningStatsLog(message, tone = "") {
  document.querySelectorAll("[data-mining-stats-log]").forEach((el) => {
    el.textContent = message;
    el.dataset.tone = tone;
  });
}

function fmtNumber(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("en-US").format(n);
}

function fmtAddress(value) {
  return value ? shortAddress(value) : "--";
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
    await new Promise((resolve) => setTimeout(resolve, 2500));
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



function fetchJsonp(url, timeoutMs = 9000) {
  return new Promise((resolve, reject) => {
    const cb = `__lustJsonp_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement("script");
    const sep = url.includes("?") ? "&" : "?";
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Mining stats JSONP timeout"));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      try { delete window[cb]; } catch (_) { window[cb] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[cb] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Mining stats JSONP failed"));
    };

    script.src = `${url}${sep}callback=${encodeURIComponent(cb)}&t=${Date.now()}`;
    document.head.appendChild(script);
  });
}

async function fetchMiningStatsLive() {
  const ts = Date.now();
  try {
    const res = await fetch(`${LUST_MINING_STATS_URL}?t=${ts}`, { cache: "no-store", mode: "cors" });
    if (!res.ok) throw new Error(`Mining stats HTTP ${res.status}`);
    return await res.json();
  } catch (fetchErr) {
    console.warn("Mining stats fetch failed, trying JSONP fallback", fetchErr);
    return await fetchJsonp("https://rpc.lustchain.org/mining-stats.js");
  }
}

async function updateMiningStatsPanel() {
  const hasPanel = document.querySelector("[data-mining-registered]") || document.querySelector("[data-mining-pending]");
  if (!hasPanel) return;

  try {
    const ts = Date.now();
    const [statsRes, feedRes] = await Promise.allSettled([
      fetchMiningStatsLive(),
      fetch(`${LUST_PENDING_RAW_URL}?t=${ts}`, { cache: "no-store", mode: "cors" }).then((r) => {
        if (!r.ok) throw new Error(`TX-FEED HTTP ${r.status}`);
        return r.json();
      })
    ]);

    const stats = statsRes.status === "fulfilled" ? statsRes.value : null;
    const feed = feedRes.status === "fulfilled" ? feedRes.value : null;

    if (!stats || stats.ok === false) throw new Error(stats?.error || statsRes.reason?.message || "Mining stats API unavailable");

    setText("[data-mining-registered]", fmtNumber(stats.registeredMiners));
    setText("[data-mining-active]", fmtNumber(stats.activePublicMinersLast200));
    setText("[data-mining-public-blocks]", fmtNumber(stats.publicBlocksLast200));
    setText("[data-mining-official-blocks]", fmtNumber(stats.officialBlocksLast200));
    setText("[data-mining-last-public]", fmtAddress(stats.lastPublicMiner));

    const lastPublicBlock = stats.lastPublicMinerBlock ? `Last public block: ${fmtNumber(stats.lastPublicMinerBlock)}` : "Indexer is still scanning public blocks...";
    setText("[data-mining-last-public-block]", lastPublicBlock);

    if (feed && feed.ok !== false) {
      setText("[data-mining-pending]", fmtNumber(feed.count || 0));
    } else if (stats.pendingTxCount !== undefined) {
      setText("[data-mining-pending]", fmtNumber(stats.pendingTxCount));
    } else {
      setText("[data-mining-pending]", "0");
    }

    const head = Number(stats.head || 0);
    const scannedTo = Number(stats.scannedTo || 0);
    const pct = head > 0 ? Math.min(100, Math.max(0, (scannedTo / head) * 100)) : 0;
    const progress = stats.scanComplete
      ? "Registry scan complete"
      : `Registry scan ${pct.toFixed(1)}% · scanned ${fmtNumber(scannedTo)} / ${fmtNumber(head)} blocks`;
    setText("[data-mining-scan-progress]", progress);

    const updated = stats.updatedAt ? new Date(stats.updatedAt).toLocaleString() : "now";
    const tone = stats.scanComplete ? "ok" : "warn";
    setMiningStatsLog(`${progress} · updated ${updated} · registration txs: ${fmtNumber(stats.registrationTxs || 0)} · TX-FEED V3 active`, tone);
  } catch (err) {
    console.error(err);
    setText("[data-mining-registered]", "--");
    setText("[data-mining-active]", "--");
    setText("[data-mining-public-blocks]", "--");
    setText("[data-mining-official-blocks]", "--");
    setText("[data-mining-last-public]", "--");
    setText("[data-mining-pending]", "--");
    setText("[data-mining-scan-progress]", "Mining stats API unavailable");
    setMiningStatsLog(`${err?.message || "Could not load live mining stats."} · Open the API button below; if it opens, refresh with Ctrl+F5.`, "warn");
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
window.updateMiningStatsPanel = updateMiningStatsPanel;
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
    updateMiningStatsPanel();
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
setTimeout(updateMiningStatsPanel, 1500);
setInterval(updateMinerPage, 15000);
setInterval(updateFaucetPanel, 20000);
setInterval(updateMiningStatsPanel, 15000);


// LUSDT Bridge app v20260612-lusdt-bridge-v3-cors-bsc
const LUSDT_BRIDGE_API_URL = "https://lusdt-bridge.lustchain.org";
const LUSDT_BRIDGE_API_BACKUP_URLS = ["https://lusdt-bridge.lustchain.org"];
const LUSDT_TOKEN_ADDRESS = "0x1E8636066d7e86De0A8Bd6Acb1e54BE129aC19AE";
const LUSDT_EXECUTOR_ADDRESS = "0xbBC818f161D1B7190f85bE258CDB568a5A63f380";
const LUSDT_POLYGON_LOCKBOX = "0x273cC6A72aF97381daa07332Df768a05cb30CE47";
const LUSDT_BSC_LOCKBOX = "0x273cC6A72aF97381daa07332Df768a05cb30CE47";
const POLYGON_USDT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
const BSC_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const BRIDGE_FEE_BPS = 20n;

const BRIDGE_CHAINS = {
  lust: {
    key: "lust",
    chainId: 6923,
    chainIdHex: "0x1b0b",
    name: "LUST Chain",
    nativeCurrency: { name: "LST", symbol: "LST", decimals: 18 },
    rpcUrls: ["https://rpc.lustchain.org"],
    blockExplorerUrls: ["https://explorer.lustchain.org"]
  },
  polygon: {
    key: "polygon",
    chainId: 137,
    chainIdHex: "0x89",
    name: "Polygon",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: ["https://polygon-bor-rpc.publicnode.com"],
    blockExplorerUrls: ["https://polygonscan.com"]
  },
  bsc: {
    key: "bsc",
    chainId: 56,
    chainIdHex: "0x38",
    name: "BNB Smart Chain",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://bsc-rpc.publicnode.com"],
    blockExplorerUrls: ["https://bscscan.com"]
  }
};

const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)"
];

const LOCKBOX_POLYGON_ABI = [
  "function depositsEnabled() view returns (bool)",
  "function usedNonce(address,uint256) view returns (bool)",
  "function deposit(uint256 amount)",
  "function release(address recipient,uint256 amount,uint256 nonce,uint256 deadline,bytes[] signatures)",
  "event Deposited(address indexed user,uint256 amount,bytes32 indexed depositId,uint256 indexed sourceChainId,uint256 destinationChainId)"
];

const LOCKBOX_BSC_ABI = [
  "function depositsEnabled() view returns (bool)",
  "function usedNonce(address,uint256) view returns (bool)",
  "function deposit(uint256 rawAmount18)",
  "function release(address recipient,uint256 amount6,uint256 nonce,uint256 deadline,bytes[] signatures)",
  "event Deposited(address indexed user,uint256 rawAmount18,uint256 normalizedAmount6,bytes32 indexed depositId,uint256 indexed sourceChainId,uint256 destinationChainId)"
];

const EXECUTOR_ABI = [
  "function mintFromExternalDeposit(address recipient,uint256 amount,bytes32 depositId,uint256 sourceChainId,uint256 deadline,bytes[] signatures)",
  "function burnForExternalRelease(address recipientExternal,uint256 amount,uint256 destinationChainId,uint256 nonce,uint256 deadline)",
  "function quoteNetAmount(uint256 amount) view returns (uint256 fee,uint256 net)",
  "function mintIdUsed(bytes32 depositId) view returns (bool)",
  "event BurnRequested(address indexed burner,address indexed recipientExternal,uint256 grossAmount,uint256 netAmount,uint256 feeAmount,uint256 nonce,uint256 indexed destinationChainId,uint256 sourceChainId)"
];

let activeClaim = null;
let activeRelease = null;
let pendingBridgeClaims = [];
let pendingBridgeReleases = [];
let bridgeLiquidity = { polygon: null, bsc: null };

function bridgeLog(message, tone = "") {
  document.querySelectorAll("[data-bridge-log]").forEach((el) => {
    el.textContent = message;
    el.dataset.tone = tone;
  });
}

function setLiquidityStatus(selector, message, tone = "") {
  document.querySelectorAll(selector).forEach((el) => {
    el.textContent = message;
    el.classList.remove("ok", "warn", "bad", "info");
    if (tone) el.classList.add(tone);
  });
}

function amount6ToDestinationUnits(amount6, destination) {
  const raw = BigInt(amount6 || 0);
  return destination === "bsc" ? raw * 1000000000000n : raw;
}

async function fetchLockboxLiquidity(kind) {
  const tokenCfg = sourceToken(kind);
  const chain = bridgeChainFor(kind);
  const provider = new ethers.JsonRpcProvider(chain.rpcUrls[0]);
  const token = new ethers.Contract(tokenCfg.address, ERC20_ABI, provider);
  const balance = await token.balanceOf(tokenCfg.lockbox);
  return { kind, balance, decimals: tokenCfg.decimals };
}

function describeLiquidity(kind, balance) {
  const decimals = kind === "bsc" ? 18 : 6;
  const formatted = formatUnitsSafe(balance, decimals, 6);
  const numeric = Number(ethers.formatUnits(balance, decimals));
  const tone = numeric <= 0 ? "bad" : numeric < 100 ? "warn" : "ok";
  const message = numeric <= 0
    ? "No USDT currently available for releases on this network."
    : numeric < 100
      ? `Low available reserve on ${kind.toUpperCase()}. Large withdrawals may fail until more USDT is added.`
      : `Reserve available on ${kind.toUpperCase()} for normal bridge releases.`;
  return { formatted: `${formatted} USDT`, tone, message };
}

function updateDestinationLiquidityNotice() {
  const destination = selectedDestination();
  const amountText = document.querySelector("[data-withdraw-amount]")?.value || "0";
  const q = bridgeQuote(amountText);
  const liq = bridgeLiquidity[destination];
  if (!liq) {
    setText("[data-bridge-destination-balance]", "Loading...");
    setText("[data-bridge-destination-liquidity-status]", "Checking...");
    setLiquidityStatus("[data-bridge-destination-warning]", "Checking destination reserve before burn...", "info");
    return;
  }
  const desc = describeLiquidity(destination, liq.balance);
  const enough = liq.balance >= amount6ToDestinationUnits(q.net, destination);
  setText("[data-bridge-destination-balance]", desc.formatted);
  setText("[data-bridge-destination-liquidity-status]", enough ? "Enough available" : "Insufficient now");
  setLiquidityStatus(
    "[data-bridge-destination-warning]",
    enough
      ? `Destination reserve looks sufficient for about ${formatUnitsSafe(q.net)} USDT net.`
      : `Warning: destination reserve is below the current net amount (${formatUnitsSafe(q.net)} USDT). Burning now may leave the release waiting until more USDT is added.`,
    enough ? "ok" : "bad"
  );
}

async function refreshBridgeLiquidity() {
  if (!document.querySelector("[data-lusdt-bridge]")) return;
  try {
    const [polygon, bsc] = await Promise.all([
      fetchLockboxLiquidity("polygon"),
      fetchLockboxLiquidity("bsc")
    ]);
    bridgeLiquidity = { polygon, bsc };

    const p = describeLiquidity("polygon", polygon.balance);
    const b = describeLiquidity("bsc", bsc.balance);

    setText("[data-liquidity-polygon]", p.formatted);
    setText("[data-liquidity-bsc]", b.formatted);
    setLiquidityStatus("[data-liquidity-polygon-status]", p.message, p.tone);
    setLiquidityStatus("[data-liquidity-bsc-status]", b.message, b.tone);
    setText("[data-liquidity-route]", `${p.formatted} / ${b.formatted}`);
    updateDestinationLiquidityNotice();
  } catch (err) {
    console.warn(err);
    setText("[data-liquidity-polygon]", "Unavailable");
    setText("[data-liquidity-bsc]", "Unavailable");
    setText("[data-liquidity-route]", "Refresh needed");
    setLiquidityStatus("[data-liquidity-polygon-status]", "Could not read Polygon reserve right now.", "warn");
    setLiquidityStatus("[data-liquidity-bsc-status]", "Could not read BSC reserve right now.", "warn");
    setLiquidityStatus("[data-bridge-destination-warning]", "Could not verify destination liquidity right now. Try refresh before burning.", "warn");
  }
}

function bridgeShort(value) {
  return value ? `${String(value).slice(0, 6)}...${String(value).slice(-4)}` : "--";
}

function formatUnitsSafe(value, decimals = 6, precision = 6) {
  try {
    const text = ethers.formatUnits(BigInt(value), decimals);
    const [a, b = ""] = text.split(".");
    return `${a}.${b.padEnd(precision, "0").slice(0, precision)}`;
  } catch (_) {
    return "0.000000";
  }
}

function parseAmount(value, decimals) {
  const raw = String(value || "0").trim();
  if (!raw || Number(raw) <= 0) throw new Error("Enter a valid amount.");
  return ethers.parseUnits(raw, decimals);
}

function bridgeQuote(amountText) {
  let amount = 0n;
  try { amount = ethers.parseUnits(String(amountText || "0"), 6); } catch (_) { amount = 0n; }
  const fee = amount * BRIDGE_FEE_BPS / 10000n;
  const net = amount > fee ? amount - fee : 0n;
  return { amount, fee, net };
}

function selectedSource() {
  return document.querySelector("[data-bridge-source]")?.value || "polygon";
}

function selectedDestination() {
  return document.querySelector("[data-bridge-destination]")?.value || "polygon";
}

function bridgeChainFor(kind) {
  return kind === "bsc" ? BRIDGE_CHAINS.bsc : BRIDGE_CHAINS.polygon;
}

function sourceToken(kind) {
  return kind === "bsc"
    ? { address: BSC_USDT_ADDRESS, decimals: 18, lockbox: LUSDT_BSC_LOCKBOX, lockboxAbi: LOCKBOX_BSC_ABI, chainId: 56 }
    : { address: POLYGON_USDT_ADDRESS, decimals: 6, lockbox: LUSDT_POLYGON_LOCKBOX, lockboxAbi: LOCKBOX_POLYGON_ABI, chainId: 137 };
}

async function ensureWalletChain(kind) {
  const eth = getInjectedEthereum();
  if (!eth) throw new Error("MetaMask or injected wallet not found.");
  const chain = typeof kind === "string" ? BRIDGE_CHAINS[kind] : kind;
  const current = normalizeChainId(await eth.request({ method: "eth_chainId" }));
  if (current === chain.chainIdHex) return;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chain.chainIdHex }] });
  } catch (err) {
    if (err?.code === 4902 || String(err?.message || "").includes("Unrecognized chain")) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: chain.chainIdHex,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: chain.rpcUrls,
          blockExplorerUrls: chain.blockExplorerUrls
        }]
      });
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chain.chainIdHex }] });
    } else {
      throw err;
    }
  }
  setTimeout(readState, 300);
}

async function browserSigner() {
  const eth = getInjectedEthereum();
  if (!eth) throw new Error("MetaMask or injected wallet not found.");
  await eth.request({ method: "eth_requestAccounts" });
  const provider = new ethers.BrowserProvider(eth);
  return provider.getSigner();
}

async function approveIfNeeded(tokenAddress, spender, amount, signer) {
  const owner = await signer.getAddress();
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const allowance = await token.allowance(owner, spender);
  if (allowance >= amount) return null;
  bridgeLog("Opening approval in your wallet...", "");
  const tx = await token.approve(spender, amount);
  bridgeLog(`Approval sent: ${tx.hash}. Waiting confirmation...`, "");
  await tx.wait();
  return tx.hash;
}

async function bridgeFetch(path) {
  let lastErr = null;
  const urls = [LUSDT_BRIDGE_API_URL, ...LUSDT_BRIDGE_API_BACKUP_URLS].filter(Boolean);
  for (const base of [...new Set(urls)]) {
    const url = `${base}${path}${path.includes("?") ? "&" : "?"}t=${Date.now()}`;
    try {
      const res = await fetch(url, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        headers: { accept: "application/json" }
      });
      if (!res.ok) throw new Error(`Bridge API ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("Bridge API unavailable");
}

function normalizeApiItems(data, field) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data[field])) return data[field];
  if (data[field] && typeof data[field] === "object") return Object.values(data[field]);
  if (data.status || data.depositId || data.burnId) return [data];
  if (data.claim && typeof data.claim === "object") return [data.claim];
  if (data.release && typeof data.release === "object") return [data.release];
  return [];
}

function sameAddress(a, b) {
  return String(a || "").toLowerCase() === String(b || "").toLowerCase();
}

function isLocallyMinted(depositId) {
  if (!depositId) return false;
  try {
    const used = JSON.parse(localStorage.getItem("lustMintedDepositIds") || "[]");
    return used.map((x) => String(x).toLowerCase()).includes(String(depositId).toLowerCase());
  } catch (_) {
    return false;
  }
}

function markLocallyMinted(depositId) {
  if (!depositId) return;
  try {
    const used = JSON.parse(localStorage.getItem("lustMintedDepositIds") || "[]");
    const set = new Set(used.map((x) => String(x).toLowerCase()));
    set.add(String(depositId).toLowerCase());
    localStorage.setItem("lustMintedDepositIds", JSON.stringify([...set].slice(-50)));
  } catch (_) {}
}

function bridgeEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function claimSourceLabel(claim) {
  const source = String(claim?.source || "").toLowerCase();
  const chainId = String(claim?.sourceChainId || "");
  if (source === "bsc" || chainId === "56") return "BSC";
  if (source === "polygon" || chainId === "137") return "Polygon";
  return source || `Chain ${chainId}`;
}

function renderPendingClaims(entries = []) {
  const box = document.querySelector("[data-bridge-pending-claims]");
  if (!box) return;

  if (!walletState.connected) {
    box.innerHTML = `<div class="claim-item muted">Connect wallet and click Find / Refresh claims.</div>`;
    return;
  }

  if (!entries.length) {
    box.innerHTML = `<div class="claim-item muted">No claim found for this wallet yet.</div>`;
    return;
  }

  const pending = entries.filter((x) => !x.used);
  box.innerHTML = `
    <div class="claim-summary">${pending.length} pending / ${entries.length} total claims for this wallet</div>
    ${entries.map(({ claim, used }, idx) => {
      const selected = activeClaim?.depositId && String(activeClaim.depositId).toLowerCase() === String(claim.depositId).toLowerCase();
      return `
        <div class="claim-item ${used ? "is-used" : ""} ${selected ? "is-selected" : ""}">
          <div>
            <strong>${claimSourceLabel(claim)} · ${formatUnitsSafe(claim.amount)} LUSDT</strong>
            <small>${bridgeShort(claim.depositId)} · ${used ? "already minted" : "ready to mint"}</small>
          </div>
          ${used
            ? `<span class="claim-badge done">Minted</span>`
            : `<div class="claim-actions"><button class="mini-btn" type="button" data-bridge-select-claim="${idx}">Select</button><button class="claim-direct-btn" type="button" data-bridge-mint-direct="${idx}">Mint</button></div>`}
        </div>`;
    }).join("")}
  `;
}

async function loadClaimsForAccount(account) {
  const data = await bridgeFetch(`/api/claims/address/${account}`);
  const claims = normalizeApiItems(data, "claims")
    .filter((claim) => sameAddress(claim.recipient, account))
    .filter((claim) => claim.status === "ready")
    .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));

  const entries = [];
  for (const claim of claims) {
    const used = await isMintedOnChain(claim.depositId);
    entries.push({ claim, used });
  }
  pendingBridgeClaims = entries;
  renderPendingClaims(entries);
  return entries;
}

async function isMintedOnChain(depositId) {
  if (!depositId) return false;
  try {
    const provider = new ethers.JsonRpcProvider(BRIDGE_CHAINS.lust.rpcUrls[0]);
    const exec = new ethers.Contract(LUSDT_EXECUTOR_ADDRESS, EXECUTOR_ABI, provider);
    return Boolean(await exec.mintIdUsed(depositId));
  } catch (_) {
    return isLocallyMinted(depositId);
  }
}

async function prepareActiveClaim(claim, tone = "ok") {
  if (!claim) return false;
  if (await isMintedOnChain(claim.depositId)) {
    setText("[data-bridge-claim-state]", "Already minted");
    bridgeLog("This deposit was already minted. Use another ready claim or make a new deposit.", "warn");
    return false;
  }
  activeClaim = claim;
  const source = claim.source || (String(claim.sourceChainId) === "56" ? "bsc" : "polygon");
  setText("[data-bridge-claim-state]", `Ready · ${source} · ${formatUnitsSafe(claim.amount)} LUSDT`);
  document.querySelector("[data-bridge-mint]")?.removeAttribute("disabled");
  renderPendingClaims(pendingBridgeClaims);
  bridgeLog(`Claim ready. Switch to LUST Chain and click Mint LUSDT. Amount: ${formatUnitsSafe(claim.amount)} LUSDT.`, tone);
  return true;
}

async function findClaimByDepositId(depositId) {
  if (!depositId) return null;
  try {
    const data = await bridgeFetch(`/api/claim/${depositId}`);
    const claims = normalizeApiItems(data, "claims");
    const claim = claims[0] || data.claim || data;
    if (claim?.status === "ready") return claim;
  } catch (_) {}
  return null;
}

function updateBridgeQuote() {
  const depositAmount = document.querySelector("[data-bridge-amount]")?.value || "0";
  const withdrawAmount = document.querySelector("[data-withdraw-amount]")?.value || "0";

  const d = bridgeQuote(depositAmount);
  const w = bridgeQuote(withdrawAmount);

  setText("[data-bridge-fee]", `${formatUnitsSafe(d.fee)} LUSDT`);
  setText("[data-bridge-receive]", `${formatUnitsSafe(d.net)} LUSDT`);
  setText("[data-withdraw-fee]", `${formatUnitsSafe(w.fee)} LUSDT`);
  setText("[data-withdraw-receive]", `${formatUnitsSafe(w.net)} USDT`);
  updateDestinationLiquidityNotice();
}

function refreshBridgeUiLabels() {
  const source = selectedSource();
  const destination = selectedDestination();
  setHtml("[data-bridge-source-label]", source === "bsc"
    ? '<img class="chain-inline-logo" src="./assets/bsc-logo.png" alt="BSC">BSC'
    : '<img class="chain-inline-logo" src="./assets/polygon-logo.png" alt="Polygon">Polygon');
  setHtml("[data-bridge-destination-label]", destination === "bsc"
    ? '<img class="chain-inline-logo" src="./assets/bsc-logo.png" alt="BSC">BSC'
    : '<img class="chain-inline-logo" src="./assets/polygon-logo.png" alt="Polygon">Polygon');
  const activeTab = document.querySelector("[data-bridge-tab].active")?.getAttribute("data-bridge-tab") || "deposit";
  setText("[data-bridge-title-action]", activeTab === "withdraw" ? "Sell" : "Buy");
}

async function refreshBridgeStatus() {
  if (!document.querySelector("[data-lusdt-bridge]")) return;
  try {
    const [health, stats] = await Promise.all([
      bridgeFetch("/health"),
      bridgeFetch("/api/stats")
    ]);
    setText("[data-bridge-api-state]", health.ok ? "Online" : "Warning");
    setText("[data-bridge-threshold]", `${health.threshold || "2"} of ${health.validatorCount || "4"}`);
    setText("[data-bridge-deposits-state]", "Controlled launch");
    setText("[data-bridge-lusdt-short]", bridgeShort(stats?.config?.token?.address || LUSDT_TOKEN_ADDRESS));
    setText("[data-bridge-executor-short]", bridgeShort(stats?.config?.contracts?.lustExecutor || LUSDT_EXECUTOR_ADDRESS));
    setText("[data-bridge-fee-recipient]", bridgeShort(stats?.config?.fee?.recipient || ""));
    setText("[data-bridge-claims-count]", String(stats?.claims ?? 0));
    setText("[data-bridge-releases-count]", String(stats?.releases ?? 0));
    setText("[data-bridge-fee-percent]", `${Number(stats?.config?.fee?.feePercent ?? 0.2).toFixed(2)}%`);
    setText("[data-bridge-validator-summary]", `${health.threshold || "2"} / ${health.validatorCount || "4"}`);
    bridgeLog(`Bridge API online. Claims: ${stats.claims || 0}. Releases: ${stats.releases || 0}.`, "ok");
    refreshBridgeLiquidity().catch(() => {});
    if (walletState.connected && walletState.address && Number(stats.claims || 0) > 0) {
      findClaim({ silent: true }).catch(() => {});
    }
  } catch (err) {
    bridgeLog(`Bridge API blocked/offline: ${err.message}. Open https://lusdt-bridge.lustchain.org/health and refresh Ctrl+F5.`, "warn");
    setText("[data-bridge-api-state]", "API blocked");
  }
}

async function depositToLusdt() {
  try {
    const kind = selectedSource();
    const token = sourceToken(kind);
    const chain = bridgeChainFor(kind);
    const amount = parseAmount(document.querySelector("[data-bridge-amount]")?.value, token.decimals);

    await ensureWalletChain(chain);
    const signer = await browserSigner();
    await approveIfNeeded(token.address, token.lockbox, amount, signer);

    const lockbox = new ethers.Contract(token.lockbox, token.lockboxAbi, signer);
    bridgeLog(`Opening ${chain.name} deposit confirmation...`, "");
    const tx = await lockbox.deposit(amount);
    setText("[data-bridge-last-deposit]", bridgeShort(tx.hash));
    bridgeLog(`Deposit sent: ${tx.hash}. Waiting confirmation...`, "");
    const receipt = await tx.wait();

    let depositId = "";
    try {
      const iface = new ethers.Interface(token.lockboxAbi);
      for (const log of receipt.logs || []) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === "Deposited") depositId = parsed.args.depositId;
        } catch (_) {}
      }
    } catch (_) {}

    if (depositId) {
      localStorage.setItem("lustLastDepositId", depositId);
      setText("[data-bridge-claim-state]", "Waiting confirmations");
      bridgeLog(`Deposit confirmed. DepositId: ${depositId}. I will auto-check for the claim.`, "ok");
      autoFindClaimSoon();
    } else {
      bridgeLog("Deposit confirmed. I will auto-check for the claim.", "ok");
      autoFindClaimSoon();
    }
  } catch (err) {
    console.error(err);
    bridgeLog(err?.shortMessage || err?.message || "Deposit failed or rejected.", "warn");
  }
}


function releaseDestinationLabel(release) {
  const dest = String(release?.destination || "").toLowerCase();
  const chainId = String(release?.destinationChainId || "");
  if (dest === "bsc" || chainId === "56") return "BSC";
  if (dest === "polygon" || chainId === "137") return "Polygon";
  return dest || `Chain ${chainId}`;
}

function releaseDestinationKey(release) {
  const dest = String(release?.destination || "").toLowerCase();
  const chainId = String(release?.destinationChainId || "");
  if (dest === "bsc" || chainId === "56") return "bsc";
  return "polygon";
}

function renderPendingReleases(entries = []) {
  const box = document.querySelector("[data-bridge-pending-releases]");
  if (!box) return;

  if (!walletState.connected) {
    box.innerHTML = `<div class="claim-item muted">Connect wallet and click Find my release.</div>`;
    return;
  }

  if (!entries.length) {
    box.innerHTML = `<div class="claim-item muted">No release found for this wallet yet.</div>`;
    return;
  }

  const pending = entries.filter((x) => !x.used);
  box.innerHTML = `
    <div class="claim-summary">${pending.length} pending / ${entries.length} total releases for this wallet</div>
    ${entries.map(({ release, used }, idx) => {
      const selected = activeRelease?.burnId && String(activeRelease.burnId).toLowerCase() === String(release.burnId).toLowerCase();
      return `
        <div class="claim-item ${used ? "is-used" : ""} ${selected ? "is-selected" : ""}">
          <div>
            <strong>${releaseDestinationLabel(release)} · ${formatUnitsSafe(release.amount)} USDT</strong>
            <small>${bridgeShort(release.burnId)} · ${used ? "already released" : "ready to release"}</small>
          </div>
          ${used
            ? `<span class="claim-badge done">Released</span>`
            : `<div class="claim-actions"><button class="mini-btn" type="button" data-bridge-select-release="${idx}">Select</button><button class="claim-direct-btn" type="button" data-bridge-release-direct="${idx}">Release ${releaseDestinationLabel(release)}</button></div>`}
        </div>`;
    }).join("")}
  `;
}

async function isReleaseUsedOnChain(release) {
  if (!release || !release.recipient || release.nonce === undefined || release.nonce === null) return false;
  try {
    const destination = releaseDestinationKey(release);
    const chain = bridgeChainFor(destination);
    const lockboxAddress = destination === "bsc" ? LUSDT_BSC_LOCKBOX : LUSDT_POLYGON_LOCKBOX;
    const abi = destination === "bsc" ? LOCKBOX_BSC_ABI : LOCKBOX_POLYGON_ABI;
    const provider = new ethers.JsonRpcProvider(chain.rpcUrls[0]);
    const lockbox = new ethers.Contract(lockboxAddress, abi, provider);
    return Boolean(await lockbox.usedNonce(release.recipient, BigInt(release.nonce)));
  } catch (_) {
    return false;
  }
}

async function loadReleasesForAccount(account) {
  const data = await bridgeFetch(`/api/releases/address/${account}`);
  const releases = normalizeApiItems(data, "releases")
    .filter((release) => sameAddress(release.recipient, account))
    .filter((release) => release.status === "ready")
    .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));

  const entries = [];
  for (const release of releases) {
    const used = await isReleaseUsedOnChain(release);
    entries.push({ release, used });
  }
  pendingBridgeReleases = entries;
  renderPendingReleases(entries);
  return entries;
}

async function prepareActiveRelease(release, tone = "ok") {
  if (!release) return false;
  if (await isReleaseUsedOnChain(release)) {
    setText("[data-bridge-release-state]", "Already released");
    bridgeLog("This release was already used. Select another pending release.", "warn");
    return false;
  }
  activeRelease = release;
  const destination = releaseDestinationKey(release);
  setText("[data-bridge-release-state]", `Ready · ${destination} · ${formatUnitsSafe(release.amount)} USDT`);
  document.querySelector("[data-bridge-release]")?.removeAttribute("disabled");
  renderPendingReleases(pendingBridgeReleases);
  bridgeLog(`Release ready for ${destination}. Switch network and click Release USDT. Amount: ${formatUnitsSafe(release.amount)} USDT.`, tone);
  return true;
}

function chooseLatestReady(items, filterFn = () => true) {
  return (items || [])
    .filter(filterFn)
    .filter((x) => x.status === "ready")
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0] || null;
}

async function findClaim(options = {}) {
  try {
    const account = await getWalletAccount();
    if (!options.silent) bridgeLog("Searching claim signatures...", "");

    const entries = await loadClaimsForAccount(account);

    const lastDepositId = localStorage.getItem("lustLastDepositId") || "";
    if (lastDepositId) {
      const exact = entries.find(({ claim, used }) =>
        !used && String(claim.depositId).toLowerCase() === String(lastDepositId).toLowerCase()
      );
      if (exact) {
        await prepareActiveClaim(exact.claim, "ok");
        return exact.claim;
      }
    }

    const firstPending = entries.find(({ used }) => !used);
    if (firstPending) {
      await prepareActiveClaim(firstPending.claim, "ok");
      return firstPending.claim;
    }

    setText("[data-bridge-claim-state]", entries.length ? "All claims minted" : "Not ready yet");
    document.querySelector("[data-bridge-mint]")?.setAttribute("disabled", "disabled");
    if (!options.silent) {
      bridgeLog(
        entries.length
          ? "All ready claims for this wallet were already minted."
          : "No ready claim found yet. The bridge may still be waiting confirmations. Try again in a few seconds.",
        entries.length ? "ok" : "warn"
      );
    }
    return null;
  } catch (err) {
    console.error(err);
    if (!options.silent) bridgeLog(err?.message || "Could not find claim.", "warn");
    return null;
  }
}

async function autoFindClaimSoon() {
  const attempts = [6000, 12000, 20000, 35000, 55000, 80000];
  for (const ms of attempts) {
    setTimeout(() => findClaim({ silent: true }).catch(() => {}), ms);
  }
}

async function mintClaim() {
  try {
    if (!activeClaim) await findClaim();
    if (!activeClaim) return;
    await ensureWalletChain(BRIDGE_CHAINS.lust);
    const signer = await browserSigner();
    const exec = new ethers.Contract(LUSDT_EXECUTOR_ADDRESS, EXECUTOR_ABI, signer);
    bridgeLog("Opening LUST mint confirmation...", "");
    const tx = await exec.mintFromExternalDeposit(
      activeClaim.recipient,
      BigInt(activeClaim.amount),
      activeClaim.depositId,
      BigInt(activeClaim.sourceChainId),
      BigInt(activeClaim.deadline),
      activeClaim.signatures
    );
    bridgeLog(`Mint sent: ${tx.hash}. Waiting confirmation...`, "");
    await tx.wait();
    markLocallyMinted(activeClaim.depositId);
    bridgeLog(`LUSDT minted successfully. Tx: ${tx.hash}`, "ok");
    setText("[data-bridge-claim-state]", "Minted successfully");
    activeClaim = null;
    document.querySelector("[data-bridge-mint]")?.setAttribute("disabled", "disabled");
    setTimeout(() => findClaim({ silent: true }).catch(() => {}), 2500);
  } catch (err) {
    console.error(err);
    bridgeLog(err?.shortMessage || err?.message || "Mint failed or rejected.", "warn");
  }
}

async function burnForRelease() {
  try {
    const destination = selectedDestination();
    const chainId = destination === "bsc" ? 56 : 137;
    const amount = parseAmount(document.querySelector("[data-withdraw-amount]")?.value, 6);
    const nonce = BigInt(Date.now());
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 2592000);

    await refreshBridgeLiquidity();
    const liq = bridgeLiquidity[destination];
    if (liq) {
      const { net } = bridgeQuote(document.querySelector("[data-withdraw-amount]")?.value || "0");
      const needed = amount6ToDestinationUnits(net, destination);
      if (liq.balance < needed) {
        throw new Error(`Destination reserve on ${destination.toUpperCase()} is lower than the net withdrawal amount. Wait for more USDT liquidity or choose the other route.`);
      }
    }

    await ensureWalletChain(BRIDGE_CHAINS.lust);
    const signer = await browserSigner();
    await approveIfNeeded(LUSDT_TOKEN_ADDRESS, LUSDT_EXECUTOR_ADDRESS, amount, signer);

    const exec = new ethers.Contract(LUSDT_EXECUTOR_ADDRESS, EXECUTOR_ABI, signer);
    const account = await signer.getAddress();
    bridgeLog("Opening LUST burn confirmation...", "");
    const tx = await exec.burnForExternalRelease(account, amount, BigInt(chainId), nonce, deadline);
    setText("[data-bridge-last-burn]", bridgeShort(tx.hash));
    localStorage.setItem("lustLastBurnNonce", String(nonce));
    bridgeLog(`Burn sent: ${tx.hash}. Waiting confirmation...`, "");
    await tx.wait();
    bridgeLog("Burn confirmed. Wait confirmations, then click Find my release.", "ok");
  } catch (err) {
    console.error(err);
    bridgeLog(err?.shortMessage || err?.message || "Burn failed or rejected.", "warn");
  }
}

async function findRelease() {
  try {
    const account = await getWalletAccount();
    const destination = selectedDestination();
    bridgeLog("Searching release signatures...", "");

    const entries = await loadReleasesForAccount(account);
    const preferred = entries.find(({ release, used }) => !used && releaseDestinationKey(release) === destination);
    const anyPending = entries.find(({ used }) => !used);
    const picked = preferred || anyPending;

    if (!picked) {
      setText("[data-bridge-release-state]", entries.length ? "All releases used" : "Not ready yet");
      document.querySelector("[data-bridge-release]")?.setAttribute("disabled", "disabled");
      bridgeLog(
        entries.length
          ? "All ready releases for this wallet were already used."
          : "No ready release found yet. Wait confirmations and try again.",
        entries.length ? "ok" : "warn"
      );
      return null;
    }

    await prepareActiveRelease(picked.release, "ok");
    return picked.release;
  } catch (err) {
    console.error(err);
    bridgeLog(err?.message || "Could not find release.", "warn");
    return null;
  }
}

async function executeRelease() {
  try {
    if (!activeRelease) await findRelease();
    if (!activeRelease) return;

    const destination = releaseDestinationKey(activeRelease);
    const chain = bridgeChainFor(destination);
    const lockboxAddress = destination === "bsc" ? LUSDT_BSC_LOCKBOX : LUSDT_POLYGON_LOCKBOX;
    const abi = destination === "bsc" ? LOCKBOX_BSC_ABI : LOCKBOX_POLYGON_ABI;

    await ensureWalletChain(chain);
    const signer = await browserSigner();
    const lockbox = new ethers.Contract(lockboxAddress, abi, signer);

    bridgeLog(`Opening ${chain.name} release confirmation...`, "");
    const tx = await lockbox.release(
      activeRelease.recipient,
      BigInt(activeRelease.amount),
      BigInt(activeRelease.nonce),
      BigInt(activeRelease.deadline),
      activeRelease.signatures
    );
    bridgeLog(`Release sent: ${tx.hash}. Waiting confirmation...`, "");
    await tx.wait();
    bridgeLog(`USDT released successfully. Tx: ${tx.hash}`, "ok");
    activeRelease = null;
    document.querySelector("[data-bridge-release]")?.setAttribute("disabled", "disabled");
    setTimeout(() => findRelease().catch(() => {}), 2500);
  } catch (err) {
    console.error(err);
    bridgeLog(err?.shortMessage || err?.message || "Release failed or rejected.", "warn");
  }
}

function wireLusdtBridge() {
  if (!document.querySelector("[data-lusdt-bridge]")) return;

  document.querySelectorAll("[data-bridge-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      const selected = tab.getAttribute("data-bridge-tab");
      document.querySelectorAll("[data-bridge-tab]").forEach((t) => t.classList.toggle("active", t === tab));
      document.querySelectorAll("[data-bridge-panel]").forEach((panel) => {
        panel.classList.toggle("hidden", panel.getAttribute("data-bridge-panel") !== selected);
      });
      refreshBridgeUiLabels();
    });
  });

  document.querySelectorAll("[data-bridge-amount],[data-withdraw-amount]").forEach((input) => {
    input.addEventListener("input", updateBridgeQuote);
  });
  document.querySelector("[data-bridge-source]")?.addEventListener("change", () => { refreshBridgeUiLabels(); refreshBridgeLiquidity(); });
  document.querySelector("[data-bridge-destination]")?.addEventListener("change", () => { refreshBridgeUiLabels(); updateDestinationLiquidityNotice(); });

  document.querySelector("[data-bridge-refresh]")?.addEventListener("click", refreshBridgeStatus);
  document.querySelectorAll("[data-bridge-refresh]").forEach((btn) => btn.addEventListener("click", refreshBridgeStatus));
  document.querySelectorAll("[data-bridge-switch]").forEach((btn) => btn.addEventListener("click", () => {
    const depositTab = document.querySelector('[data-bridge-tab="deposit"]');
    const withdrawTab = document.querySelector('[data-bridge-tab="withdraw"]');
    const depositVisible = !document.querySelector('[data-bridge-panel="deposit"]')?.classList.contains('hidden');
    const sourceSelect = document.querySelector('[data-bridge-source]');
    const destSelect = document.querySelector('[data-bridge-destination]');
    if (depositVisible) {
      if (sourceSelect && destSelect) destSelect.value = sourceSelect.value;
      withdrawTab?.click();
    } else {
      if (sourceSelect && destSelect) sourceSelect.value = destSelect.value;
      depositTab?.click();
    }
    updateBridgeQuote();
    refreshBridgeLiquidity();
    updateDestinationLiquidityNotice();
  }));
  document.querySelector("[data-bridge-deposit]")?.addEventListener("click", depositToLusdt);
  document.querySelector("[data-bridge-find-claim]")?.addEventListener("click", findClaim);
  document.querySelector("[data-bridge-mint]")?.addEventListener("click", mintClaim);
  document.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-bridge-select-claim]");
    if (!btn) return;
    const entry = pendingBridgeClaims[Number(btn.getAttribute("data-bridge-select-claim"))];
    if (entry && !entry.used) await prepareActiveClaim(entry.claim, "ok");
  });
  document.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-bridge-mint-direct]");
    if (!btn) return;
    const entry = pendingBridgeClaims[Number(btn.getAttribute("data-bridge-mint-direct"))];
    if (entry && !entry.used) {
      await prepareActiveClaim(entry.claim, "ok");
      await mintClaim();
    }
  });
  document.querySelector("[data-bridge-burn]")?.addEventListener("click", burnForRelease);
  document.querySelector("[data-bridge-find-release]")?.addEventListener("click", findRelease);
  document.querySelector("[data-bridge-release]")?.addEventListener("click", executeRelease);
  document.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-bridge-select-release]");
    if (!btn) return;
    const entry = pendingBridgeReleases[Number(btn.getAttribute("data-bridge-select-release"))];
    if (entry && !entry.used) await prepareActiveRelease(entry.release, "ok");
  });
  document.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-bridge-release-direct]");
    if (!btn) return;
    const entry = pendingBridgeReleases[Number(btn.getAttribute("data-bridge-release-direct"))];
    if (entry && !entry.used) {
      await prepareActiveRelease(entry.release, "ok");
      await executeRelease();
    }
  });

  updateBridgeQuote();
  refreshBridgeUiLabels();
  refreshBridgeStatus();
  refreshBridgeLiquidity();
  setInterval(refreshBridgeStatus, 30000);
  setInterval(refreshBridgeLiquidity, 45000);
  setInterval(() => findClaim({ silent: true }).catch(() => {}), 10000);
}

wireLusdtBridge();
