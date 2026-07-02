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
  if (document.querySelector("[data-lusdt-bridge]")) {
    setTimeout(refreshBridgeWalletUi, 60);
  }
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
  if (document.querySelector("[data-lusdt-bridge]")) {
    setTimeout(refreshBridgeWalletUi, 60);
  }

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
const LUST_REGISTER_MAGIC_V2 = "0x4c5143525f5632"; // LQCR_V2 + 20-byte operator address
const LUST_RPC_URL = "https://rpc.lustchain.org";
const LUST_EXPLORER_URL = "https://explorer.lustchain.org";
const LUST_SNAPSHOT_INFO_URL = "https://snapshot.lustchain.org/snapshot/snapshot-info.json";
const LUST_FAUCET_STATUS_URL = "https://downloads.lustchain.org/faucet/status";
const LUST_FAUCET_CLAIM_URL = "https://downloads.lustchain.org/faucet/claim";
const LUST_MINING_STATS_URL = "https://rpc.lustchain.org/mining-stats";
const LUST_PENDING_RAW_URL = "https://rpc.lustchain.org/pending-raw";
const LUST_V7A25_REGISTRY_BLOCK = 138282;
const LUST_V7A25_SIGNATURE_BLOCK = 139082;
const LUST_V7A25_AUTONOMY_BLOCK = 999999999999;

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

async function getBestWalletAddress() {
  readState();
  if (walletState.address) return walletState.address;
  const eth = getInjectedEthereum();
  if (!eth?.request) return "";
  try {
    const accounts = await eth.request({ method: "eth_accounts" });
    const account = Array.isArray(accounts) && accounts.length ? accounts[0] : "";
    if (account) {
      walletState = { ...walletState, address: account, connected: true };
      renderWalletButton();
      return account;
    }
  } catch (_) {}
  return "";
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

function parseRpcBlockNumber(value) {
  if (typeof value === "number") return value;
  const v = String(value || "").trim();
  if (!v) return 0;
  if (v.startsWith("0x")) return Number.parseInt(v, 16) || 0;
  return Number.parseInt(v, 10) || 0;
}

async function getLustCurrentBlock() {
  return parseRpcBlockNumber(await lustRpc("eth_blockNumber", []));
}

function updateV7A25GateDisplay(currentBlock) {
  const block = Number(currentBlock || 0);
  const remaining = Math.max(0, LUST_V7A25_REGISTRY_BLOCK - block);
  const isOpen = block >= LUST_V7A25_REGISTRY_BLOCK;

  setText("[data-current-block]", block > 0 ? fmtNumber(block) : "Loading...");
  setText("[data-blocks-to-registry]", block > 0 ? fmtNumber(remaining) : "Loading...");
  setText("[data-registration-open]", isOpen ? "Open" : `Locked until ${fmtNumber(LUST_V7A25_REGISTRY_BLOCK)}`);
  setText("[data-registry-countdown-note]", isOpen ? "Registration is open now." : `Wait ${fmtNumber(remaining)} blocks before registering.`);

  document.querySelectorAll("[data-register-miner]").forEach((btn) => {
    btn.disabled = !isOpen;
    btn.textContent = isOpen ? "Register V7A25 Miner now" : `Registration opens at block ${fmtNumber(LUST_V7A25_REGISTRY_BLOCK)}`;
    btn.title = isOpen ? "Send V7A25 LQCR_V2 registration" : `Current block ${fmtNumber(block)}. Wait until ${fmtNumber(LUST_V7A25_REGISTRY_BLOCK)}.`;
  });

  return { block, remaining, isOpen };
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
    setMinerLog("Abrindo confirmação da carteira para registro V7A25...", "");
    const eth = getInjectedEthereum();
    if (!eth) throw new Error("MetaMask or injected wallet not found.");

    const operatorInput = document.querySelector("[data-operator-address]");
    const operator = String(operatorInput?.value || "").trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(operator)) {
      throw new Error("Cole o operator address V7A25 do operator-address.txt antes de registrar.");
    }

    const account = await getWalletAccount();
    await addLustChainToWallet();

    const chainId = normalizeChainId(await eth.request({ method: "eth_chainId" }));
    if (chainId !== LUST_CHAIN_ID_HEX) {
      throw new Error("Troque para LUST Chain antes de registrar.");
    }

    const currentBlock = await getLustCurrentBlock();
    const gate = updateV7A25GateDisplay(currentBlock);
    if (!gate.isOpen) {
      throw new Error(`Registro V7A25 ainda bloqueado. Bloco atual ${fmtNumber(currentBlock)}. Espere o bloco ${fmtNumber(LUST_V7A25_REGISTRY_BLOCK)}. Faltam ${fmtNumber(gate.remaining)} blocos.`);
    }

    const registerData = `${LUST_REGISTER_MAGIC_V2}${operator.slice(2).toLowerCase()}`;

    const txHash = await eth.request({
      method: "eth_sendTransaction",
      params: [{
        from: account,
        to: LUST_REGISTRY_ADDRESS,
        value: "0x0",
        data: registerData,
        gas: "0x249f0"
      }]
    });

    setMinerLog(`V7A25 registration sent. Waiting confirmation: ${txHash}`, "");
    const receipt = await waitForTxReceipt(txHash);

    if (receipt?.status === "0x1") {
      localStorage.setItem(localRegistrationKey(account), JSON.stringify({ txHash, operator, mode: "LQCR_V2", time: Date.now() }));
      setMinerLog(`Miner V7A25 registrado com sucesso. Operator: ${shortAddress(operator)} · Tx: ${txHash}`, "ok");
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
  try {
    const currentBlock = await getLustCurrentBlock();
    updateV7A25GateDisplay(currentBlock);
  } catch (_) {
    updateV7A25GateDisplay(0);
  }
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
      setText("[data-registration-state]", parsed.operator ? `V7A25 ${shortAddress(parsed.operator)} · ${shortAddress(parsed.txHash || "")}` : `Saved tx ${shortAddress(parsed.txHash || "")}`);
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

  const address = await getBestWalletAddress();
  const url = address ? `${LUST_FAUCET_STATUS_URL}?address=${encodeURIComponent(address)}` : LUST_FAUCET_STATUS_URL;

  try {
    const res = await fetch(url, { method: "GET", mode: "cors", cache: "no-store", headers: { "Accept": "application/json" } });
    const json = await res.json();

    if (!json.ok) throw new Error(json.message || "Faucet status failed");

    setText("[data-faucet-amount]", `${json.amountLST || "0.01"} LST`);
    setText("[data-faucet-balance]", `${json.faucetBalanceLST || "--"} LST`);
    setText("[data-faucet-wallet-balance]", json.walletBalanceLST ? `${json.walletBalanceLST} LST` : "Connect wallet");
    setText("[data-faucet-eligibility]", json.eligible ? "Eligible" : (json.reason || "Not eligible"));

    if (!address) {
      setFaucetLog("Connect your wallet to check faucet eligibility.", "");
    } else if (json.eligible) {
      setFaucetLog("Your wallet can claim 0.01 LST for its first LUST Chain transaction.", "ok");
    } else {
      setFaucetLog(json.reason || "This wallet is not eligible for the faucet.", "warn");
    }
  } catch (err) {
    console.error(err);
    setFaucetLog(err?.message || "Could not read faucet status. Hard refresh the page and try again.", "warn");
  }
}

async function claimLustFaucet() {
  try {
    const eth = getInjectedEthereum();
    if (!eth) throw new Error("MetaMask or injected wallet not found.");

    setFaucetLog("Checking wallet and official faucet eligibility...", "");
    const account = await getWalletAccount();
    await addLustChainToWallet();

    const res = await fetch(LUST_FAUCET_CLAIM_URL, {
      method: "POST",
      mode: "cors",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
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

function bridgeLog(message, tone = "", scope = "active") {
  let selector = "[data-bridge-claim-log]";
  if (scope === "release") selector = "[data-bridge-release-log]";
  else if (scope === "claim") selector = "[data-bridge-claim-log]";
  else if (typeof activeBridgeMode === "function" && activeBridgeMode() === "withdraw") selector = "[data-bridge-release-log]";

  document.querySelectorAll(selector).forEach((el) => {
    el.textContent = message;
    el.dataset.tone = tone;
  });
}

function bridgeClaimLog(message, tone = "") {
  bridgeLog(message, tone, "claim");
}

function bridgeReleaseLog(message, tone = "") {
  bridgeLog(message, tone, "release");
}

function bridgeButtonBaseLabel(selector) {
  if (selector.includes("deposit")) return "Deposit USDT";
  if (selector.includes("mint") && selector.includes("recover")) return "Mint recovered claim";
  if (selector.includes("mint")) return "Mint on LUST";
  if (selector.includes("burn")) return "Burn LUSDT";
  if (selector.includes("release")) return "Release USDT";
  if (selector.includes("recover")) return "Recover claim";
  return "Continue";
}

function bridgeButtonBusyLabel(selector) {
  if (selector.includes("deposit")) return "Depositing...";
  if (selector.includes("mint")) return "Minting...";
  if (selector.includes("burn")) return "Burning...";
  if (selector.includes("release")) return "Releasing...";
  if (selector.includes("recover")) return "Recovering...";
  return "Processing...";
}

function setBridgeButtonState(selector, state = "default", label = "") {
  const btn = document.querySelector(selector);
  if (!btn) return;

  const baseLabel = bridgeButtonBaseLabel(selector);
  if (!btn.dataset.defaultText) btn.dataset.defaultText = baseLabel;

  btn.classList.remove("is-ready", "is-waiting", "is-loading");

  if (state === "ready") {
    btn.classList.add("is-ready");
    btn.removeAttribute("disabled");
    btn.textContent = baseLabel;
    return;
  }

  if (state === "waiting") {
    btn.classList.add("is-waiting");
    btn.setAttribute("disabled", "disabled");
    btn.textContent = bridgeButtonBusyLabel(selector);
    return;
  }

  if (state === "loading") {
    btn.classList.add("is-loading");
    btn.setAttribute("disabled", "disabled");
    btn.textContent = bridgeButtonBusyLabel(selector);
    return;
  }

  if (state === "disabled") {
    btn.setAttribute("disabled", "disabled");
    btn.textContent = baseLabel;
    return;
  }

  btn.removeAttribute("disabled");
  btn.textContent = baseLabel;
}

function setBridgeActionReady(selector, ready) {
  setBridgeButtonState(selector, ready ? "ready" : "disabled");
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
  const chain = typeof kind === "string" ? BRIDGE_CHAINS[kind] : kind;
  const appkitNetworkByHex = {
    [LUST_CHAIN_ID_HEX]: lustNetwork,
    "0x89": polygonNetwork,
    "0x38": bscNetwork
  };

  const eth = getInjectedEthereum();
  if (eth) {
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
    setTimeout(readState, 250);
    setTimeout(readState, 900);
    return;
  }

  const appkitChain = appkitNetworkByHex[chain.chainIdHex];
  if (appKit?.switchNetwork && appkitChain) {
    await appKit.switchNetwork(appkitChain);
    setTimeout(readState, 250);
    setTimeout(readState, 900);
    return;
  }

  throw new Error("No injected wallet available to switch network automatically.");
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


const BRIDGE_PENDING_TTL_MS = 20 * 60 * 1000;

function bridgePendingKey(kind) {
  return `lustBridgePending_${kind}`;
}

function setBridgePending(kind, value, meta = {}) {
  try {
    sessionStorage.setItem(bridgePendingKey(kind), JSON.stringify({ value: String(value || "pending"), ts: Date.now(), ...meta }));
  } catch (_) {}
}

function clearBridgePending(kind) {
  try {
    sessionStorage.removeItem(bridgePendingKey(kind));
  } catch (_) {}
}

function bridgePendingValue(kind) {
  try {
    const raw = sessionStorage.getItem(bridgePendingKey(kind));
    if (!raw) return "";
    const item = JSON.parse(raw);
    if (!item?.ts || Date.now() - Number(item.ts) > BRIDGE_PENDING_TTL_MS) {
      clearBridgePending(kind);
      return "";
    }
    return String(item.value || "");
  } catch (_) {
    clearBridgePending(kind);
    return "";
  }
}

function bridgePendingItem(kind) {
  try {
    const raw = sessionStorage.getItem(bridgePendingKey(kind));
    if (!raw) return null;
    const item = JSON.parse(raw);
    if (!item?.ts || Date.now() - Number(item.ts) > BRIDGE_PENDING_TTL_MS) {
      clearBridgePending(kind);
      return null;
    }
    return item;
  } catch (_) {
    clearBridgePending(kind);
    return null;
  }
}

function bridgeHasPending(kind) {
  return Boolean(bridgePendingValue(kind));
}

function clearStoredDepositRecovery() {
  try {
    localStorage.removeItem("lustLastDepositTxHash");
    localStorage.removeItem("lustLastDepositSource");
    localStorage.removeItem("lustLastDepositId");
  } catch (_) {}
}

function resetClaimUiToIdle(message = "Ready for a new buy.") {
  activeClaim = null;
  clearBridgePending("claim");
  clearStoredDepositRecovery();
  setBridgeActionReady("[data-bridge-mint]", false);
  setBridgeButtonState("[data-bridge-deposit]", "default", "Deposit USDT");
  setText("[data-bridge-claim-state]", "Waiting");
  bridgeClaimLog(message, "ok");
}

function resetReleaseUiToIdle(message = "Ready for a new sell.") {
  activeRelease = null;
  clearBridgePending("release");
  setBridgeActionReady("[data-bridge-release]", false);
  setBridgeButtonState("[data-bridge-burn]", "default", "Burn LUSDT");
  setText("[data-bridge-release-state]", "Waiting");
  bridgeReleaseLog(message, "ok");
}

function claimSourceLabel(claim) {
  const source = String(claim?.source || "").toLowerCase();
  const chainId = String(claim?.sourceChainId || "");
  if (source === "bsc" || chainId === "56") return "BSC";
  if (source === "polygon" || chainId === "137") return "Polygon";
  return source || `Chain ${chainId}`;
}

function recentLocalDepositIds() {
  const ids = [];
  const last = localStorage.getItem("lustLastDepositId") || "";
  if (last) ids.push(last);
  const minted = JSON.parse(localStorage.getItem("lustMintedDepositIds") || "[]");
  minted.slice(-3).forEach((id) => {
    if (id && !ids.includes(id)) ids.push(id);
  });
  return ids.filter(Boolean);
}

function renderPendingClaims(entries = []) {
  const box = document.querySelector("[data-bridge-pending-claims]");
  if (!box) return;

  if (!walletState.connected) {
    const localIds = recentLocalDepositIds();
    box.innerHTML = localIds.length
      ? `<div class="claim-summary">Recent local deposit IDs saved in this browser</div>${localIds.map((id) => `<div class="claim-item"><div><strong>Local recovery hint</strong><small>${bridgeEscape(id)}</small></div><button class="mini-btn" type="button" data-copy-text="${bridgeEscape(id)}">Copy ID</button></div>`).join("")}`
      : `<div class="claim-item muted">No wallet connected yet. You can still reconnect later and use Find / Refresh to reload claims automatically.</div>`;
    box.querySelectorAll('[data-copy-text]').forEach((btn) => btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(btn.getAttribute('data-copy-text') || ''); btn.textContent='Copied'; setTimeout(()=>btn.textContent='Copy ID',1200); } catch(_) {}
    }));
    return;
  }

  if (!entries.length) {
    const localIds = recentLocalDepositIds();
    box.innerHTML = localIds.length
      ? `<div class="claim-summary">No ready claim returned yet. Recent local deposit IDs saved in this browser</div>${localIds.map((id) => `<div class="claim-item"><div><strong>Local recovery hint</strong><small>${bridgeEscape(id)}</small></div><button class="mini-btn" type="button" data-copy-text="${bridgeEscape(id)}">Copy ID</button></div>`).join("")}`
      : `<div class="claim-item muted">No claim found for this wallet yet. Click Find / Refresh after confirmations.</div>`;
    box.querySelectorAll('[data-copy-text]').forEach((btn) => btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(btn.getAttribute('data-copy-text') || ''); btn.textContent='Copied'; setTimeout(()=>btn.textContent='Copy ID',1200); } catch(_) {}
    }));
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
    clearBridgePending("claim");
    bridgeClaimLog("This deposit was already minted. Use another ready claim or make a new deposit.", "warn");
    return false;
  }
  activeClaim = claim;
  const source = claim.source || (String(claim.sourceChainId) === "56" ? "bsc" : "polygon");
  setText("[data-bridge-claim-state]", `Ready · ${source} · ${formatUnitsSafe(claim.amount)} LUSDT`);
  setBridgeActionReady("[data-bridge-mint]", true);
  renderPendingClaims(pendingBridgeClaims);
  bridgeClaimLog(`Claim ready. Mint LUSDT is available. Amount: ${formatUnitsSafe(claim.amount)} LUSDT.`, tone);
  return true;
}

async function findClaimByDepositId(depositId) {
  if (!depositId) return null;
  try {
    const data = await bridgeFetch(`/api/claim/${depositId}`);
    const claims = normalizeApiItems(data, "claims");
    const claim = claims[0] || data.claim || data;
    if (claim?.depositId || claim?.status) return claim;
  } catch (_) {}
  return null;
}


function normalizeClaimRecoverSource(source) {
  const s = String(source || "").toLowerCase();
  if (s === "bsc" || s === "bnb" || s === "binance") return "bsc";
  if (s === "polygon" || s === "matic") return "polygon";
  return "";
}

function isBridgeTxHash(value) {
  return /^0x[a-fA-F0-9]{64}$/.test(String(value || ""));
}

async function findClaimBySourceTx(source, txHash) {
  source = normalizeClaimRecoverSource(source);
  if (!source || !isBridgeTxHash(txHash)) return null;

  try {
    const data = await bridgeFetch(`/api/claim/tx/${source}/${txHash}`);
    const claim = data?.claim || normalizeApiItems(data, "claims")[0];
    if (claim?.depositId || claim?.status) return claim;
  } catch (_) {}

  return null;
}

async function recoverClaimBySourceTx(source, txHash) {
  source = normalizeClaimRecoverSource(source);
  if (!source || !isBridgeTxHash(txHash)) return null;

  try {
    const data = await bridgeFetch(`/api/recover/${source}/${txHash}`);
    const claim = data?.claim || normalizeApiItems(data, "claims")[0];
    if (claim?.depositId || claim?.status) return claim;
  } catch (_) {}

  return null;
}

async function prepareClaimFromRecoveredTx(claim, account, txHash = "") {
  if (!claim) return null;
  if (claim.recipient && !sameAddress(claim.recipient, account)) return null;
  if (txHash && claim.depositId) localStorage.setItem("lustLastDepositId", claim.depositId);

  const minted = claim.used || String(claim.status || "").toLowerCase().includes("mint") || await isMintedOnChain(claim.depositId);
  if (minted) {
    markLocallyMinted(claim.depositId);
    resetClaimUiToIdle("LUSDT already minted. Ready for a new buy.");
    refreshBridgeWalletBalances().catch(() => {});
    return null;
  }

  if (claim.status === "ready" && sameAddress(claim.recipient, account)) {
    setBridgePending("claim", claim.depositId, {
      source: normalizeClaimRecoverSource(claim.source) || (String(claim.sourceChainId) === "56" ? "bsc" : "polygon"),
      txHash
    });
    await prepareActiveClaim(claim, "ok");
    return claim;
  }

  return null;
}

async function findOrRecoverPendingClaimByTx(account, options = {}) {
  const item = bridgePendingItem("claim");
  const allowLocalFallback = options.allowLocalFallback === true;
  const source = normalizeClaimRecoverSource(
    item?.source || (allowLocalFallback ? localStorage.getItem("lustLastDepositSource") : "")
  );
  const txHash = String(
    item?.txHash ||
    item?.transactionHash ||
    (allowLocalFallback ? localStorage.getItem("lustLastDepositTxHash") : "") ||
    ""
  ).trim();
  const visible = options.visible !== false;
  const hasPendingSessionClaim = Boolean(item && (item.value || item.txHash || item.transactionHash));

  if (!hasPendingSessionClaim && !allowLocalFallback) return null;
  if (!source || !isBridgeTxHash(txHash)) return null;

  if (visible) {
    setText("[data-bridge-claim-state]", "Checking claim");
    setBridgeButtonState("[data-bridge-mint]", "loading", "Checking claim");
    bridgeClaimLog(`Checking bridge claim for ${source.toUpperCase()} tx ${bridgeShort(txHash)}...`, "");
  }

  const existing = await findClaimBySourceTx(source, txHash);
  const preparedExisting = await prepareClaimFromRecoveredTx(existing, account, txHash);
  if (preparedExisting) return preparedExisting;

  if (visible) {
    setText("[data-bridge-claim-state]", "Recovering claim");
    setBridgeButtonState("[data-bridge-mint]", "loading", "Recovering claim");
    bridgeClaimLog(`Claim not listed yet. Calling secure ${source.toUpperCase()} recovery now...`, "");
  }

  const recovered = await recoverClaimBySourceTx(source, txHash);
  return await prepareClaimFromRecoveredTx(recovered, account, txHash);
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

function bridgeNetworkMeta(kind) {
  return kind === "bsc"
    ? { src: "./assets/bsc-logo.png", alt: "BSC", name: "BSC", short: "BSC" }
    : { src: "./assets/polygon-logo.png", alt: "Polygon", name: "Polygon", short: "Polygon" };
}

function updateBridgeNetworkView(prefix, meta) {
  document.querySelectorAll(`[data-bridge-${prefix}-logo]`).forEach((img) => {
    img.setAttribute("src", meta.src);
    img.setAttribute("alt", meta.alt);
  });
  document.querySelectorAll(`[data-bridge-${prefix}-name]`).forEach((el) => {
    el.textContent = meta.name;
  });
  document.querySelectorAll(`[data-bridge-${prefix}-pill-logo]`).forEach((img) => {
    img.setAttribute("src", meta.src);
    img.setAttribute("alt", meta.alt);
  });
  document.querySelectorAll(`[data-bridge-${prefix}-pill-name]`).forEach((el) => {
    el.textContent = meta.name;
  });
}



function refreshBridgeUiLabels() {
  const source = selectedSource();
  const destination = selectedDestination();
  const sourceMeta = bridgeNetworkMeta(source);
  const destinationMeta = bridgeNetworkMeta(destination);
  updateBridgeNetworkView("source", sourceMeta);
  updateBridgeNetworkView("destination", destinationMeta);

  const activeTab = document.querySelector("[data-bridge-tab].active")?.getAttribute("data-bridge-tab") || "deposit";
  setText("[data-bridge-title-action]", activeTab === "withdraw" ? "Sell" : "Buy");
}

async function refreshBridgeWalletBalances() {
  if (!document.querySelector("[data-lusdt-bridge]")) return;
  if (!walletState.connected || !walletState.address) {
    setText("[data-bridge-source-balance]", "Connect wallet");
    setText("[data-withdraw-source-balance]", "Connect wallet");
    renderPendingClaims(pendingBridgeClaims);
    renderPendingReleases(pendingBridgeReleases);
    return;
  }
  const account = walletState.address;
  try {
    const sourceKind = selectedSource();
    const srcCfg = sourceToken(sourceKind);
    const chain = bridgeChainFor(sourceKind);
    const sourceProvider = new ethers.JsonRpcProvider(chain.rpcUrls[0]);
    const sourceTokenContract = new ethers.Contract(srcCfg.address, ERC20_ABI, sourceProvider);
    const srcBal = await sourceTokenContract.balanceOf(account);
    setText("[data-bridge-source-balance]", `${formatUnitsSafe(srcBal, srcCfg.decimals)} USDT`);
  } catch (_) {
    setText("[data-bridge-source-balance]", "--");
  }
  try {
    const lustProvider = new ethers.JsonRpcProvider(BRIDGE_CHAINS.lust.rpcUrls[0]);
    const lustToken = new ethers.Contract(LUSDT_TOKEN_ADDRESS, ERC20_ABI, lustProvider);
    const lusdtBal = await lustToken.balanceOf(account);
    setText("[data-withdraw-source-balance]", `${formatUnitsSafe(lusdtBal, 6)} LUSDT`);
  } catch (_) {
    setText("[data-withdraw-source-balance]", "--");
  }
}

function refreshBridgeWalletUi() {
  if (!document.querySelector("[data-lusdt-bridge]")) return;
  refreshBridgeWalletBalances().catch(() => {});
  if (walletState.connected && walletState.address) {
    findClaim({ silent: true }).catch(() => {});
    findRelease().catch(() => {});
  } else {
    renderPendingClaims(pendingBridgeClaims);
    renderPendingReleases(pendingBridgeReleases);
  }
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
    if (walletState.connected && walletState.address) {
      if (Number(stats.claims || 0) > 0) findClaim({ silent: true }).catch(() => {});
      if (Number(stats.releases || 0) > 0) findRelease({ silent: true }).catch(() => {});
    }
  } catch (err) {
    bridgeLog(`Bridge API blocked/offline: ${err.message}. Open https://lusdt-bridge.lustchain.org/health and refresh Ctrl+F5.`, "warn");
    setText("[data-bridge-api-state]", "API blocked");
  }
}

async function depositToLusdt() {
  try {
    setBridgeButtonState("[data-bridge-deposit]", "loading", "Checking wallet...");
    setBridgeActionReady("[data-bridge-mint]", false);

    const kind = selectedSource();
    const token = sourceToken(kind);
    const chain = bridgeChainFor(kind);
    const amount = parseAmount(document.querySelector("[data-bridge-amount]")?.value, token.decimals);

    bridgeClaimLog(`Preparing ${chain.name} deposit...`, "");
    await ensureWalletChain(chain);

    setBridgeButtonState("[data-bridge-deposit]", "loading", "Checking allowance...");
    const signer = await browserSigner();
    const account = await signer.getAddress();

    const approvalTx = await approveIfNeeded(token.address, token.lockbox, amount, signer);
    if (approvalTx) {
      setBridgeButtonState("[data-bridge-deposit]", "loading", "Allowance ready");
      bridgeClaimLog("Approval confirmed. Next step: deposit confirmation.", "ok");
    }

    const lockbox = new ethers.Contract(token.lockbox, token.lockboxAbi, signer);
    setBridgeButtonState("[data-bridge-deposit]", "loading", "Confirm deposit");
    bridgeClaimLog(`Opening ${chain.name} deposit confirmation...`, "");

    const tx = await lockbox.deposit(amount);
    try {
      localStorage.setItem("lustLastDepositTxHash", tx.hash);
      localStorage.setItem("lustLastDepositSource", kind);
    } catch (_) {}

    setText("[data-bridge-last-deposit]", bridgeShort(tx.hash));
    setBridgeButtonState("[data-bridge-deposit]", "loading", "Deposit pending");
    setBridgeButtonState("[data-bridge-mint]", "waiting", "Waiting deposit");
    bridgeClaimLog(`Deposit sent: ${tx.hash}. Waiting on-chain confirmation...`, "");

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
      setBridgePending("claim", depositId, { amount: String(amount), source: kind, txHash: tx.hash });
    } else {
      setBridgePending("claim", "pending", { amount: String(amount), source: kind, txHash: tx.hash });
    }

    setText("[data-bridge-claim-state]", "Creating claim");
    setBridgeButtonState("[data-bridge-deposit]", "default", "Deposit USDT");
    setBridgeButtonState("[data-bridge-mint]", "loading", "Preparing claim");
    bridgeClaimLog(
      depositId
        ? `Deposit confirmed. DepositId: ${depositId}. Creating claim now...`
        : `Deposit confirmed. Creating claim now from tx: ${tx.hash}`,
      "ok"
    );

    const recoveredNow = await findOrRecoverPendingClaimByTx(account, { visible: true, allowLocalFallback: true });
    if (recoveredNow) {
      setBridgeButtonState("[data-bridge-deposit]", "default", "Deposit USDT");
      return;
    }

    setText("[data-bridge-claim-state]", "Preparing claim");
    setBridgeButtonState("[data-bridge-mint]", "waiting", "Checking claim");
    bridgeClaimLog("Claim is not ready yet. Auto-recover is running in the background; keep this page open.", "warn");
    autoFindClaimSoon();
  } catch (err) {
    console.error(err);
    setBridgeButtonState("[data-bridge-deposit]", "default", "Deposit USDT");
    if (activeClaim) setBridgeActionReady("[data-bridge-mint]", true);
    else setBridgeButtonState("[data-bridge-mint]", "disabled", "Mint on LUST");
    bridgeClaimLog(err?.shortMessage || err?.message || "Deposit failed or rejected.", "warn");
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
    const lastNonce = localStorage.getItem("lustLastBurnNonce") || "";
    box.innerHTML = lastNonce
      ? `<div class="claim-summary">Last local burn nonce saved in this browser</div><div class="claim-item"><div><strong>Local recovery hint</strong><small>${bridgeEscape(lastNonce)}</small></div><button class="mini-btn" type="button" data-copy-text="${bridgeEscape(lastNonce)}">Copy nonce</button></div>`
      : `<div class="claim-item muted">Connect wallet and click Find my release.</div>`;
    box.querySelectorAll('[data-copy-text]').forEach((btn) => btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(btn.getAttribute('data-copy-text') || ''); btn.textContent='Copied'; setTimeout(()=>btn.textContent='Copy nonce',1200); } catch(_) {}
    }));
    return;
  }

  if (!entries.length) {
    const lastNonce = localStorage.getItem("lustLastBurnNonce") || "";
    box.innerHTML = lastNonce
      ? `<div class="claim-summary">No ready release returned yet. Last local burn nonce saved in this browser</div><div class="claim-item"><div><strong>Local recovery hint</strong><small>${bridgeEscape(lastNonce)}</small></div><button class="mini-btn" type="button" data-copy-text="${bridgeEscape(lastNonce)}">Copy nonce</button></div>`
      : `<div class="claim-item muted">No release found for this wallet yet. Click Find my release after confirmations.</div>`;
    box.querySelectorAll('[data-copy-text]').forEach((btn) => btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(btn.getAttribute('data-copy-text') || ''); btn.textContent='Copied'; setTimeout(()=>btn.textContent='Copy nonce',1200); } catch(_) {}
    }));
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

async function loadAllReleasesForAccount(account) {
  const data = await bridgeFetch(`/api/releases/address/${account}`);
  return normalizeApiItems(data, "releases")
    .filter((release) => sameAddress(release.recipient, account))
    .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
}

async function releasePendingWasUsed(account) {
  const item = bridgePendingItem("release");
  if (!item?.value) return false;
  const pendingNonce = String(item.value);
  const destination = item.destination || selectedDestination();
  try {
    const releases = await loadAllReleasesForAccount(account);
    const match = releases.find((release) => String(release.nonce) === pendingNonce);
    if (match) {
      if (String(match.status || "").toLowerCase().includes("release") || match.used || await isReleaseUsedOnChain(match)) return true;
      if (match.status === "ready") return false;
    }
  } catch (_) {}
  try {
    const chain = bridgeChainFor(destination);
    const lockboxAddress = destination === "bsc" ? LUSDT_BSC_LOCKBOX : LUSDT_POLYGON_LOCKBOX;
    const abi = destination === "bsc" ? LOCKBOX_BSC_ABI : LOCKBOX_POLYGON_ABI;
    const provider = new ethers.JsonRpcProvider(chain.rpcUrls[0]);
    const lockbox = new ethers.Contract(lockboxAddress, abi, provider);
    return Boolean(await lockbox.usedNonce(account, BigInt(pendingNonce)));
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
    clearBridgePending("release");
    bridgeReleaseLog("This release was already used. Select another pending release.", "warn");
    return false;
  }
  activeRelease = release;
  const destination = releaseDestinationKey(release);
  setText("[data-bridge-release-state]", `Ready · ${destination} · ${formatUnitsSafe(release.amount)} USDT`);
  setBridgeActionReady("[data-bridge-release]", true);
  renderPendingReleases(pendingBridgeReleases);
  bridgeReleaseLog(`Release ready for ${destination}. Release USDT is available. Amount: ${formatUnitsSafe(release.amount)} USDT.`, tone);
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
    if (!options.silent) bridgeClaimLog("Searching claim signatures...", "");

    const lastDepositId = bridgePendingValue("claim");
    if (lastDepositId && lastDepositId !== "pending") {
      if (await isMintedOnChain(lastDepositId)) {
        markLocallyMinted(lastDepositId);
        resetClaimUiToIdle("LUSDT already minted. Ready for a new buy.");
        refreshBridgeWalletBalances().catch(() => {});
        return null;
      }
      const directClaim = await findClaimByDepositId(lastDepositId);
      if (directClaim?.status && directClaim.status !== "ready") {
        if (String(directClaim.status).toLowerCase().includes("mint") || directClaim.used) {
          markLocallyMinted(lastDepositId);
          resetClaimUiToIdle("LUSDT already minted. Ready for a new buy.");
          refreshBridgeWalletBalances().catch(() => {});
          return null;
        }
      }
      if (directClaim?.status === "ready" && sameAddress(directClaim.recipient, account)) {
        await prepareActiveClaim(directClaim, "ok");
        return directClaim;
      }
    }

    const recoveredFromTx = await findOrRecoverPendingClaimByTx(account, {
      visible: !options.silent,
      allowLocalFallback: !options.silent
    });
    if (recoveredFromTx) return recoveredFromTx;

    const entries = await loadClaimsForAccount(account);

    if (lastDepositId && lastDepositId !== "pending") {
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

    const hasPendingClaim = bridgeHasPending("claim");
    const mayUpdateSilentClaimUi = !options.silent || options.autoRetry === true;
    if (entries.length) {
      clearBridgePending("claim");
      if (mayUpdateSilentClaimUi) {
        setText("[data-bridge-claim-state]", "All claims minted");
        setBridgeActionReady("[data-bridge-mint]", false);
      }
    } else if (hasPendingClaim) {
      if (mayUpdateSilentClaimUi) {
        setText("[data-bridge-claim-state]", "Preparing claim");
        setBridgeButtonState("[data-bridge-mint]", "waiting", "Preparing claim");
      }
    } else {
      setText("[data-bridge-claim-state]", "Waiting");
      setBridgeActionReady("[data-bridge-mint]", false);
    }
    if (!options.silent) {
      bridgeClaimLog(
        hasPendingClaim
          ? "No ready claim found yet. Waiting bridge confirmations automatically."
          : "No pending claim for this wallet.",
        hasPendingClaim ? "warn" : "ok"
      );
    }
    return null;
  } catch (err) {
    console.error(err);
    if (!options.silent) bridgeClaimLog(err?.message || "Could not find claim.", "warn");
    return null;
  }
}

async function autoFindClaimSoon() {
  const attempts = [0, 1500, 3000, 5000, 8000, 12000, 18000, 25000, 35000, 50000, 70000, 95000, 120000];
  for (const ms of attempts) {
    setTimeout(() => findClaim({ silent: true, autoRetry: true }).catch(() => {}), ms);
  }
}

async function autoFindReleaseSoon(options = {}) {
  const attempts = [0, 1200, 2500, 4000, 6500, 9000, 12000, 16000, 22000, 30000, 45000, 60000, 90000, 120000];
  const visible = options.visible === true;
  for (const ms of attempts) {
    setTimeout(() => findRelease({ silent: !visible, autoRetry: true }).catch(() => {}), ms);
  }
}

async function mintClaim() {
  try {
    if (!activeClaim) await findClaim();
    if (!activeClaim) return;
    setBridgeButtonState("[data-bridge-mint]", "loading", "Confirm mint");
    await ensureWalletChain(BRIDGE_CHAINS.lust);
    const signer = await browserSigner();
    const exec = new ethers.Contract(LUSDT_EXECUTOR_ADDRESS, EXECUTOR_ABI, signer);
    bridgeClaimLog("Opening LUST mint confirmation...", "");
    const tx = await exec.mintFromExternalDeposit(
      activeClaim.recipient,
      BigInt(activeClaim.amount),
      activeClaim.depositId,
      BigInt(activeClaim.sourceChainId),
      BigInt(activeClaim.deadline),
      activeClaim.signatures
    );
    bridgeClaimLog(`Mint sent: ${tx.hash}. Waiting confirmation...`, "");
    await waitBridgeTxWithProgress(tx, {
      selector: "[data-bridge-mint]",
      baseLabel: "Mint pending on LUST",
      logFn: bridgeClaimLog
    });
    setBridgeButtonState("[data-bridge-mint]", "loading", "Finalizing");
    markLocallyMinted(activeClaim.depositId);
    clearBridgePending("claim");
    bridgeClaimLog(`LUSDT minted successfully. Tx: ${tx.hash}`, "ok");
    setText("[data-bridge-claim-state]", "Minted successfully");
    activeClaim = null;
    setBridgeActionReady("[data-bridge-mint]", false);
    setBridgeButtonState("[data-bridge-deposit]", "default", "Deposit USDT");
    setTimeout(() => findClaim({ silent: true }).catch(() => {}), 2500);
  } catch (err) {
    console.error(err);
    if (activeClaim) setBridgeActionReady("[data-bridge-mint]", true);
    bridgeClaimLog(err?.shortMessage || err?.message || "Mint failed or rejected.", "warn");
  }
}

async function burnForRelease() {
  try {
    setBridgeButtonState("[data-bridge-burn]", "loading", "Confirm burn");
    setBridgeActionReady("[data-bridge-release]", false);
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
    bridgeReleaseLog("Opening LUST burn confirmation...", "");
    const tx = await exec.burnForExternalRelease(account, amount, BigInt(chainId), nonce, deadline);
    setBridgeButtonState("[data-bridge-burn]", "loading", "Burn pending on LUST");
    setBridgeButtonState("[data-bridge-release]", "waiting", "Waiting burn");
    setText("[data-bridge-last-burn]", bridgeShort(tx.hash));
    localStorage.setItem("lustLastBurnNonce", String(nonce));
    setBridgePending("release", String(nonce), { destination, amount: String(amount), txHash: tx.hash });
    setText("[data-bridge-release-state]", "Burn pending");
    bridgeReleaseLog(`Burn sent: ${tx.hash}. Waiting LUST confirmation...`, "");
    await waitBridgeTxWithProgress(tx, {
      selector: "[data-bridge-burn]",
      baseLabel: "Burn pending on LUST",
      logFn: bridgeReleaseLog
    });

    setBridgeButtonState("[data-bridge-burn]", "default", "Burn LUSDT");
    setBridgeButtonState("[data-bridge-release]", "loading", "Preparing release");
    setText("[data-bridge-release-state]", "Creating release");
    bridgeReleaseLog("Burn confirmed. Creating release signatures now...", "ok");

    const releaseNow = await findRelease({ silent: false, autoRetry: true, fromBurn: true });
    if (releaseNow) return;

    setText("[data-bridge-release-state]", "Waiting signatures");
    setBridgeButtonState("[data-bridge-release]", "waiting", "Waiting signatures");
    bridgeReleaseLog("Release is not ready yet. Auto-check is running; keep this page open.", "warn");
    autoFindReleaseSoon({ visible: true });
  } catch (err) {
    console.error(err);
    setBridgeButtonState("[data-bridge-burn]", "default", "Burn LUSDT");
    if (activeRelease) setBridgeActionReady("[data-bridge-release]", true);
    else if (bridgeHasPending("release")) setBridgeButtonState("[data-bridge-release]", "waiting", "Resume release");
    else setBridgeActionReady("[data-bridge-release]", false);
    bridgeReleaseLog(err?.shortMessage || err?.message || "Burn failed or rejected.", "warn");
  }
}

async function findRelease(options = {}) {
  try {
    const account = await getWalletAccount();
    const destination = selectedDestination();
    const hasPendingReleaseAtStart = bridgeHasPending("release");
    const mayUpdateSilentReleaseUi = !options.silent || options.autoRetry === true;

    if (!options.silent) bridgeReleaseLog("Searching release signatures...", "");
    if (mayUpdateSilentReleaseUi && hasPendingReleaseAtStart && !activeRelease) {
      setText("[data-bridge-release-state]", "Checking release");
      setBridgeButtonState("[data-bridge-release]", "loading", "Checking release");
    }

    if (hasPendingReleaseAtStart && await releasePendingWasUsed(account)) {
      resetReleaseUiToIdle("USDT already released. Ready for a new sell.");
      refreshBridgeWalletBalances().catch(() => {});
      return null;
    }

    const entries = await loadReleasesForAccount(account);
    const preferred = entries.find(({ release, used }) => !used && releaseDestinationKey(release) === destination);
    const anyPending = entries.find(({ used }) => !used);
    const picked = preferred || anyPending;

    if (!picked) {
      const hasPendingRelease = bridgeHasPending("release");
      if (entries.length) {
        clearBridgePending("release");
        setText("[data-bridge-release-state]", "All releases used");
        setBridgeActionReady("[data-bridge-release]", false);
      } else if (hasPendingRelease) {
        setText("[data-bridge-release-state]", "Waiting signatures");
        setBridgeButtonState("[data-bridge-release]", "waiting", "Waiting signatures");
      } else {
        setText("[data-bridge-release-state]", "Waiting");
        setBridgeActionReady("[data-bridge-release]", false);
      }
      if (!options.silent) {
        bridgeReleaseLog(
          hasPendingRelease
            ? "No ready release found yet. Waiting bridge confirmations automatically."
            : "No pending release for this wallet.",
          hasPendingRelease ? "warn" : "ok"
        );
      }
      return null;
    }

    await prepareActiveRelease(picked.release, "ok");
    return picked.release;
  } catch (err) {
    console.error(err);
    if (bridgeHasPending("release")) {
      setText("[data-bridge-release-state]", "Retrying release");
      setBridgeButtonState("[data-bridge-release]", "waiting", "Retrying release");
    }
    if (!options.silent) bridgeReleaseLog(err?.message || "Could not find release.", "warn");
    return null;
  }
}

async function executeRelease() {
  try {
    if (!activeRelease) {
      setBridgeButtonState("[data-bridge-release]", "loading", "Finding release");
      await findRelease({ silent: false, autoRetry: true });
    }
    if (!activeRelease) {
      if (bridgeHasPending("release")) {
        setText("[data-bridge-release-state]", "Waiting signatures");
        setBridgeButtonState("[data-bridge-release]", "waiting", "Waiting signatures");
      } else {
        setBridgeActionReady("[data-bridge-release]", false);
      }
      return;
    }

    setBridgeButtonState("[data-bridge-release]", "loading", "Switch network");
    const destination = releaseDestinationKey(activeRelease);
    const chain = bridgeChainFor(destination);
    const lockboxAddress = destination === "bsc" ? LUSDT_BSC_LOCKBOX : LUSDT_POLYGON_LOCKBOX;
    const abi = destination === "bsc" ? LOCKBOX_BSC_ABI : LOCKBOX_POLYGON_ABI;

    await ensureWalletChain(chain);
    const signer = await browserSigner();
    const lockbox = new ethers.Contract(lockboxAddress, abi, signer);

    setBridgeButtonState("[data-bridge-release]", "loading", "Confirm release");
    bridgeReleaseLog(`Opening ${chain.name} release confirmation...`, "");
    const tx = await lockbox.release(
      activeRelease.recipient,
      BigInt(activeRelease.amount),
      BigInt(activeRelease.nonce),
      BigInt(activeRelease.deadline),
      activeRelease.signatures
    );
    setBridgeButtonState("[data-bridge-release]", "loading", "Release pending");
    bridgeReleaseLog(`Release sent: ${tx.hash}. Waiting confirmation...`, "");
    await waitBridgeTxWithProgress(tx, {
      selector: "[data-bridge-release]",
      baseLabel: `Release pending on ${chain.name}`,
      logFn: bridgeReleaseLog
    });
    setBridgeButtonState("[data-bridge-release]", "loading", "Finalizing");
    clearBridgePending("release");
    try { localStorage.removeItem("lustLastBurnNonce"); } catch (_) {}
    bridgeReleaseLog(`USDT released successfully. Tx: ${tx.hash}`, "ok");
    setText("[data-bridge-release-state]", "Released successfully");
    activeRelease = null;
    setBridgeActionReady("[data-bridge-release]", false);
    setBridgeButtonState("[data-bridge-burn]", "default", "Burn LUSDT");
    setTimeout(() => findRelease({ silent: true }).catch(() => {}), 2500);
  } catch (err) {
    console.error(err);
    if (activeRelease) setBridgeActionReady("[data-bridge-release]", true);
    else if (bridgeHasPending("release")) setBridgeButtonState("[data-bridge-release]", "waiting", "Retry release");
    bridgeReleaseLog(err?.shortMessage || err?.message || "Release failed or rejected.", "warn");
  }
}

function activeBridgeMode() {
  return document.querySelector("[data-bridge-tab].active")?.getAttribute("data-bridge-tab") || "deposit";
}

function bridgeOppositeNetwork(network) {
  return network === "bsc" ? "polygon" : "bsc";
}

async function selectBridgeNetwork(kind, network, shouldSwitchWallet = false) {
  const clean = network === "bsc" ? "bsc" : "polygon";
  const selector = kind === "destination" ? "[data-bridge-destination]" : "[data-bridge-source]";
  const select = document.querySelector(selector);
  if (select) select.value = clean;

  refreshBridgeUiLabels();
  updateBridgeQuote();
  refreshBridgeLiquidity();
  updateDestinationLiquidityNotice();
  refreshBridgeWalletBalances().catch(() => {});

  if (shouldSwitchWallet && walletState.connected) {
    try {
      const chain = bridgeChainFor(clean);
      bridgeLog(`Switching wallet to ${chain.name}...`, "");
      await ensureWalletChain(chain);
      bridgeLog(`Wallet switched to ${chain.name}.`, "ok");
      setTimeout(refreshBridgeWalletBalances, 700);
    } catch (err) {
      bridgeLog(err?.shortMessage || err?.message || "Could not switch wallet network automatically.", "warn");
    }
  }
}

window.lustBridgeSelectNetwork = selectBridgeNetwork;
window.lustBridgeCycleNetwork = function(kind) {
  const current = kind === "destination" ? selectedDestination() : selectedSource();
  const next = bridgeOppositeNetwork(current);
  selectBridgeNetwork(kind, next, false);
};

async function autoSwitchWalletForActiveMode() {
  if (!walletState.connected) return;
  try {
    if (activeBridgeMode() === "withdraw") {
      bridgeLog("Switching wallet to LUST Chain...", "");
      await ensureWalletChain(BRIDGE_CHAINS.lust);
      bridgeLog("Wallet switched to LUST Chain.", "ok");
    } else {
      const chain = bridgeChainFor(selectedSource());
      bridgeLog(`Switching wallet to ${chain.name}...`, "");
      await ensureWalletChain(chain);
      bridgeLog(`Wallet switched to ${chain.name}.`, "ok");
    }
    setTimeout(() => refreshBridgeWalletBalances().catch(() => {}), 600);
  } catch (err) {
    bridgeLog(err?.shortMessage || err?.message || "Could not switch wallet network automatically.", "warn");
  }
}

function wireLusdtBridge() {
  if (!document.querySelector("[data-lusdt-bridge]")) return;

  document.querySelectorAll("[data-bridge-tab]").forEach((tab) => {
    tab.addEventListener("click", async () => {
      const selected = tab.getAttribute("data-bridge-tab");
      document.querySelectorAll("[data-bridge-tab]").forEach((t) => t.classList.toggle("active", t === tab));
      document.querySelectorAll("[data-bridge-panel]").forEach((panel) => {
        panel.classList.toggle("hidden", panel.getAttribute("data-bridge-panel") !== selected);
      });
      refreshBridgeUiLabels();
      refreshBridgeWalletBalances().catch(() => {});
      updateDestinationLiquidityNotice();
    });
  });

  document.querySelectorAll("[data-bridge-amount],[data-withdraw-amount]").forEach((input) => {
    input.addEventListener("input", updateBridgeQuote);
  });
  document.querySelector("[data-bridge-source]")?.addEventListener("change", (event) => {
    selectBridgeNetwork("source", event.target.value || "polygon", false);
  });
  document.querySelector("[data-bridge-destination]")?.addEventListener("change", (event) => {
    selectBridgeNetwork("destination", event.target.value || "polygon", false);
    updateDestinationLiquidityNotice();
  });
  document.querySelectorAll("[data-bridge-network-cycle]").forEach((btn) => btn.addEventListener("click", (event) => {
    if (btn.getAttribute("onclick")) return;
    const kind = btn.getAttribute("data-bridge-network-cycle") || "source";
    window.lustBridgeCycleNetwork(kind);
  }));

  document.querySelector("[data-bridge-refresh]")?.addEventListener("click", refreshBridgeStatus);
  document.querySelectorAll("[data-bridge-refresh]").forEach((btn) => btn.addEventListener("click", refreshBridgeStatus));
  document.querySelectorAll(".bridge-pro-status details").forEach((details) => details.addEventListener("toggle", () => {
    if (details.open) {
      refreshBridgeWalletUi();
    }
  }));
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
    refreshBridgeWalletBalances().catch(() => {});
  }));
  document.querySelector("[data-bridge-max-deposit]")?.addEventListener("click", async () => {
    try {
      if (!walletState.connected || !walletState.address) throw new Error("Connect wallet first.");
      const sourceKind = selectedSource();
      const cfg = sourceToken(sourceKind);
      const chain = bridgeChainFor(sourceKind);
      const provider = new ethers.JsonRpcProvider(chain.rpcUrls[0]);
      const token = new ethers.Contract(cfg.address, ERC20_ABI, provider);
      const bal = await token.balanceOf(walletState.address);
      document.querySelector("[data-bridge-amount]").value = formatUnitsSafe(bal, cfg.decimals, 6);
      updateBridgeQuote();
      refreshBridgeWalletBalances().catch(() => {});
    } catch (err) {
      bridgeLog(err?.message || "Could not load source balance.", "warn");
    }
  });
  document.querySelector("[data-bridge-max-withdraw]")?.addEventListener("click", async () => {
    try {
      if (!walletState.address) throw new Error("Connect wallet first.");
      const provider = new ethers.JsonRpcProvider(BRIDGE_CHAINS.lust.rpcUrls[0]);
      const token = new ethers.Contract(LUSDT_TOKEN_ADDRESS, ERC20_ABI, provider);
      const bal = await token.balanceOf(walletState.address);
      document.querySelector("[data-withdraw-amount]").value = formatUnitsSafe(bal, 6, 6);
      updateBridgeQuote();
      refreshBridgeWalletBalances().catch(() => {});
    } catch (err) {
      bridgeLog(err?.message || "Could not load LUSDT balance.", "warn");
    }
  });
  document.querySelector("[data-bridge-deposit]")?.addEventListener("click", depositToLusdt);
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
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Opening release";
      try {
        await prepareActiveRelease(entry.release, "ok");
        await executeRelease();
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }
  });

  setBridgeActionReady("[data-bridge-mint]", false);
  setBridgeActionReady("[data-bridge-release]", false);
  updateBridgeQuote();
  refreshBridgeUiLabels();
  if (!bridgeHasPending("claim")) setBridgeActionReady("[data-bridge-mint]", false);
  if (!bridgeHasPending("release")) setBridgeActionReady("[data-bridge-release]", false);
  refreshBridgeStatus();
  refreshBridgeLiquidity();
  refreshBridgeWalletUi();
  setInterval(refreshBridgeStatus, 12000);
  setInterval(refreshBridgeLiquidity, 18000);
  setInterval(() => refreshBridgeWalletBalances().catch(() => {}), 6000);
  setInterval(() => {
    if (activeBridgeMode() === "deposit" || bridgeHasPending("claim")) {
      findClaim({ silent: true }).catch(() => {});
    }
  }, 10000);
  setInterval(() => {
    if (activeBridgeMode() === "withdraw" || bridgeHasPending("release")) {
      findRelease({ silent: true }).catch(() => {});
    }
  }, 10000);
}

wireLusdtBridge();

// LUST Community Staking Vault page v20260613-staking-v1
const LUST_STAKING_ADDRESS = "0x300D30d1585BE7865dC5005Eb3C08dd6Ec1C73f1";
const LUST_STAKING_ABI = [
  "function owner() view returns (address)",
  "function funded() view returns (bool)",
  "function stakingOpen() view returns (bool)",
  "function rewardReserve() view returns (uint256)",
  "function totalPrincipal() view returns (uint256)",
  "function totalRateWeight() view returns (uint256)",
  "function totalRewardsClaimed() view returns (uint256)",
  "function totalPenaltiesToReserve() view returns (uint256)",
  "function totalStakeTransactions() view returns (uint256)",
  "function totalPrincipalOf(address user) view returns (uint256)",
  "function userSummary(address user) view returns (uint256 activePrincipal,uint256 maxWalletPrincipal,uint256 walletRemainingCapacity,uint256 claimableRewards,uint256 nextClaimTime,bool canClaimNow)",
  "function positionOf(address user,uint8 planId) view returns (uint256 principal,uint256 rateWeight,uint256 unlockAt,uint256 rewardDebt,uint256 storedPendingRewards,uint256 livePendingRewards,uint256 claimedDuringLock,bool active,bool unlocked)",
  "function pendingRewardsOf(address user) view returns (uint256)",
  "function nextClaimAt(address user) view returns (uint256)",
  "function canAcceptNewStakeFor(address user,uint8 planId,uint256 amount) view returns (bool)",
  "function reserveStatus() view returns (uint256 currentRewardReserve,uint256 projectedDailyRewards,uint256 runwaySeconds,bool reserveLow,bool acceptsNewStakesNow)",
  "function vaultAccounting() view returns (uint256 nativeBalance,uint256 activeUserPrincipal,uint256 simulatedUnallocatedRewardReserve,uint256 allocatedOrUnclaimedRewards,uint256 activeRateWeight)",
  "function preLaunchWithdrawAvailable() view returns (bool available,uint256 amount)",
  "function previewUnstake(address user,uint8 planId,uint256 amount) view returns (uint256 principalOut,uint256 penaltyToReserve,uint256 pendingRewardsForfeited,uint256 claimedRewardsClawedBack,uint256 netAmount,bool earlyExit)",
  "function stake(uint8 planId) payable",
  "function claimAll()",
  "function compound(uint8 planId)",
  "function unstake(uint8 planId,uint256 amount)",
  "function unstakeAll(uint8 planId)",
  "function openStaking()"
];

const STAKING_PLANS = [
  { id: 0, name: "LUST Spark", apr: "6% APR", lock: "30 days", penalty: "3%" },
  { id: 1, name: "LUST Flame", apr: "10% APR", lock: "90 days", penalty: "5%" },
  { id: 2, name: "LUST Diamond", apr: "15% APR", lock: "180 days", penalty: "8%" },
  { id: 3, name: "LUST Eternal", apr: "20% APR", lock: "360 days", penalty: "12%" }
];

let stakingSelectedPlan = 3;
let stakingLastSnapshot = null;
let stakingRefreshBusy = false;

function hasStakingPage() {
  return Boolean(document.querySelector("[data-lust-staking]"));
}

function stakingSetText(selector, text) {
  document.querySelectorAll(selector).forEach((el) => { el.textContent = text; });
}

function stakingSetHtml(selector, html) {
  document.querySelectorAll(selector).forEach((el) => { el.innerHTML = html; });
}

function stakingLog(message, tone = "") {
  document.querySelectorAll("[data-staking-log]").forEach((el) => {
    el.textContent = message;
    el.dataset.tone = tone;
  });
}

function stakingFormatLst(value, maxFraction = 4) {
  try {
    const formatted = ethers.formatEther(value || 0n);
    const n = Number(formatted);
    if (!Number.isFinite(n)) return `${formatted} LST`;
    return `${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: maxFraction,
      minimumFractionDigits: n > 0 && n < 1 ? Math.min(maxFraction, 2) : 0
    }).format(n)} LST`;
  } catch (_) {
    return "--";
  }
}

function stakingFormatCompactLst(value) {
  try {
    const n = Number(ethers.formatEther(value || 0n));
    if (!Number.isFinite(n)) return "--";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M LST`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K LST`;
    return `${n.toFixed(n >= 100 ? 0 : 2)} LST`;
  } catch (_) {
    return "--";
  }
}

function stakingParseAmount(input) {
  const raw = String(input || "").trim().replace(/,/g, ".");
  if (!raw || Number(raw) <= 0) return 0n;
  return ethers.parseEther(raw);
}

function stakingSecondsToText(secondsLike) {
  try {
    const seconds = Number(secondsLike || 0n);
    if (!Number.isFinite(seconds)) return "Long runway";
    if (seconds > 3650 * 86400) return "Very strong";
    if (seconds <= 0) return "0 days";
    const days = Math.floor(seconds / 86400);
    if (days >= 365) return `${Math.floor(days / 365)}y ${days % 365}d`;
    if (days >= 1) return `${days} days`;
    const hours = Math.floor(seconds / 3600);
    if (hours >= 1) return `${hours} hours`;
    return `${Math.max(0, Math.floor(seconds / 60))} min`;
  } catch (_) {
    return "--";
  }
}

function stakingTimeUntil(timestampLike) {
  const ts = Number(timestampLike || 0n);
  if (!ts) return "No stake yet";
  const diff = ts - Math.floor(Date.now() / 1000);
  if (diff <= 0) return "Available now";
  return stakingSecondsToText(diff);
}

function stakingDateText(timestampLike) {
  const ts = Number(timestampLike || 0n);
  if (!ts) return "--";
  return new Date(ts * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function stakingReadContract() {
  const provider = new ethers.JsonRpcProvider(LUST_RPC_URL);
  return new ethers.Contract(LUST_STAKING_ADDRESS, LUST_STAKING_ABI, provider);
}

async function stakingEnsureLustNetwork() {
  const eth = getInjectedEthereum();
  if (!eth) throw new Error("MetaMask or injected wallet not found.");
  const current = normalizeChainId(await eth.request({ method: "eth_chainId" }));
  if (current === LUST_CHAIN_ID_HEX) return;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: LUST_CHAIN_ID_HEX }] });
  } catch (_) {
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
  }
  setTimeout(readState, 300);
}

async function stakingSignerContract() {
  const eth = getInjectedEthereum();
  if (!eth) throw new Error("MetaMask or injected wallet not found.");
  await getWalletAccount();
  await stakingEnsureLustNetwork();
  const provider = new ethers.BrowserProvider(eth);
  const signer = await provider.getSigner();
  return new ethers.Contract(LUST_STAKING_ADDRESS, LUST_STAKING_ABI, signer);
}

function stakingSelectedPlanData() {
  return STAKING_PLANS.find((p) => p.id === stakingSelectedPlan) || STAKING_PLANS[3];
}

function renderStakingSelectedPlan() {
  const selected = stakingSelectedPlanData();
  document.querySelectorAll("[data-select-plan]").forEach((card) => {
    card.classList.toggle("active", Number(card.getAttribute("data-select-plan")) === stakingSelectedPlan);
  });
  stakingSetText("[data-staking-selected-plan]", selected.name);
  refreshStakingStakeAvailability().catch(() => {});
  refreshStakingUnstakePreview().catch(() => {});
}

function setStakingActionState(selector, ready, labelWhenReady = null) {
  document.querySelectorAll(selector).forEach((btn) => {
    btn.disabled = !ready;
    btn.classList.toggle("is-ready", ready);
    if (labelWhenReady) btn.textContent = labelWhenReady;
  });
}

async function refreshStakingStakeAvailability() {
  if (!hasStakingPage() || !stakingLastSnapshot) return;
  const amountRaw = document.querySelector("[data-stake-amount]")?.value || "";
  let canAccept = false;
  let label = "--";
  try {
    const amount = stakingParseAmount(amountRaw);
    if (!walletState.address) {
      label = "Connect wallet";
    } else if (!stakingLastSnapshot.stakingOpen) {
      label = "Not open yet";
    } else if (amount <= 0n) {
      label = "Enter amount";
    } else {
      const c = stakingReadContract();
      canAccept = await c.canAcceptNewStakeFor(walletState.address, stakingSelectedPlan, amount);
      label = canAccept ? "Yes" : "No / reserve or limit";
    }
  } catch (err) {
    label = "Check failed";
  }
  stakingSetText("[data-staking-can-accept]", label);
  setStakingActionState("[data-stake-submit]", Boolean(canAccept), "Stake LST");
}

async function refreshStakingUnstakePreview() {
  if (!hasStakingPage()) return;
  const amountRaw = document.querySelector("[data-unstake-amount]")?.value || "";
  if (!walletState.address || !amountRaw) {
    stakingSetText("[data-preview-principal]", "--");
    stakingSetText("[data-preview-penalty]", "--");
    stakingSetText("[data-preview-forfeit]", "--");
    stakingSetText("[data-preview-clawback]", "--");
    stakingSetText("[data-preview-net]", "--");
    return;
  }
  try {
    const amount = stakingParseAmount(amountRaw);
    if (amount <= 0n) throw new Error("Invalid amount");
    const c = stakingReadContract();
    const preview = await c.previewUnstake(walletState.address, stakingSelectedPlan, amount);
    stakingSetText("[data-preview-principal]", stakingFormatLst(preview.principalOut));
    stakingSetText("[data-preview-penalty]", stakingFormatLst(preview.penaltyToReserve));
    stakingSetText("[data-preview-forfeit]", stakingFormatLst(preview.pendingRewardsForfeited));
    stakingSetText("[data-preview-clawback]", stakingFormatLst(preview.claimedRewardsClawedBack));
    stakingSetText("[data-preview-net]", stakingFormatLst(preview.netAmount));
  } catch (_) {
    stakingSetText("[data-preview-principal]", "--");
    stakingSetText("[data-preview-penalty]", "--");
    stakingSetText("[data-preview-forfeit]", "--");
    stakingSetText("[data-preview-clawback]", "--");
    stakingSetText("[data-preview-net]", "Invalid amount");
  }
}

async function refreshLustStaking() {
  if (!hasStakingPage() || stakingRefreshBusy) return;
  stakingRefreshBusy = true;
  try {
    readState();
    const c = stakingReadContract();
    const [ownerAddress, funded, stakingOpen, reserve, totalPrincipalValue, reserveStatus, accounting, stakeTxs] = await Promise.all([
      c.owner(),
      c.funded(),
      c.stakingOpen(),
      c.rewardReserve(),
      c.totalPrincipal(),
      c.reserveStatus(),
      c.vaultAccounting(),
      c.totalStakeTransactions().catch(() => 0n)
    ]);

    stakingLastSnapshot = { ownerAddress, funded, stakingOpen, reserve, totalPrincipalValue, reserveStatus, accounting, stakeTxs };

    const currentReserve = reserveStatus.currentRewardReserve ?? reserveStatus[0];
    const dailyRewards = reserveStatus.projectedDailyRewards ?? reserveStatus[1];
    const runwaySeconds = reserveStatus.runwaySeconds ?? reserveStatus[2];
    const reserveLow = reserveStatus.reserveLow ?? reserveStatus[3];
    const acceptsNew = reserveStatus.acceptsNewStakesNow ?? reserveStatus[4];

    stakingSetText("[data-staking-reserve]", stakingFormatCompactLst(currentReserve));
    stakingSetText("[data-staking-total-principal]", stakingFormatCompactLst(totalPrincipalValue));
    stakingSetText("[data-staking-daily-rewards]", stakingFormatLst(dailyRewards, 3));
    stakingSetText("[data-staking-runway]", stakingSecondsToText(runwaySeconds));

    if (!funded) {
      stakingSetText("[data-staking-status]", "Not funded");
      stakingSetText("[data-staking-status-note]", "The staking reserve has not been funded yet.");
    } else if (!stakingOpen) {
      stakingSetText("[data-staking-status]", "Funded · Waiting launch");
      stakingSetText("[data-staking-status-note]", "The 5,000,000 LST reserve is funded. Staking opens after public mining/community launch.");
    } else if (reserveLow || !acceptsNew) {
      stakingSetText("[data-staking-status]", "Reserve protection active");
      stakingSetText("[data-staking-status-note]", "New stakes are blocked automatically while claim and unstake remain available.");
    } else {
      stakingSetText("[data-staking-status]", "Open for staking");
      stakingSetText("[data-staking-status-note]", "Stake LST, claim daily and track your lock from this page.");
    }

    const isOwner = walletState.address && ownerAddress && walletState.address.toLowerCase() === ownerAddress.toLowerCase();
    document.querySelectorAll("[data-owner-panel]").forEach((el) => { el.hidden = !isOwner; });
    setStakingActionState("[data-open-staking]", Boolean(isOwner && funded && !stakingOpen), "Open staking");

    if (walletState.address) {
      const provider = new ethers.JsonRpcProvider(LUST_RPC_URL);
      const [balance, summary, positions] = await Promise.all([
        provider.getBalance(walletState.address),
        c.userSummary(walletState.address),
        Promise.all([0, 1, 2, 3].map((id) => c.positionOf(walletState.address, id)))
      ]);

      stakingSetText("[data-staking-wallet-balance]", stakingFormatLst(balance, 4));
      stakingSetText("[data-staking-wallet-capacity]", stakingFormatLst(summary.walletRemainingCapacity ?? summary[2], 2));
      stakingSetText("[data-staking-claimable]", stakingFormatLst(summary.claimableRewards ?? summary[3], 6));
      const canClaimNow = Boolean(summary.canClaimNow ?? summary[5]);
      const nextClaimTime = summary.nextClaimTime ?? summary[4];
      stakingSetText("[data-staking-next-claim]", canClaimNow ? "Claim available now." : `Next claim: ${stakingTimeUntil(nextClaimTime)} · ${stakingDateText(nextClaimTime)}`);
      setStakingActionState("[data-claim-submit]", canClaimNow, "Claim rewards");
      setStakingActionState("[data-compound-submit]", canClaimNow, "Compound to selected plan");

      positions.forEach((p, index) => {
        const principal = p.principal ?? p[0];
        const unlockAt = p.unlockAt ?? p[2];
        const livePending = p.livePendingRewards ?? p[5];
        const active = Boolean(p.active ?? p[7]);
        const unlocked = Boolean(p.unlocked ?? p[8]);
        stakingSetText(`[data-pos-principal="${index}"]`, stakingFormatLst(principal, 4));
        let stateText = active ? `${unlocked ? "Unlocked" : `Unlocks in ${stakingTimeUntil(unlockAt)}`} · pending ${stakingFormatLst(livePending, 4)}` : "No active stake";
        stakingSetText(`[data-pos-state="${index}"]`, stateText);
        document.querySelectorAll(`[data-position-card="${index}"]`).forEach((el) => {
          el.classList.toggle("selected", index === stakingSelectedPlan);
          el.classList.toggle("empty", !active);
        });
      });
    } else {
      stakingSetText("[data-staking-wallet-balance]", "Connect wallet");
      stakingSetText("[data-staking-wallet-capacity]", "Connect wallet");
      stakingSetText("[data-staking-claimable]", "--");
      stakingSetText("[data-staking-next-claim]", "Connect wallet to check claim time.");
      setStakingActionState("[data-claim-submit]", false, "Claim rewards");
      setStakingActionState("[data-compound-submit]", false, "Compound to selected plan");
      [0, 1, 2, 3].forEach((index) => {
        stakingSetText(`[data-pos-principal="${index}"]`, "--");
        stakingSetText(`[data-pos-state="${index}"]`, "Connect wallet");
      });
    }

    await refreshStakingStakeAvailability();
    await refreshStakingUnstakePreview();
    if (funded && !stakingOpen) {
      stakingLog("Vault funded and safely closed. Do not open staking until public mining/community launch is ready.", "ok");
    } else if (stakingOpen) {
      stakingLog("Vault live. Daily claims are available every 24 hours for active stakers.", "ok");
    }
  } catch (err) {
    console.error(err);
    stakingLog(err?.message || "Could not load staking vault.", "warn");
  } finally {
    stakingRefreshBusy = false;
  }
}

async function stakingSend(actionName, callback) {
  try {
    stakingLog(`${actionName}: waiting wallet confirmation...`, "");
    const tx = await callback();
    stakingLog(`${actionName}: transaction sent ${tx.hash}. Waiting confirmation...`, "");
    const receipt = await tx.wait();
    if (receipt?.status === 1) {
      stakingLog(`${actionName}: confirmed successfully.`, "ok");
    } else {
      stakingLog(`${actionName}: transaction finished but may have failed.`, "warn");
    }
    setTimeout(refreshLustStaking, 800);
  } catch (err) {
    console.error(err);
    stakingLog(err?.shortMessage || err?.reason || err?.message || `${actionName} failed.`, "warn");
  }
}

async function stakeLSTFromPage() {
  if (!walletState.address) {
    await openLustWallet();
    return;
  }
  const amount = stakingParseAmount(document.querySelector("[data-stake-amount]")?.value || "");
  if (amount <= 0n) {
    stakingLog("Enter a valid LST amount to stake.", "warn");
    return;
  }
  await stakingSend("Stake", async () => {
    const c = await stakingSignerContract();
    return await c.stake(stakingSelectedPlan, { value: amount });
  });
}

async function claimLSTFromPage() {
  if (!walletState.address) {
    await openLustWallet();
    return;
  }
  await stakingSend("Claim", async () => {
    const c = await stakingSignerContract();
    return await c.claimAll();
  });
}

async function compoundLSTFromPage() {
  if (!walletState.address) {
    await openLustWallet();
    return;
  }
  await stakingSend("Compound", async () => {
    const c = await stakingSignerContract();
    return await c.compound(stakingSelectedPlan);
  });
}

async function unstakeLSTFromPage(all = false) {
  if (!walletState.address) {
    await openLustWallet();
    return;
  }
  const amount = stakingParseAmount(document.querySelector("[data-unstake-amount]")?.value || "");
  await stakingSend(all ? "Unstake all" : "Unstake", async () => {
    const c = await stakingSignerContract();
    if (all) return await c.unstakeAll(stakingSelectedPlan);
    if (amount <= 0n) throw new Error("Enter a valid unstake amount.");
    return await c.unstake(stakingSelectedPlan, amount);
  });
}

async function openStakingFromPage() {
  if (!confirm("Open staking only when public mining/community launch is ready. After opening, native owner withdrawal is impossible. Continue?")) return;
  await stakingSend("Open staking", async () => {
    const c = await stakingSignerContract();
    return await c.openStaking();
  });
}

function wireLustStaking() {
  if (!hasStakingPage()) return;

  document.querySelectorAll("[data-select-plan], [data-position-card]").forEach((el) => {
    el.addEventListener("click", () => {
      const raw = el.getAttribute("data-select-plan") ?? el.getAttribute("data-position-card");
      stakingSelectedPlan = Number(raw || 0);
      renderStakingSelectedPlan();
    });
  });

  document.querySelector("[data-staking-scroll]")?.addEventListener("click", () => {
    document.querySelector("#stake")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelector("[data-stake-amount]")?.addEventListener("input", () => refreshStakingStakeAvailability().catch(() => {}));
  document.querySelector("[data-unstake-amount]")?.addEventListener("input", () => refreshStakingUnstakePreview().catch(() => {}));

  document.querySelector("[data-stake-max]")?.addEventListener("click", () => {
    const capacityText = document.querySelector("[data-staking-wallet-capacity]")?.textContent || "";
    const n = Number(capacityText.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(n) && n > 0) {
      document.querySelector("[data-stake-amount]").value = String(Math.min(n, 10000));
      refreshStakingStakeAvailability().catch(() => {});
    }
  });

  document.querySelector("[data-unstake-max]")?.addEventListener("click", () => {
    const principalText = document.querySelector(`[data-pos-principal="${stakingSelectedPlan}"]`)?.textContent || "";
    const n = Number(principalText.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(n) && n > 0) {
      document.querySelector("[data-unstake-amount]").value = String(n);
      refreshStakingUnstakePreview().catch(() => {});
    }
  });

  document.querySelector("[data-stake-submit]")?.addEventListener("click", stakeLSTFromPage);
  document.querySelector("[data-claim-submit]")?.addEventListener("click", claimLSTFromPage);
  document.querySelector("[data-compound-submit]")?.addEventListener("click", compoundLSTFromPage);
  document.querySelector("[data-unstake-submit]")?.addEventListener("click", () => unstakeLSTFromPage(false));
  document.querySelector("[data-unstake-all]")?.addEventListener("click", () => unstakeLSTFromPage(true));
  document.querySelector("[data-open-staking]")?.addEventListener("click", openStakingFromPage);

  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-connect-wallet]")) return;
    setTimeout(refreshLustStaking, 900);
    setTimeout(refreshLustStaking, 2500);
  });

  document.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-copy]");
    if (!btn) return;
    try {
      await navigator.clipboard.writeText(btn.getAttribute("data-copy") || "");
      stakingLog("Contract address copied.", "ok");
    } catch (_) {
      stakingLog("Could not copy address.", "warn");
    }
  });

  renderStakingSelectedPlan();
  refreshLustStaking();
  setInterval(refreshLustStaking, 12000);
}

wireLustStaking();

// LUST P2P LST/LUSDT market v20260613-p2p-lusdt-v1
const LUST_P2P_MARKET_ADDRESS = "0xcd821ede23048f8fea777eeec3948135758e4926";
const P2P_FEE_BPS = 2n;
const P2P_BPS_DENOM = 10000n;
const P2P_ABI = [
  "function LUSDT() view returns (address)",
  "function treasury() view returns (address)",
  "function nextOrderId() view returns (uint256)",
  "function orders(uint256) view returns (uint8 side,address maker,uint256 priceLusdtPer1e18Lst,uint256 remainingLst,uint256 remainingLusdt,uint64 deadline,bool active)",
  "function quoteLusdtGross(uint256 lstAmount,uint256 priceLusdtPer1e18Lst) pure returns (uint256)",
  "function feeOf(uint256 lusdtGross) pure returns (uint256)",
  "function createSellOrder(uint256 priceLusdtPer1e18Lst,uint64 deadline) payable returns (uint256 orderId)",
  "function createBuyOrder(uint256 lstWanted,uint256 priceLusdtPer1e18Lst,uint64 deadline) returns (uint256 orderId)",
  "function fillSellOrder(uint256 orderId,uint256 lstToBuy,uint256 maxLusdtGross)",
  "function fillBuyOrder(uint256 orderId,uint256 lstToSell,uint256 minLusdtNet) payable",
  "function updatePrice(uint256 orderId,uint256 newPriceLusdtPer1e18Lst)",
  "function updateDeadline(uint256 orderId,uint64 newDeadline)",
  "function addLstToSellOrder(uint256 orderId) payable",
  "function removeLstFromSellOrder(uint256 orderId,uint256 lstToRemove)",
  "function addLusdtToBuyOrder(uint256 orderId,uint256 lusdtToAdd)",
  "function reduceBuyOrder(uint256 orderId,uint256 lstToReduce)",
  "function cancelOrder(uint256 orderId)",
  "event OrderCreated(uint256 indexed orderId,uint8 side,address indexed maker,uint256 priceLusdtPer1e18Lst,uint256 lstAmount,uint256 lusdtAmount,uint64 deadline)",
  "event OrderFilled(uint256 indexed orderId,address indexed maker,address indexed taker,uint256 lstFilled,uint256 lusdtGross,uint256 feeLusdt,uint256 lusdtNetToMakerOrTaker)",
  "event OrderCancelled(uint256 indexed orderId,address indexed maker,uint256 refundLst,uint256 refundLusdt)"
];

function hasP2PPage() {
  return Boolean(document.querySelector("[data-p2p-market]"));
}

function p2pSetText(selector, value) {
  document.querySelectorAll(selector).forEach((el) => { el.textContent = value; });
}

function p2pLog(message, tone = "") {
  document.querySelectorAll("[data-p2p-log]").forEach((el) => {
    el.textContent = message;
    el.dataset.tone = tone;
  });
}

function p2pShort(value) {
  return value ? `${String(value).slice(0, 6)}...${String(value).slice(-4)}` : "--";
}

function p2pEsc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function p2pTrimNumber(text, minDecimals = 2, maxDecimals = 6) {
  const [whole, frac = ""] = String(text || "0").split(".");
  const cleaned = frac.padEnd(minDecimals, "0").slice(0, maxDecimals).replace(/0+$/, "");
  const finalFrac = cleaned.padEnd(minDecimals, "0");
  return finalFrac ? `${whole}.${finalFrac}` : whole;
}

function p2pFormatToken(value, decimals = 18, symbol = "", precision = 6) {
  try {
    const formatted = ethers.formatUnits(BigInt(value || 0), decimals);
    return `${p2pTrimNumber(formatted, decimals === 6 ? 2 : 2, precision)}${symbol ? ` ${symbol}` : ""}`;
  } catch (_) {
    return `0.00${symbol ? ` ${symbol}` : ""}`;
  }
}

function p2pFormatLst(value) {
  return p2pFormatToken(value, 18, "LST", 6);
}

function p2pFormatLusdt(value) {
  return p2pFormatToken(value, 6, "LUSDT", 6);
}

function p2pFormatPrice(value) {
  return `${p2pTrimNumber(ethers.formatUnits(BigInt(value || 0), 6), 2, 6)} LUSDT`;
}

function p2pParseLst(selectorOrValue) {
  const raw = selectorOrValue instanceof Element ? selectorOrValue.value : String(selectorOrValue || "");
  const value = String(raw || "").trim();
  if (!value || Number(value) <= 0) throw new Error("Enter a valid LST amount.");
  return ethers.parseUnits(value, 18);
}

function p2pParseLusdt(selectorOrValue, allowZero = false) {
  const raw = selectorOrValue instanceof Element ? selectorOrValue.value : String(selectorOrValue || "");
  const value = String(raw || "").trim();
  if (!value) return allowZero ? 0n : (() => { throw new Error("Enter a valid LUSDT amount."); })();
  if (Number(value) < 0 || (!allowZero && Number(value) <= 0)) throw new Error("Enter a valid LUSDT amount.");
  return ethers.parseUnits(value, 6);
}

function p2pParsePrice(selectorOrValue) {
  const raw = selectorOrValue instanceof Element ? selectorOrValue.value : String(selectorOrValue || "");
  const value = String(raw || "").trim();
  if (!value || Number(value) <= 0) throw new Error("Enter a valid price.");
  return ethers.parseUnits(value, 6);
}

function p2pDeadlineFromDays(selector) {
  const el = document.querySelector(selector);
  const raw = String(el?.value || "").trim();
  if (!raw || Number(raw) <= 0) return 0;
  const days = Math.floor(Number(raw));
  if (!Number.isFinite(days) || days < 0) throw new Error("Enter a valid deadline in days.");
  return Math.floor(Date.now() / 1000) + days * 86400;
}

function p2pQuoteLocal(lstAmount, priceLusdtPer1e18Lst) {
  return BigInt(lstAmount) * BigInt(priceLusdtPer1e18Lst) / 1000000000000000000n;
}

function p2pFeeOf(lusdtGross) {
  return BigInt(lusdtGross || 0) * P2P_FEE_BPS / P2P_BPS_DENOM;
}

function p2pProviderContract() {
  const provider = new ethers.JsonRpcProvider(LUST_RPC_URL, { chainId: LUST_CHAIN_ID_DECIMAL, name: "LUST Chain" });
  return new ethers.Contract(LUST_P2P_MARKET_ADDRESS, P2P_ABI, provider);
}

async function p2pSignerContract() {
  await ensureWalletChain("lust");
  const signer = await browserSigner();
  return { signer, contract: new ethers.Contract(LUST_P2P_MARKET_ADDRESS, P2P_ABI, signer) };
}

async function p2pApproveIfNeeded(signer, amount) {
  if (BigInt(amount || 0) <= 0n) return null;
  const owner = await signer.getAddress();
  const token = new ethers.Contract(LUSDT_TOKEN_ADDRESS, ERC20_ABI, signer);
  const allowance = await token.allowance(owner, LUST_P2P_MARKET_ADDRESS);
  if (allowance >= amount) return null;
  p2pLog(`Opening LUSDT approval for ${p2pFormatLusdt(amount)}...`, "");
  const tx = await token.approve(LUST_P2P_MARKET_ADDRESS, amount);
  p2pLog(`Approval sent: ${tx.hash}. Waiting confirmation...`, "");
  await tx.wait();
  return tx.hash;
}

async function p2pReadOrder(orderId, contract = null) {
  const c = contract || p2pProviderContract();
  const raw = await c.orders(orderId);
  return {
    id: Number(orderId),
    side: Number(raw.side ?? raw[0]),
    maker: raw.maker ?? raw[1],
    price: BigInt(raw.priceLusdtPer1e18Lst ?? raw[2]),
    remainingLst: BigInt(raw.remainingLst ?? raw[3]),
    remainingLusdt: BigInt(raw.remainingLusdt ?? raw[4]),
    deadline: Number(raw.deadline ?? raw[5]),
    active: Boolean(raw.active ?? raw[6])
  };
}

function p2pDeadlineLabel(deadline) {
  if (!deadline) return "No deadline";
  const ms = Number(deadline) * 1000;
  if (Date.now() > ms) return "Expired";
  return new Date(ms).toLocaleString();
}

function p2pRenderOrderCard(order, isMine = false) {
  const isSell = order.side === 0;
  const quote = p2pQuoteLocal(order.remainingLst, order.price);
  const fee = p2pFeeOf(quote);
  const net = quote > fee ? quote - fee : 0n;
  const sideLabel = isSell ? "SELL LST" : "BUY LST";
  const sideClass = isSell ? "sell" : "buy";
  const actionLabel = isSell ? "Buy this LST" : "Sell into order";
  const expired = order.deadline && Date.now() > order.deadline * 1000;

  return `
    <article class="p2p-order-card ${expired ? "is-expired" : ""}">
      <div class="p2p-order-top">
        <div class="p2p-order-id">
          <span class="p2p-side ${sideClass}">${sideLabel}${expired ? " · EXPIRED" : ""}</span>
          <strong>#${order.id}</strong>
        </div>
        <a class="btn" href="https://explorer.lustchain.org/address/${LUST_P2P_MARKET_ADDRESS}" target="_blank" rel="noreferrer">Contract</a>
      </div>
      <div class="p2p-order-grid">
        <div><span>Maker</span><strong title="${p2pEsc(order.maker)}">${p2pEsc(p2pShort(order.maker))}</strong></div>
        <div><span>Price</span><strong>${p2pEsc(p2pFormatPrice(order.price))}</strong></div>
        <div><span>Remaining LST</span><strong>${p2pEsc(p2pFormatLst(order.remainingLst))}</strong></div>
        <div><span>${isSell ? "Buyer gross" : "Seller net"}</span><strong>${p2pEsc(isSell ? p2pFormatLusdt(quote) : p2pFormatLusdt(net))}</strong></div>
        <div><span>Fee est.</span><strong>${p2pEsc(p2pFormatLusdt(fee))}</strong></div>
        <div><span>Deadline</span><strong>${p2pEsc(p2pDeadlineLabel(order.deadline))}</strong></div>
      </div>
      <div class="p2p-order-actions">
        ${!expired ? `<button class="btn primary" type="button" data-p2p-use-order data-side="${order.side}" data-id="${order.id}" data-amount="${ethers.formatUnits(order.remainingLst, 18)}">${actionLabel}</button>` : ""}
        ${isMine ? `<button class="btn" type="button" data-p2p-manage-order data-id="${order.id}">Manage</button>` : ""}
      </div>
    </article>
  `;
}

function p2pRenderOrderLists(orders) {
  const wallet = String(walletState.address || "").toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const openOrders = orders.filter((o) => o.active && (!o.deadline || o.deadline >= now) && o.remainingLst > 0n);
  const sells = openOrders.filter((o) => o.side === 0);
  const buys = openOrders.filter((o) => o.side === 1);
  const mine = orders.filter((o) => o.active && wallet && String(o.maker).toLowerCase() === wallet);

  const sellHtml = sells.length ? sells.map((o) => p2pRenderOrderCard(o, wallet && String(o.maker).toLowerCase() === wallet)).join("") : `<div class="notice compact">No open sell orders yet.</div>`;
  const buyHtml = buys.length ? buys.map((o) => p2pRenderOrderCard(o, wallet && String(o.maker).toLowerCase() === wallet)).join("") : `<div class="notice compact">No open buy orders yet.</div>`;
  const myHtml = wallet
    ? (mine.length ? mine.map((o) => p2pRenderOrderCard(o, true)).join("") : `<div class="notice compact">No active orders from this wallet.</div>`)
    : `<div class="notice compact">Connect wallet to see your active orders.</div>`;

  document.querySelectorAll("[data-p2p-sell-orders]").forEach((el) => { el.innerHTML = sellHtml; });
  document.querySelectorAll("[data-p2p-buy-orders]").forEach((el) => { el.innerHTML = buyHtml; });
  document.querySelectorAll("[data-p2p-my-orders]").forEach((el) => { el.innerHTML = myHtml; });
}

async function p2pRefreshBalances() {
  if (!hasP2PPage()) return;
  readState();
  p2pSetText("[data-p2p-contract-short]", p2pShort(LUST_P2P_MARKET_ADDRESS));

  const address = walletState.address || "";
  if (!address) {
    p2pSetText("[data-p2p-lst-balance]", "Connect wallet");
    p2pSetText("[data-p2p-lusdt-balance]", "Connect wallet");
    p2pSetText("[data-p2p-lusdt-allowance]", "Connect wallet");
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(LUST_RPC_URL, { chainId: LUST_CHAIN_ID_DECIMAL, name: "LUST Chain" });
    const token = new ethers.Contract(LUSDT_TOKEN_ADDRESS, ERC20_ABI, provider);
    const [lstBalance, lusdtBalance, allowance] = await Promise.all([
      provider.getBalance(address),
      token.balanceOf(address),
      token.allowance(address, LUST_P2P_MARKET_ADDRESS)
    ]);
    p2pSetText("[data-p2p-lst-balance]", p2pFormatLst(lstBalance));
    p2pSetText("[data-p2p-lusdt-balance]", p2pFormatLusdt(lusdtBalance));
    p2pSetText("[data-p2p-lusdt-allowance]", p2pFormatLusdt(allowance));
  } catch (err) {
    console.warn(err);
    p2pSetText("[data-p2p-lst-balance]", "--");
    p2pSetText("[data-p2p-lusdt-balance]", "--");
    p2pSetText("[data-p2p-lusdt-allowance]", "--");
  }
}

async function p2pRefreshOrders() {
  if (!hasP2PPage()) return;
  try {
    p2pLog("Loading live P2P order book...", "");
    const c = p2pProviderContract();
    const next = await c.nextOrderId();
    const latest = Number(next > 1n ? next - 1n : 0n);
    if (!latest) {
      p2pRenderOrderLists([]);
      p2pLog("P2P market is ready. No orders yet.", "ok");
      return;
    }

    const start = Math.max(1, latest - 79);
    const orders = [];
    for (let i = latest; i >= start; i -= 1) {
      try {
        const o = await p2pReadOrder(i, c);
        if (o.maker && o.maker !== ethers.ZeroAddress) orders.push(o);
      } catch (err) {
        console.warn("Could not read P2P order", i, err);
      }
    }

    p2pRenderOrderLists(orders);
    const openCount = orders.filter((o) => o.active && (!o.deadline || Date.now() <= o.deadline * 1000)).length;
    p2pLog(`Market refreshed. Latest order #${latest}. Open active orders shown: ${openCount}.`, "ok");
  } catch (err) {
    console.error(err);
    p2pLog(err?.message || "Could not load P2P orders.", "warn");
  }
}

function p2pUpdateQuotes() {
  try {
    const sellAmountEl = document.querySelector("[data-p2p-sell-amount]");
    const sellPriceEl = document.querySelector("[data-p2p-sell-price]");
    if (sellAmountEl && sellPriceEl) {
      const amount = sellAmountEl.value ? ethers.parseUnits(String(sellAmountEl.value), 18) : 0n;
      const price = sellPriceEl.value ? ethers.parseUnits(String(sellPriceEl.value), 6) : 0n;
      p2pSetText("[data-p2p-sell-quote]", p2pFormatLusdt(p2pQuoteLocal(amount, price)));
    }
  } catch (_) {
    p2pSetText("[data-p2p-sell-quote]", "0.000000 LUSDT");
  }

  try {
    const buyAmountEl = document.querySelector("[data-p2p-buy-amount]");
    const buyPriceEl = document.querySelector("[data-p2p-buy-price]");
    if (buyAmountEl && buyPriceEl) {
      const amount = buyAmountEl.value ? ethers.parseUnits(String(buyAmountEl.value), 18) : 0n;
      const price = buyPriceEl.value ? ethers.parseUnits(String(buyPriceEl.value), 6) : 0n;
      p2pSetText("[data-p2p-buy-quote]", p2pFormatLusdt(p2pQuoteLocal(amount, price)));
    }
  } catch (_) {
    p2pSetText("[data-p2p-buy-quote]", "0.000000 LUSDT");
  }
}

async function p2pAfterTx(message) {
  p2pLog(message, "ok");
  setTimeout(p2pRefreshBalances, 1400);
  setTimeout(p2pRefreshOrders, 1800);
}

async function p2pSend(label, callback) {
  try {
    p2pLog(`${label}: preparing wallet confirmation...`, "");
    const tx = await callback();
    p2pLog(`${label}: transaction sent ${tx.hash}. Waiting confirmation...`, "");
    await tx.wait();
    await p2pAfterTx(`${label}: confirmed successfully.`);
  } catch (err) {
    console.error(err);
    p2pLog(err?.shortMessage || err?.reason || err?.message || `${label} failed.`, "warn");
  }
}

async function p2pCreateSellOrder() {
  await p2pSend("Create sell order", async () => {
    const amount = p2pParseLst(document.querySelector("[data-p2p-sell-amount]"));
    const price = p2pParsePrice(document.querySelector("[data-p2p-sell-price]"));
    const deadline = p2pDeadlineFromDays("[data-p2p-sell-deadline]");
    const { contract } = await p2pSignerContract();
    return await contract.createSellOrder(price, deadline, { value: amount });
  });
}

async function p2pCreateBuyOrder() {
  await p2pSend("Create buy order", async () => {
    const amount = p2pParseLst(document.querySelector("[data-p2p-buy-amount]"));
    const price = p2pParsePrice(document.querySelector("[data-p2p-buy-price]"));
    const deadline = p2pDeadlineFromDays("[data-p2p-buy-deadline]");
    const requiredLusdt = p2pQuoteLocal(amount, price);
    const { signer, contract } = await p2pSignerContract();
    await p2pApproveIfNeeded(signer, requiredLusdt);
    return await contract.createBuyOrder(amount, price, deadline);
  });
}

function p2pFillInputs() {
  const id = Number(document.querySelector("[data-p2p-fill-id]")?.value || 0);
  const amount = p2pParseLst(document.querySelector("[data-p2p-fill-amount]"));
  const protectionEl = document.querySelector("[data-p2p-fill-protection]");
  const protection = p2pParseLusdt(protectionEl, true);
  if (!id || id < 1) throw new Error("Enter a valid order ID.");
  return { id, amount, protection };
}

async function p2pFillSellOrder() {
  await p2pSend("Buy LST from sell order", async () => {
    const { id, amount, protection } = p2pFillInputs();
    const { signer, contract } = await p2pSignerContract();
    const order = await p2pReadOrder(id, contract);
    if (order.side !== 0) throw new Error("This is not a sell order.");
    const gross = p2pQuoteLocal(amount, order.price);
    await p2pApproveIfNeeded(signer, gross);
    return await contract.fillSellOrder(id, amount, protection);
  });
}

async function p2pFillBuyOrder() {
  await p2pSend("Sell LST into buy order", async () => {
    const { id, amount, protection } = p2pFillInputs();
    const { contract } = await p2pSignerContract();
    const order = await p2pReadOrder(id, contract);
    if (order.side !== 1) throw new Error("This is not a buy order.");
    return await contract.fillBuyOrder(id, amount, protection, { value: amount });
  });
}

function p2pManageOrderId() {
  const id = Number(document.querySelector("[data-p2p-manage-id]")?.value || 0);
  if (!id || id < 1) throw new Error("Enter a valid order ID to manage.");
  return id;
}

async function p2pUpdatePrice() {
  await p2pSend("Update price", async () => {
    const id = p2pManageOrderId();
    const price = p2pParsePrice(document.querySelector("[data-p2p-new-price]"));
    const { signer, contract } = await p2pSignerContract();
    const order = await p2pReadOrder(id, contract);
    if (order.side === 1) {
      const required = p2pQuoteLocal(order.remainingLst, price);
      if (required > order.remainingLusdt) {
        await p2pApproveIfNeeded(signer, required - order.remainingLusdt);
      }
    }
    return await contract.updatePrice(id, price);
  });
}

async function p2pUpdateDeadline() {
  await p2pSend("Update deadline", async () => {
    const id = p2pManageOrderId();
    const deadline = p2pDeadlineFromDays("[data-p2p-new-deadline]");
    const { contract } = await p2pSignerContract();
    return await contract.updateDeadline(id, deadline);
  });
}

async function p2pCancelOrder() {
  const id = p2pManageOrderId();
  if (!confirm(`Cancel P2P order #${id}?`)) return;
  await p2pSend("Cancel order", async () => {
    const { contract } = await p2pSignerContract();
    return await contract.cancelOrder(id);
  });
}

async function p2pAddSellLst() {
  await p2pSend("Add LST to sell order", async () => {
    const id = p2pManageOrderId();
    const amount = p2pParseLst(document.querySelector("[data-p2p-sell-edit-amount]"));
    const { contract } = await p2pSignerContract();
    return await contract.addLstToSellOrder(id, { value: amount });
  });
}

async function p2pRemoveSellLst() {
  await p2pSend("Remove LST from sell order", async () => {
    const id = p2pManageOrderId();
    const amount = p2pParseLst(document.querySelector("[data-p2p-sell-edit-amount]"));
    const { contract } = await p2pSignerContract();
    return await contract.removeLstFromSellOrder(id, amount);
  });
}

async function p2pAddBuyLusdt() {
  await p2pSend("Add LUSDT to buy order", async () => {
    const id = p2pManageOrderId();
    const amount = p2pParseLusdt(document.querySelector("[data-p2p-buy-edit-amount]"));
    const { signer, contract } = await p2pSignerContract();
    await p2pApproveIfNeeded(signer, amount);
    return await contract.addLusdtToBuyOrder(id, amount);
  });
}

async function p2pReduceBuyLst() {
  await p2pSend("Reduce buy order", async () => {
    const id = p2pManageOrderId();
    const amount = p2pParseLst(document.querySelector("[data-p2p-buy-edit-amount]"));
    const { contract } = await p2pSignerContract();
    return await contract.reduceBuyOrder(id, amount);
  });
}

function wireLustP2P() {
  if (!hasP2PPage()) return;

  p2pSetText("[data-p2p-contract-short]", p2pShort(LUST_P2P_MARKET_ADDRESS));
  document.querySelectorAll("[data-p2p-sell-amount], [data-p2p-sell-price], [data-p2p-buy-amount], [data-p2p-buy-price]").forEach((el) => {
    el.addEventListener("input", p2pUpdateQuotes);
  });

  document.querySelectorAll("[data-p2p-refresh]").forEach((el) => {
    el.addEventListener("click", () => {
      p2pRefreshBalances();
      p2pRefreshOrders();
    });
  });

  document.querySelector("[data-p2p-scroll-create]")?.addEventListener("click", () => {
    document.querySelector("#create-order")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelector("[data-p2p-create-sell]")?.addEventListener("click", p2pCreateSellOrder);
  document.querySelector("[data-p2p-create-buy]")?.addEventListener("click", p2pCreateBuyOrder);
  document.querySelector("[data-p2p-fill-sell]")?.addEventListener("click", p2pFillSellOrder);
  document.querySelector("[data-p2p-fill-buy]")?.addEventListener("click", p2pFillBuyOrder);
  document.querySelector("[data-p2p-update-price]")?.addEventListener("click", p2pUpdatePrice);
  document.querySelector("[data-p2p-update-deadline]")?.addEventListener("click", p2pUpdateDeadline);
  document.querySelector("[data-p2p-cancel]")?.addEventListener("click", p2pCancelOrder);
  document.querySelector("[data-p2p-add-sell-lst]")?.addEventListener("click", p2pAddSellLst);
  document.querySelector("[data-p2p-remove-sell-lst]")?.addEventListener("click", p2pRemoveSellLst);
  document.querySelector("[data-p2p-add-buy-lusdt]")?.addEventListener("click", p2pAddBuyLusdt);
  document.querySelector("[data-p2p-reduce-buy-lst]")?.addEventListener("click", p2pReduceBuyLst);

  document.addEventListener("click", (event) => {
    const useBtn = event.target.closest("[data-p2p-use-order]");
    if (useBtn) {
      document.querySelector("[data-p2p-fill-id]").value = useBtn.getAttribute("data-id") || "";
      document.querySelector("[data-p2p-fill-amount]").value = useBtn.getAttribute("data-amount") || "";
      document.querySelector("[data-p2p-fill-protection]").value = "";
      document.querySelector("[data-p2p-fill-id]")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const manageBtn = event.target.closest("[data-p2p-manage-order]");
    if (manageBtn) {
      document.querySelector("[data-p2p-manage-id]").value = manageBtn.getAttribute("data-id") || "";
      document.querySelector("[data-p2p-manage-id]")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (event.target.closest("[data-connect-wallet]")) {
      setTimeout(p2pRefreshBalances, 900);
      setTimeout(p2pRefreshOrders, 1400);
    }
  });

  p2pUpdateQuotes();
  p2pRefreshBalances();
  p2pRefreshOrders();
  setInterval(p2pRefreshBalances, 15000);
  setInterval(p2pRefreshOrders, 30000);
}

window.lustP2P = {
  refresh: () => { p2pRefreshBalances(); p2pRefreshOrders(); },
  contract: LUST_P2P_MARKET_ADDRESS,
  token: LUSDT_TOKEN_ADDRESS
};

wireLustP2P();

// LUSTSwap frontend v20260613-complete-dex-v1
const LUSTSWAP_FACTORY_ADDRESS = "0x97e0b70fc246bf98db90d94c10b3409a809319bd";
const LUSTSWAP_ROUTER_ADDRESS = "0x62883a46b045cf1811dfdbec3fe0eadc78f888f0";
const LUSTSWAP_WLST_ADDRESS = "0xf8e57f2ee77b13f6673155308c9c431ce9f90d86";
const LUSTSWAP_LUSDT_ADDRESS = "0x1e8636066d7e86de0a8bd6acb1e54be129ac19ae";
const LUSTSWAP_NATIVE = "LST_NATIVE";
const LUSTSWAP_ZERO = "0x0000000000000000000000000000000000000000";
const LUSTSWAP_TOKEN_STORAGE_KEY = "lustswapImportedTokens:v1";

const LUSTSWAP_ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)"
];

const LUSTSWAP_FACTORY_ABI = [
  "function getPair(address tokenA,address tokenB) view returns (address pair)",
  "function allPairsLength() view returns (uint256)",
  "function feeTo() view returns (address)",
  "function feeToSetter() view returns (address)"
];

const LUSTSWAP_ROUTER_ABI = [
  "function factory() view returns (address)",
  "function WLST() view returns (address)",
  "function wrapLST(address to) payable returns (uint256)",
  "function unwrapLST(uint256 amountWLST,address to) returns (uint256)",
  "function getAmountsOut(uint256 amountIn,address[] path) view returns (uint256[] amounts)",
  "function addLiquiditySmart(address tokenA,address tokenB,uint256 amountADesired,uint256 amountBDesired,uint256 amountAMin,uint256 amountBMin,address to,uint256 deadline) returns (uint256 amountA,uint256 amountB,uint256 liquidity)",
  "function addLiquidityLSTSmart(address token,uint256 amountTokenDesired,uint256 amountTokenMin,uint256 amountLSTMin,address to,uint256 deadline) payable returns (uint256 amountToken,uint256 amountLST,uint256 liquidity)",
  "function removeLiquiditySmart(address tokenA,address tokenB,uint256 liquidity,uint256 amountAMin,uint256 amountBMin,address to,uint256 deadline) returns (uint256 amountA,uint256 amountB)",
  "function removeLiquidityLSTSmart(address token,uint256 liquidity,uint256 amountTokenMin,uint256 amountLSTMin,address to,uint256 deadline) returns (uint256 amountToken,uint256 amountLST)",
  "function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)",
  "function swapExactLSTForTokensSupportingFeeOnTransferTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline) payable",
  "function swapExactTokensForLSTSupportingFeeOnTransferTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)"
];

const LUSTSWAP_PAIR_ABI = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function getReserves() view returns (uint112 reserve0,uint112 reserve1,uint32 blockTimestampLast)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
  "function symbol() view returns (string)"
];

function lustswapHasPage() {
  return Boolean(document.querySelector("[data-lustswap-page]"));
}

function lustswapShort(value) {
  return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "--";
}

function lustswapLog(selector, message, tone = "") {
  const el = document.querySelector(selector);
  if (!el) return;
  el.textContent = message;
  el.dataset.tone = tone;
}

function lustswapSet(selector, message) {
  const el = document.querySelector(selector);
  if (el) el.textContent = message;
}

function lustswapProvider() {
  return new ethers.JsonRpcProvider("https://rpc.lustchain.org", LUST_CHAIN_ID_DECIMAL);
}

function lustswapDefaultTokens() {
  return [
    { key: LUSTSWAP_NATIVE, address: LUSTSWAP_NATIVE, symbol: "LST", name: "LUST Native", decimals: 18, native: true },
    { key: LUSTSWAP_WLST_ADDRESS, address: LUSTSWAP_WLST_ADDRESS, symbol: "WLST", name: "Wrapped LST", decimals: 18, native: false },
    { key: LUSTSWAP_LUSDT_ADDRESS, address: LUSTSWAP_LUSDT_ADDRESS, symbol: "LUSDT", name: "LUST USD", decimals: 6, native: false }
  ];
}

function lustswapLoadImportedTokens() {
  try {
    const raw = JSON.parse(localStorage.getItem(LUSTSWAP_TOKEN_STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((t) => t?.address && t?.symbol) : [];
  } catch (_) {
    return [];
  }
}

let lustswapTokens = [...lustswapDefaultTokens(), ...lustswapLoadImportedTokens()];

function lustswapSaveImportedTokens() {
  const defaults = new Set(lustswapDefaultTokens().map((t) => String(t.address).toLowerCase()));
  const custom = lustswapTokens.filter((t) => !t.native && !defaults.has(String(t.address).toLowerCase()));
  localStorage.setItem(LUSTSWAP_TOKEN_STORAGE_KEY, JSON.stringify(custom));
}

function lustswapFindToken(value) {
  const key = String(value || "").toLowerCase();
  return lustswapTokens.find((t) => String(t.address).toLowerCase() === key || String(t.key).toLowerCase() === key) || null;
}

function lustswapTokenSymbol(value) {
  return lustswapFindToken(value)?.symbol || "TOKEN";
}

function lustswapTokenDecimals(value) {
  return Number(lustswapFindToken(value)?.decimals ?? 18);
}

function lustswapIsNative(value) {
  return String(value || "") === LUSTSWAP_NATIVE;
}

function lustswapPairAddressOf(value) {
  if (lustswapIsNative(value)) return LUSTSWAP_WLST_ADDRESS;
  return String(value || "").toLowerCase();
}

function lustswapFormat(value, decimals = 18, precision = 6) {
  try {
    const text = ethers.formatUnits(BigInt(value || 0), decimals);
    const [a, b = ""] = text.split(".");
    const cut = b.padEnd(precision, "0").slice(0, precision);
    return precision > 0 ? `${a}.${cut}` : a;
  } catch (_) {
    return precision > 0 ? `0.${"0".repeat(precision)}` : "0";
  }
}

function lustswapParseAmount(raw, decimals, label = "amount") {
  const value = String(raw || "").trim().replace(",", ".");
  if (!value || Number(value) <= 0 || !Number.isFinite(Number(value))) throw new Error(`Enter a valid ${label}.`);
  return ethers.parseUnits(value, decimals);
}

function lustswapBpsFromInput(selector, fallback = 100) {
  const n = Number(String(document.querySelector(selector)?.value || "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return BigInt(fallback);
  return BigInt(Math.min(Math.floor(n * 100), 9500));
}

function lustswapDeadline(selector) {
  const minutes = Math.max(1, Math.min(180, Number(document.querySelector(selector)?.value || 20) || 20));
  return BigInt(Math.floor(Date.now() / 1000) + Math.floor(minutes * 60));
}

function lustswapApplySlippage(amount, bps) {
  return BigInt(amount || 0) * (10000n - BigInt(bps || 0)) / 10000n;
}

async function lustswapSwitchToLust() {
  const eth = getInjectedEthereum();
  if (!eth) throw new Error("MetaMask or injected wallet not found.");
  const current = normalizeChainId(await eth.request({ method: "eth_chainId" }).catch(() => ""));
  if (current === LUST_CHAIN_ID_HEX) return;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: LUST_CHAIN_ID_HEX }] });
  } catch (err) {
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
  }
}

async function lustswapSigner() {
  const eth = getInjectedEthereum();
  if (!eth) throw new Error("MetaMask or injected wallet not found.");
  await eth.request({ method: "eth_requestAccounts" });
  await lustswapSwitchToLust();
  const provider = new ethers.BrowserProvider(eth);
  return provider.getSigner();
}

async function lustswapApproveIfNeeded(tokenAddress, spender, amount, signer, logSelector) {
  const token = new ethers.Contract(tokenAddress, LUSTSWAP_ERC20_ABI, signer);
  const owner = await signer.getAddress();
  const allowance = await token.allowance(owner, spender);
  if (allowance >= amount) return null;
  lustswapLog(logSelector, `Approval needed for ${lustswapShort(tokenAddress)}. Confirm in wallet...`);
  const tx = await token.approve(spender, amount);
  lustswapLog(logSelector, `Approval sent: ${tx.hash}. Waiting confirmation...`);
  await tx.wait();
  return tx.hash;
}

async function lustswapBalance(value, account, provider) {
  if (!account) return 0n;
  if (lustswapIsNative(value)) return await provider.getBalance(account);
  const token = new ethers.Contract(lustswapPairAddressOf(value), LUSTSWAP_ERC20_ABI, provider);
  return await token.balanceOf(account);
}

function lustswapRenderTokenOptions() {
  if (!lustswapHasPage()) return;
  const unique = [];
  const seen = new Set();
  for (const token of lustswapTokens) {
    const id = String(token.address).toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    unique.push(token);
  }
  lustswapTokens = unique;

  document.querySelectorAll("[data-lustswap-token-select]").forEach((select) => {
    const prev = select.value;
    const defaultValue = select.hasAttribute("data-swap-from-token") ? LUSTSWAP_NATIVE
      : select.hasAttribute("data-swap-to-token") ? LUSTSWAP_LUSDT_ADDRESS
      : select.hasAttribute("data-pool-token-a") ? LUSTSWAP_NATIVE
      : select.hasAttribute("data-pool-token-b") ? LUSTSWAP_LUSDT_ADDRESS
      : LUSTSWAP_NATIVE;
    select.innerHTML = lustswapTokens.map((token) => {
      const value = token.native ? LUSTSWAP_NATIVE : token.address;
      return `<option value="${value}">${token.symbol}</option>`;
    }).join("");
    select.value = prev && [...select.options].some((o) => o.value === prev) ? prev : defaultValue;
  });
}

async function lustswapImportToken() {
  const input = document.querySelector("[data-token-import-address]");
  const raw = String(input?.value || "").trim();
  try {
    const address = ethers.getAddress(raw).toLowerCase();
    if (address === LUSTSWAP_WLST_ADDRESS || address === LUSTSWAP_LUSDT_ADDRESS) {
      lustswapLog("[data-token-import-log]", "This token is already in the default list.", "ok");
      return;
    }
    if (lustswapFindToken(address)) {
      lustswapLog("[data-token-import-log]", "This token is already imported.", "ok");
      return;
    }
    const provider = lustswapProvider();
    const token = new ethers.Contract(address, LUSTSWAP_ERC20_ABI, provider);
    const [decimals, symbolResult, nameResult] = await Promise.all([
      token.decimals(),
      token.symbol().catch(() => "TOKEN"),
      token.name().catch(() => "Imported Token")
    ]);
    const symbol = String(symbolResult || "TOKEN").slice(0, 18).replace(/[^a-zA-Z0-9_$.-]/g, "") || "TOKEN";
    const name = String(nameResult || "Imported Token").slice(0, 64);
    lustswapTokens.push({ key: address, address, symbol, name, decimals: Number(decimals), native: false });
    lustswapSaveImportedTokens();
    lustswapRenderTokenOptions();
    document.querySelectorAll("[data-swap-to-token], [data-pool-token-b]").forEach((el) => { el.value = address; });
    lustswapLog("[data-token-import-log]", `${symbol} imported successfully.`, "ok");
    input.value = "";
    lustswapUpdateAll();
  } catch (err) {
    console.error(err);
    lustswapLog("[data-token-import-log]", err?.message || "Could not import token.", "warn");
  }
}

async function lustswapGetPair(addrA, addrB, provider = lustswapProvider()) {
  if (!addrA || !addrB || addrA.toLowerCase() === addrB.toLowerCase()) return LUSTSWAP_ZERO;
  const factory = new ethers.Contract(LUSTSWAP_FACTORY_ADDRESS, LUSTSWAP_FACTORY_ABI, provider);
  return await factory.getPair(addrA, addrB);
}

async function lustswapBuildRoute(fromValue, toValue, amountIn = 0n) {
  const fromAddr = lustswapPairAddressOf(fromValue);
  const toAddr = lustswapPairAddressOf(toValue);
  if (fromAddr === toAddr) {
    if (lustswapIsNative(fromValue) && !lustswapIsNative(toValue)) return { special: "wrap", path: [fromAddr], route: "Wrap LST → WLST", pair: "1:1" };
    if (!lustswapIsNative(fromValue) && lustswapIsNative(toValue)) return { special: "unwrap", path: [fromAddr], route: "Unwrap WLST → LST", pair: "1:1" };
    throw new Error("Choose two different assets.");
  }

  const provider = lustswapProvider();
  const direct = await lustswapGetPair(fromAddr, toAddr, provider);
  if (String(direct).toLowerCase() !== LUSTSWAP_ZERO) {
    return { special: "swap", path: [fromAddr, toAddr], route: "Direct pool", pair: direct };
  }

  if (fromAddr !== LUSTSWAP_WLST_ADDRESS && toAddr !== LUSTSWAP_WLST_ADDRESS) {
    const p1 = await lustswapGetPair(fromAddr, LUSTSWAP_WLST_ADDRESS, provider);
    const p2 = await lustswapGetPair(LUSTSWAP_WLST_ADDRESS, toAddr, provider);
    if (String(p1).toLowerCase() !== LUSTSWAP_ZERO && String(p2).toLowerCase() !== LUSTSWAP_ZERO) {
      return { special: "swap", path: [fromAddr, LUSTSWAP_WLST_ADDRESS, toAddr], route: "Via WLST", pair: `${lustswapShort(p1)} + ${lustswapShort(p2)}` };
    }
  }

  return { special: "missing", path: [fromAddr, toAddr], route: "No pool found", pair: LUSTSWAP_ZERO, amountIn };
}

async function lustswapUpdateSwap() {
  if (!lustswapHasPage()) return;
  const from = document.querySelector("[data-swap-from-token]")?.value || LUSTSWAP_NATIVE;
  const to = document.querySelector("[data-swap-to-token]")?.value || LUSTSWAP_LUSDT_ADDRESS;
  const amountText = document.querySelector("[data-swap-from-amount]")?.value || "";
  const provider = lustswapProvider();
  const account = walletState.address || appKit.getAddress?.() || "";

  try {
    const [fromBal, toBal] = await Promise.all([
      lustswapBalance(from, account, provider).catch(() => 0n),
      lustswapBalance(to, account, provider).catch(() => 0n)
    ]);
    lustswapSet("[data-swap-from-balance]", `${lustswapFormat(fromBal, lustswapTokenDecimals(from), 6)} ${lustswapTokenSymbol(from)}`);
    lustswapSet("[data-swap-to-balance]", `${lustswapFormat(toBal, lustswapTokenDecimals(to), 6)} ${lustswapTokenSymbol(to)}`);
  } catch (_) {
    lustswapSet("[data-swap-from-balance]", "--");
    lustswapSet("[data-swap-to-balance]", "--");
  }

  if (!amountText) {
    lustswapSet("[data-swap-to-amount]", "");
    lustswapSet("[data-swap-route]", "--");
    lustswapSet("[data-swap-min]", "--");
    lustswapSet("[data-swap-pair]", "--");
    return;
  }

  try {
    const amountIn = lustswapParseAmount(amountText, lustswapTokenDecimals(from), "swap amount");
    const route = await lustswapBuildRoute(from, to, amountIn);
    lustswapSet("[data-swap-route]", route.route);
    lustswapSet("[data-swap-pair]", route.pair === "1:1" ? "WLST wrapper" : route.pair === LUSTSWAP_ZERO ? "Create pool first" : route.pair);

    if (route.special === "wrap" || route.special === "unwrap") {
      lustswapSet("[data-swap-to-amount]", lustswapFormat(amountIn, 18, 6));
      lustswapSet("[data-swap-min]", `${lustswapFormat(amountIn, 18, 6)} ${lustswapTokenSymbol(to)}`);
      lustswapLog("[data-swap-log]", "Ready for 1:1 wrap/unwrap.", "ok");
      return;
    }

    if (route.special === "missing") {
      lustswapSet("[data-swap-to-amount]", "");
      lustswapSet("[data-swap-min]", "No liquidity");
      lustswapLog("[data-swap-log]", "No pool exists yet. Create it in Pool Manager below.", "warn");
      return;
    }

    const router = new ethers.Contract(LUSTSWAP_ROUTER_ADDRESS, LUSTSWAP_ROUTER_ABI, provider);
    const amounts = await router.getAmountsOut(amountIn, route.path);
    const out = amounts[amounts.length - 1];
    const minOut = lustswapApplySlippage(out, lustswapBpsFromInput("[data-swap-slippage]", 100));
    lustswapSet("[data-swap-to-amount]", lustswapFormat(out, lustswapTokenDecimals(to), 6));
    lustswapSet("[data-swap-min]", `${lustswapFormat(minOut, lustswapTokenDecimals(to), 6)} ${lustswapTokenSymbol(to)}`);
    lustswapLog("[data-swap-log]", "Quote ready. For tax tokens, use higher slippage if the token charges transfer fees.", "ok");
  } catch (err) {
    lustswapSet("[data-swap-to-amount]", "");
    lustswapSet("[data-swap-route]", "--");
    lustswapSet("[data-swap-min]", "--");
    lustswapSet("[data-swap-pair]", "--");
    lustswapLog("[data-swap-log]", err?.message || "Could not quote swap.", "warn");
  }
}

async function lustswapExecuteSwap() {
  try {
    const from = document.querySelector("[data-swap-from-token]")?.value || LUSTSWAP_NATIVE;
    const to = document.querySelector("[data-swap-to-token]")?.value || LUSTSWAP_LUSDT_ADDRESS;
    const amountText = document.querySelector("[data-swap-from-amount]")?.value || "";
    const amountIn = lustswapParseAmount(amountText, lustswapTokenDecimals(from), "swap amount");
    const signer = await lustswapSigner();
    const account = await signer.getAddress();
    const router = new ethers.Contract(LUSTSWAP_ROUTER_ADDRESS, LUSTSWAP_ROUTER_ABI, signer);
    const route = await lustswapBuildRoute(from, to, amountIn);

    let tx;
    if (route.special === "wrap") {
      lustswapLog("[data-swap-log]", "Wrapping LST into WLST. Confirm in wallet...");
      tx = await router.wrapLST(account, { value: amountIn });
    } else if (route.special === "unwrap") {
      await lustswapApproveIfNeeded(LUSTSWAP_WLST_ADDRESS, LUSTSWAP_ROUTER_ADDRESS, amountIn, signer, "[data-swap-log]");
      lustswapLog("[data-swap-log]", "Unwrapping WLST into LST. Confirm in wallet...");
      tx = await router.unwrapLST(amountIn, account);
    } else if (route.special === "missing") {
      throw new Error("No pool exists for this route. Create liquidity first.");
    } else {
      const provider = lustswapProvider();
      const readRouter = new ethers.Contract(LUSTSWAP_ROUTER_ADDRESS, LUSTSWAP_ROUTER_ABI, provider);
      const amounts = await readRouter.getAmountsOut(amountIn, route.path);
      const minOut = lustswapApplySlippage(amounts[amounts.length - 1], lustswapBpsFromInput("[data-swap-slippage]", 100));
      const deadline = lustswapDeadline("[data-swap-deadline]");

      if (!lustswapIsNative(from)) {
        await lustswapApproveIfNeeded(route.path[0], LUSTSWAP_ROUTER_ADDRESS, amountIn, signer, "[data-swap-log]");
      }

      lustswapLog("[data-swap-log]", "Opening swap confirmation in wallet...");
      if (lustswapIsNative(from)) {
        tx = await router.swapExactLSTForTokensSupportingFeeOnTransferTokens(minOut, route.path, account, deadline, { value: amountIn });
      } else if (lustswapIsNative(to)) {
        tx = await router.swapExactTokensForLSTSupportingFeeOnTransferTokens(amountIn, minOut, route.path, account, deadline);
      } else {
        tx = await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn, minOut, route.path, account, deadline);
      }
    }

    lustswapLog("[data-swap-log]", `Transaction sent: ${tx.hash}. Waiting confirmation...`);
    await tx.wait();
    lustswapLog("[data-swap-log]", `Swap confirmed: ${tx.hash}`, "ok");
    setTimeout(lustswapUpdateAll, 1200);
  } catch (err) {
    console.error(err);
    lustswapLog("[data-swap-log]", err?.shortMessage || err?.message || "Swap failed or was rejected.", "warn");
  }
}

async function lustswapUpdatePool() {
  if (!lustswapHasPage()) return;
  const a = document.querySelector("[data-pool-token-a]")?.value || LUSTSWAP_NATIVE;
  const b = document.querySelector("[data-pool-token-b]")?.value || LUSTSWAP_LUSDT_ADDRESS;
  const addrA = lustswapPairAddressOf(a);
  const addrB = lustswapPairAddressOf(b);
  const provider = lustswapProvider();
  const account = walletState.address || appKit.getAddress?.() || "";

  try {
    const factory = new ethers.Contract(LUSTSWAP_FACTORY_ADDRESS, LUSTSWAP_FACTORY_ABI, provider);
    const count = await factory.allPairsLength().catch(() => null);
    if (count !== null) lustswapSet("[data-pool-count]", String(count));

    const [balA, balB] = await Promise.all([
      lustswapBalance(a, account, provider).catch(() => 0n),
      lustswapBalance(b, account, provider).catch(() => 0n)
    ]);
    lustswapSet("[data-pool-balance-a]", `Balance ${lustswapFormat(balA, lustswapTokenDecimals(a), 6)}`);
    lustswapSet("[data-pool-balance-b]", `Balance ${lustswapFormat(balB, lustswapTokenDecimals(b), 6)}`);

    if (addrA === addrB) {
      lustswapSet("[data-pool-pair-status]", "Invalid pair");
      lustswapSet("[data-pool-pair-address]", "Choose different assets");
      lustswapSet("[data-remove-lp-balance]", "--");
      lustswapSet("[data-remove-estimate]", "--");
      return;
    }

    const pair = await factory.getPair(addrA, addrB);
    if (String(pair).toLowerCase() === LUSTSWAP_ZERO) {
      lustswapSet("[data-pool-pair-status]", "New pool");
      lustswapSet("[data-pool-pair-address]", "Will be created on add liquidity");
      lustswapSet("[data-remove-lp-balance]", "No LP yet");
      lustswapSet("[data-remove-estimate]", "--");
      return;
    }

    lustswapSet("[data-pool-pair-status]", "Pool exists");
    lustswapSet("[data-pool-pair-address]", pair);

    const pairContract = new ethers.Contract(pair, LUSTSWAP_PAIR_ABI, provider);
    const lpBal = account ? await pairContract.balanceOf(account).catch(() => 0n) : 0n;
    lustswapSet("[data-remove-lp-balance]", `${lustswapFormat(lpBal, 18, 6)} LUST-LP`);
    await lustswapUpdateRemoveEstimate(pair, a, b, provider);
  } catch (err) {
    console.error(err);
    lustswapLog("[data-pool-log]", err?.message || "Could not refresh pool data.", "warn");
  }
}

async function lustswapUpdateRemoveEstimate(pair, a, b, provider = lustswapProvider()) {
  const raw = document.querySelector("[data-remove-lp-amount]")?.value || "";
  if (!raw) {
    lustswapSet("[data-remove-estimate]", "Enter LP amount");
    return null;
  }
  try {
    const lp = lustswapParseAmount(raw, 18, "LP amount");
    const pairContract = new ethers.Contract(pair, LUSTSWAP_PAIR_ABI, provider);
    const [token0, reserves, totalSupply] = await Promise.all([
      pairContract.token0(),
      pairContract.getReserves(),
      pairContract.totalSupply()
    ]);
    if (BigInt(totalSupply) <= 0n) throw new Error("Empty LP supply.");
    const addrA = lustswapPairAddressOf(a).toLowerCase();
    const reserveA = token0.toLowerCase() === addrA ? BigInt(reserves[0]) : BigInt(reserves[1]);
    const reserveB = token0.toLowerCase() === addrA ? BigInt(reserves[1]) : BigInt(reserves[0]);
    const amountA = lp * reserveA / BigInt(totalSupply);
    const amountB = lp * reserveB / BigInt(totalSupply);
    lustswapSet("[data-remove-estimate]", `${lustswapFormat(amountA, lustswapTokenDecimals(a), 6)} ${lustswapTokenSymbol(a)} + ${lustswapFormat(amountB, lustswapTokenDecimals(b), 6)} ${lustswapTokenSymbol(b)}`);
    return { amountA, amountB };
  } catch (err) {
    lustswapSet("[data-remove-estimate]", "--");
    return null;
  }
}

async function lustswapAddLiquidity() {
  try {
    const a = document.querySelector("[data-pool-token-a]")?.value || LUSTSWAP_NATIVE;
    const b = document.querySelector("[data-pool-token-b]")?.value || LUSTSWAP_LUSDT_ADDRESS;
    const addrA = lustswapPairAddressOf(a);
    const addrB = lustswapPairAddressOf(b);
    if (addrA === addrB) throw new Error("Choose two different assets.");
    const amountA = lustswapParseAmount(document.querySelector("[data-pool-amount-a]")?.value, lustswapTokenDecimals(a), "Token A amount");
    const amountB = lustswapParseAmount(document.querySelector("[data-pool-amount-b]")?.value, lustswapTokenDecimals(b), "Token B amount");
    const minA = lustswapApplySlippage(amountA, lustswapBpsFromInput("[data-pool-slippage]", 500));
    const minB = lustswapApplySlippage(amountB, lustswapBpsFromInput("[data-pool-slippage]", 500));
    const signer = await lustswapSigner();
    const account = await signer.getAddress();
    const router = new ethers.Contract(LUSTSWAP_ROUTER_ADDRESS, LUSTSWAP_ROUTER_ABI, signer);
    const deadline = lustswapDeadline("[data-pool-deadline]");
    let tx;

    if (lustswapIsNative(a) || lustswapIsNative(b)) {
      const nativeAmount = lustswapIsNative(a) ? amountA : amountB;
      const nativeMin = lustswapIsNative(a) ? minA : minB;
      const tokenValue = lustswapIsNative(a) ? b : a;
      const tokenAmount = lustswapIsNative(a) ? amountB : amountA;
      const tokenMin = lustswapIsNative(a) ? minB : minA;
      const tokenAddress = lustswapPairAddressOf(tokenValue);
      await lustswapApproveIfNeeded(tokenAddress, LUSTSWAP_ROUTER_ADDRESS, tokenAmount, signer, "[data-pool-log]");
      lustswapLog("[data-pool-log]", "Opening add liquidity confirmation in wallet...");
      tx = await router.addLiquidityLSTSmart(tokenAddress, tokenAmount, tokenMin, nativeMin, account, deadline, { value: nativeAmount });
    } else {
      await lustswapApproveIfNeeded(addrA, LUSTSWAP_ROUTER_ADDRESS, amountA, signer, "[data-pool-log]");
      await lustswapApproveIfNeeded(addrB, LUSTSWAP_ROUTER_ADDRESS, amountB, signer, "[data-pool-log]");
      lustswapLog("[data-pool-log]", "Opening add liquidity confirmation in wallet...");
      tx = await router.addLiquiditySmart(addrA, addrB, amountA, amountB, minA, minB, account, deadline);
    }

    lustswapLog("[data-pool-log]", `Liquidity transaction sent: ${tx.hash}. Waiting confirmation...`);
    await tx.wait();
    lustswapLog("[data-pool-log]", `Liquidity added: ${tx.hash}`, "ok");
    setTimeout(lustswapUpdateAll, 1200);
  } catch (err) {
    console.error(err);
    lustswapLog("[data-pool-log]", err?.shortMessage || err?.message || "Add liquidity failed or was rejected.", "warn");
  }
}

async function lustswapRemoveLiquidity() {
  try {
    const a = document.querySelector("[data-pool-token-a]")?.value || LUSTSWAP_NATIVE;
    const b = document.querySelector("[data-pool-token-b]")?.value || LUSTSWAP_LUSDT_ADDRESS;
    const addrA = lustswapPairAddressOf(a);
    const addrB = lustswapPairAddressOf(b);
    if (addrA === addrB) throw new Error("Choose two different assets.");
    const liquidity = lustswapParseAmount(document.querySelector("[data-remove-lp-amount]")?.value, 18, "LP amount");
    const provider = lustswapProvider();
    const pair = await lustswapGetPair(addrA, addrB, provider);
    if (String(pair).toLowerCase() === LUSTSWAP_ZERO) throw new Error("This pair does not exist.");
    const estimates = await lustswapUpdateRemoveEstimate(pair, a, b, provider);
    if (!estimates) throw new Error("Could not estimate LP output.");
    const minA = lustswapApplySlippage(estimates.amountA, lustswapBpsFromInput("[data-pool-slippage]", 500));
    const minB = lustswapApplySlippage(estimates.amountB, lustswapBpsFromInput("[data-pool-slippage]", 500));
    const signer = await lustswapSigner();
    const account = await signer.getAddress();
    const router = new ethers.Contract(LUSTSWAP_ROUTER_ADDRESS, LUSTSWAP_ROUTER_ABI, signer);
    const deadline = lustswapDeadline("[data-pool-deadline]");
    await lustswapApproveIfNeeded(pair, LUSTSWAP_ROUTER_ADDRESS, liquidity, signer, "[data-remove-log]");

    let tx;
    lustswapLog("[data-remove-log]", "Opening remove liquidity confirmation in wallet...");
    if (lustswapIsNative(a) || lustswapIsNative(b)) {
      const tokenValue = lustswapIsNative(a) ? b : a;
      const tokenAddress = lustswapPairAddressOf(tokenValue);
      const tokenMin = lustswapIsNative(a) ? minB : minA;
      const nativeMin = lustswapIsNative(a) ? minA : minB;
      tx = await router.removeLiquidityLSTSmart(tokenAddress, liquidity, tokenMin, nativeMin, account, deadline);
    } else {
      tx = await router.removeLiquiditySmart(addrA, addrB, liquidity, minA, minB, account, deadline);
    }

    lustswapLog("[data-remove-log]", `Remove liquidity sent: ${tx.hash}. Waiting confirmation...`);
    await tx.wait();
    lustswapLog("[data-remove-log]", `Liquidity removed: ${tx.hash}`, "ok");
    setTimeout(lustswapUpdateAll, 1200);
  } catch (err) {
    console.error(err);
    lustswapLog("[data-remove-log]", err?.shortMessage || err?.message || "Remove liquidity failed or was rejected.", "warn");
  }
}

async function lustswapUseMax() {
  try {
    const from = document.querySelector("[data-swap-from-token]")?.value || LUSTSWAP_NATIVE;
    const account = walletState.address || appKit.getAddress?.() || await getWalletAccount();
    const bal = await lustswapBalance(from, account, lustswapProvider());
    const safe = lustswapIsNative(from) && bal > ethers.parseEther("0.02") ? bal - ethers.parseEther("0.01") : bal;
    document.querySelector("[data-swap-from-amount]").value = lustswapFormat(safe, lustswapTokenDecimals(from), 8).replace(/0+$/, "").replace(/\.$/, "");
    lustswapUpdateSwap();
  } catch (err) {
    lustswapLog("[data-swap-log]", err?.message || "Could not set max amount.", "warn");
  }
}

function lustswapFlip() {
  const from = document.querySelector("[data-swap-from-token]");
  const to = document.querySelector("[data-swap-to-token]");
  const fromAmount = document.querySelector("[data-swap-from-amount]");
  const toAmount = document.querySelector("[data-swap-to-amount]");
  if (!from || !to) return;
  const oldFrom = from.value;
  from.value = to.value;
  to.value = oldFrom;
  if (toAmount?.value) fromAmount.value = toAmount.value;
  if (toAmount) toAmount.value = "";
  lustswapUpdateSwap();
}

async function lustswapUpdateAll() {
  if (!lustswapHasPage()) return;
  lustswapSet("[data-lustswap-router-short]", lustswapShort(LUSTSWAP_ROUTER_ADDRESS));
  lustswapSet("[data-lustswap-factory-short]", lustswapShort(LUSTSWAP_FACTORY_ADDRESS));
  lustswapSet("[data-lustswap-wlst-short]", lustswapShort(LUSTSWAP_WLST_ADDRESS));
  await Promise.allSettled([lustswapUpdateSwap(), lustswapUpdatePool()]);
}

function wireLUSTSwap() {
  if (!lustswapHasPage()) return;
  lustswapRenderTokenOptions();
  document.querySelector("[data-token-import]")?.addEventListener("click", lustswapImportToken);
  document.querySelector("[data-swap-refresh]")?.addEventListener("click", lustswapUpdateAll);
  document.querySelector("[data-swap-execute]")?.addEventListener("click", lustswapExecuteSwap);
  document.querySelector("[data-swap-max]")?.addEventListener("click", lustswapUseMax);
  document.querySelector("[data-swap-flip]")?.addEventListener("click", lustswapFlip);
  document.querySelector("[data-pool-check]")?.addEventListener("click", lustswapUpdatePool);
  document.querySelector("[data-pool-add]")?.addEventListener("click", lustswapAddLiquidity);
  document.querySelector("[data-remove-refresh]")?.addEventListener("click", lustswapUpdatePool);
  document.querySelector("[data-remove-liquidity]")?.addEventListener("click", lustswapRemoveLiquidity);
  document.querySelectorAll("[data-swap-from-amount], [data-swap-from-token], [data-swap-to-token], [data-swap-slippage], [data-pool-token-a], [data-pool-token-b], [data-pool-amount-a], [data-pool-amount-b], [data-pool-slippage], [data-remove-lp-amount]").forEach((el) => {
    el.addEventListener("input", () => setTimeout(lustswapUpdateAll, 80));
    el.addEventListener("change", () => setTimeout(lustswapUpdateAll, 80));
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-connect-wallet]")) {
      setTimeout(lustswapUpdateAll, 1200);
      setTimeout(lustswapUpdateAll, 2500);
    }
  });
  lustswapUpdateAll();
  setInterval(lustswapUpdateAll, 25000);
}

window.lustSwap = {
  router: LUSTSWAP_ROUTER_ADDRESS,
  factory: LUSTSWAP_FACTORY_ADDRESS,
  wlst: LUSTSWAP_WLST_ADDRESS,
  refresh: lustswapUpdateAll
};

wireLUSTSwap();

// LUST Genesis Liquidity Event frontend v20260615-presale-v2
const LUST_PRESALE_ADDRESS = "0x6AD87104DDC8F7CEd9267F115EE107F44AA9f936";
const LUST_PRESALE_LUSDT_ADDRESS = "0x1E8636066d7e86De0A8Bd6Acb1e54BE129aC19AE";
const LUST_PRESALE_MAX_WALLET = 500_000000n;
const LUST_PRESALE_HARDCAP = 30_000_000000n;

const LUST_PRESALE_ABI = [
  "function saleTimes() view returns (bool scheduled,bool finalized,uint256 start,uint256 end,uint256 liquidityLimit,uint256 currentTime)",
  "function saleProgress() view returns (uint256 raisedLUSDT,uint256 softcapLUSDT,uint256 hardcapLUSDT,uint256 netForLiquidityLUSDT,uint256 feesLUSDT,uint256 soldLST,uint256 bonusLSTAmount)",
  "function userInfo(address account) view returns (uint256 contributed,uint256 purchased,uint256 bonus,uint256 purchasedClaimed,uint256 bonusClaimed,uint256 purchasedAvailable,uint256 bonusAvailable,bool hasRefunded)",
  "function quoteBuy(uint256 lusdtAmount) view returns (uint256 feeAmount,uint256 netForLiquidity,uint256 purchasedAmountLST,uint256 bonusAmountLST,uint256 bonusBps)",
  "function isSaleActive() view returns (bool)",
  "function isRefundAvailable() view returns (bool)",
  "function liquidityCreated() view returns (bool)",
  "function currentBonusBps() view returns (uint256)",
  "function nativeReserveStatus() view returns (uint256 currentNativeBalance,uint256 requiredNative,bool enoughNativeFunded)",
  "function contributedLUSDT(address account) view returns (uint256)",
  "function claimablePurchased(address account) view returns (uint256)",
  "function buy(uint256 lusdtAmount)",
  "function claimPurchased()",
  "function claimBonus()",
  "function refund()"
];

const LUST_PRESALE_ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)"
];

function presaleHasPage() {
  return Boolean(document.querySelector("[data-presale-page]"));
}

function presaleProvider() {
  return new ethers.JsonRpcProvider("https://rpc.lustchain.org", LUST_CHAIN_ID_DECIMAL);
}

function presaleContract(runner = presaleProvider()) {
  return new ethers.Contract(LUST_PRESALE_ADDRESS, LUST_PRESALE_ABI, runner);
}

function presaleLusdt(runner = presaleProvider()) {
  return new ethers.Contract(LUST_PRESALE_LUSDT_ADDRESS, LUST_PRESALE_ERC20_ABI, runner);
}

function presaleSet(selector, value) {
  document.querySelectorAll(selector).forEach((el) => { el.textContent = value; });
}

function presaleLog(selector, message, tone = "") {
  document.querySelectorAll(selector).forEach((el) => {
    el.textContent = message;
    el.dataset.tone = tone;
  });
}

function presaleShort(value) {
  return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "--";
}

function presaleTrim(text, decimals = 4) {
  const [a, b = ""] = String(text || "0").split(".");
  if (!decimals) return a;
  const cut = b.slice(0, decimals).replace(/0+$/, "");
  return cut ? `${a}.${cut}` : a;
}

function presaleFormat(value, decimals = 18, precision = 4) {
  try {
    return presaleTrim(ethers.formatUnits(BigInt(value || 0), decimals), precision);
  } catch (_) {
    return "0";
  }
}

function presaleFormatLusdt(value, precision = 2) {
  return `${presaleFormat(value, 6, precision)} LUSDT`;
}

function presaleFormatLst(value, precision = 2) {
  return `${presaleFormat(value, 18, precision)} LST`;
}

function presaleParseLusdt(raw) {
  const value = String(raw || "").trim().replace(",", ".");
  if (!value || Number(value) <= 0 || !Number.isFinite(Number(value))) throw new Error("Enter a valid LUSDT amount.");
  return ethers.parseUnits(value, 6);
}

function presalePercent(raised, hardcap) {
  const r = BigInt(raised || 0);
  const h = BigInt(hardcap || 1);
  if (h <= 0n) return 0;
  const bps = Number((r * 10000n) / h);
  return Math.max(0, Math.min(100, bps / 100));
}

function presaleCountdownParts(targetSeconds) {
  const now = Math.floor(Date.now() / 1000);
  let total = Math.max(0, Number(targetSeconds || 0) - now);
  const days = Math.floor(total / 86400); total -= days * 86400;
  const hours = Math.floor(total / 3600); total -= hours * 3600;
  const mins = Math.floor(total / 60); total -= mins * 60;
  return [days, hours, mins, total];
}

function presaleRenderCountdown(targetSeconds) {
  const box = document.querySelector("[data-presale-countdown]");
  if (!box) return;
  const values = targetSeconds ? presaleCountdownParts(targetSeconds) : ["--", "--", "--", "--"];
  box.querySelectorAll("b").forEach((el, i) => { el.textContent = String(values[i]).padStart(i === 0 ? 1 : 2, "0"); });
}

async function presaleSigner() {
  const eth = getInjectedEthereum();
  if (!eth) throw new Error("MetaMask or injected wallet not found.");
  await eth.request({ method: "eth_requestAccounts" });
  await lustswapSwitchToLust();
  const provider = new ethers.BrowserProvider(eth);
  return provider.getSigner();
}

let presaleState = {
  scheduled: false,
  finalized: false,
  start: 0n,
  end: 0n,
  liquidityLimit: 0n,
  currentTime: 0n,
  liquidityCreated: false,
  refundAvailable: false,
  active: false,
  raised: 0n,
  hardcap: LUST_PRESALE_HARDCAP,
  targetCountdown: 0n
};

async function presaleUpdateQuote() {
  if (!presaleHasPage()) return;
  const input = document.querySelector("[data-presale-amount]");
  if (!input) return;
  let amount = 0n;
  try {
    amount = input.value ? presaleParseLusdt(input.value) : 0n;
  } catch (_) {
    presaleSet("[data-presale-quote-lst]", "--");
    presaleSet("[data-presale-quote-bonus]", "--");
    presaleSet("[data-presale-quote-fee]", "--");
    presaleSet("[data-presale-quote-net]", "--");
    return;
  }

  if (amount <= 0n) {
    presaleSet("[data-presale-quote-lst]", "--");
    presaleSet("[data-presale-quote-bonus]", "--");
    presaleSet("[data-presale-quote-fee]", "--");
    presaleSet("[data-presale-quote-net]", "--");
    return;
  }

  try {
    const [fee, net, purchased, bonus] = await presaleContract().quoteBuy(amount);
    presaleSet("[data-presale-quote-lst]", presaleFormatLst(purchased, 2));
    presaleSet("[data-presale-quote-bonus]", presaleFormatLst(bonus, 2));
    presaleSet("[data-presale-quote-fee]", presaleFormatLusdt(fee, 4));
    presaleSet("[data-presale-quote-net]", presaleFormatLusdt(net, 4));
  } catch (err) {
    console.warn(err);
  }
}

function presaleRenderStatus(times, active, refundAvailable, liquidityCreated) {
  const scheduled = Boolean(times?.[0]);
  const finalized = Boolean(times?.[1]);
  const start = BigInt(times?.[2] || 0);
  const end = BigInt(times?.[3] || 0);
  const liquidityLimit = BigInt(times?.[4] || 0);
  const chainNow = BigInt(times?.[5] || 0);

  let status = "Waiting for schedule";
  let target = 0n;
  let log = "Contract is verified and ready. The public start time has not been scheduled yet.";
  let tone = "";

  if (liquidityCreated) {
    status = "Liquidity created · Claim open";
    log = "The initial WLST/LUSDT liquidity was created. Purchased LST can be claimed now.";
    tone = "ok";
  } else if (!scheduled) {
    status = "Ready · Not scheduled";
  } else if (active) {
    status = "Sale active";
    target = end;
    log = "The Genesis sale is active. Buy LST with LUSDT while the cap is available.";
    tone = "ok";
  } else if (chainNow < start) {
    status = "Starts soon";
    target = start;
    log = "Countdown is live. Buying opens automatically at the contract start time.";
  } else if (refundAvailable) {
    status = "Refund available";
    log = "Refund is available by contract rule. Participants can withdraw their LUSDT.";
    tone = "warn";
  } else if (finalized) {
    status = "Finalized · Awaiting liquidity";
    target = liquidityLimit;
    log = "Sale is finalized and waiting for liquidity creation within the contract grace period.";
  } else if (chainNow >= end) {
    status = "Sale ended";
    target = liquidityLimit;
    log = "Sale time ended. Finalization is the next step before liquidity creation or refund state.";
  }

  presaleState = { ...presaleState, scheduled, finalized, start, end, liquidityLimit, currentTime: chainNow, active, refundAvailable, liquidityCreated, targetCountdown: target };
  presaleSet("[data-presale-status]", status);
  presaleLog("[data-presale-log]", log, tone);
  presaleRenderCountdown(target);
}

async function presaleUpdateAll() {
  if (!presaleHasPage()) return;

  try {
    const contract = presaleContract();
    const [times, progress, active, refundAvailable, liquidityCreated, bonusBps, reserve] = await Promise.all([
      contract.saleTimes(),
      contract.saleProgress(),
      contract.isSaleActive(),
      contract.isRefundAvailable(),
      contract.liquidityCreated(),
      contract.currentBonusBps().catch(() => 0n),
      contract.nativeReserveStatus().catch(() => null)
    ]);

    presaleRenderStatus(times, active, refundAvailable, liquidityCreated);

    const [raised, softcap, hardcap, net, fees, sold, bonusTotal] = progress;
    presaleState.raised = BigInt(raised || 0);
    presaleState.hardcap = BigInt(hardcap || LUST_PRESALE_HARDCAP);

    const pct = presalePercent(raised, hardcap);
    const bar = document.querySelector("[data-presale-progress-bar]");
    if (bar) bar.style.width = `${pct}%`;
    presaleSet("[data-presale-progress-pct]", `${pct.toFixed(2)}%`);
    presaleSet("[data-presale-raised]", `${presaleFormatLusdt(raised, 2)} raised`);
    presaleSet("[data-presale-net-liquidity]", presaleFormatLusdt(net, 2));
    presaleSet("[data-presale-sold-lst]", presaleFormatLst(sold, 2));
    presaleSet("[data-presale-bonus-total]", presaleFormatLst(bonusTotal, 2));

    const bonusPct = Number(BigInt(bonusBps || 0)) / 100;
    presaleSet("[data-presale-bonus-chip]", `${bonusPct.toFixed(bonusPct % 1 ? 2 : 0)}% Genesis bonus now`);

    const fundedText = reserve?.[2] ? "Reserve funded" : "Reserve check pending";
    if (reserve?.[2] && !active && !liquidityCreated && !refundAvailable) {
      presaleLog("[data-presale-action-log]", `${fundedText}. Waiting for the contract sale window.`, "ok");
    }

    const address = walletState.address || appKit.getAddress?.() || "";
    if (address) {
      const [lusdtBalance, info, claimablePurchased] = await Promise.all([
        presaleLusdt().balanceOf(address).catch(() => 0n),
        contract.userInfo(address).catch(() => null),
        contract.claimablePurchased(address).catch(() => 0n)
      ]);
      presaleSet("[data-presale-lusdt-balance]", presaleFormatLusdt(lusdtBalance, 4));
      if (info) {
        const contributed = BigInt(info[0] || 0);
        const remainingWallet = LUST_PRESALE_MAX_WALLET > contributed ? LUST_PRESALE_MAX_WALLET - contributed : 0n;
        presaleSet("[data-presale-user-contributed]", presaleFormatLusdt(info[0], 2));
        presaleSet("[data-presale-user-purchased]", presaleFormatLst(info[1], 2));
        presaleSet("[data-presale-user-bonus]", presaleFormatLst(info[2], 2));
        presaleSet("[data-presale-user-claimable]", presaleFormatLst(claimablePurchased, 2));
        presaleSet("[data-presale-user-bonus-available]", presaleFormatLst(info[6], 2));
        presaleSet("[data-presale-remaining-wallet]", presaleFormatLusdt(remainingWallet, 2));
      }
    } else {
      presaleSet("[data-presale-lusdt-balance]", "Connect wallet");
      presaleSet("[data-presale-user-contributed]", "--");
      presaleSet("[data-presale-user-purchased]", "--");
      presaleSet("[data-presale-user-bonus]", "--");
      presaleSet("[data-presale-user-claimable]", "--");
      presaleSet("[data-presale-user-bonus-available]", "--");
      presaleSet("[data-presale-remaining-wallet]", "Connect wallet");
    }

    await presaleUpdateQuote();
  } catch (err) {
    console.error(err);
    presaleSet("[data-presale-status]", "RPC unavailable");
    presaleLog("[data-presale-log]", err?.message || "Could not load presale data.", "warn");
  }
}

async function presaleBuy() {
  try {
    const raw = document.querySelector("[data-presale-amount]")?.value || "";
    const amount = presaleParseLusdt(raw);
    if (amount < 10_000000n) throw new Error("Minimum buy is 10 LUSDT.");

    const signer = await presaleSigner();
    const buyer = await signer.getAddress();
    const read = presaleContract();
    const active = await read.isSaleActive();
    if (!active) throw new Error("Sale is not active yet.");

    const already = await read.contributedLUSDT(buyer).catch(() => 0n);
    if (BigInt(already || 0) + amount > LUST_PRESALE_MAX_WALLET) throw new Error("Maximum per wallet is 500 LUSDT.");

    const token = presaleLusdt(signer);
    const allowance = await token.allowance(buyer, LUST_PRESALE_ADDRESS);
    if (allowance < amount) {
      presaleLog("[data-presale-action-log]", "Approval needed. Confirm LUSDT approval in your wallet...");
      const approveTx = await token.approve(LUST_PRESALE_ADDRESS, amount);
      presaleLog("[data-presale-action-log]", `Approval sent: ${approveTx.hash}. Waiting confirmation...`);
      await approveTx.wait();
    }

    presaleLog("[data-presale-action-log]", "Opening buy confirmation in your wallet...");
    const tx = await presaleContract(signer).buy(amount);
    presaleLog("[data-presale-action-log]", `Buy sent: ${tx.hash}. Waiting confirmation...`);
    await tx.wait();
    presaleLog("[data-presale-action-log]", `Genesis LST purchase confirmed: ${tx.hash}`, "ok");
    await presaleUpdateAll();
  } catch (err) {
    console.error(err);
    presaleLog("[data-presale-action-log]", err?.shortMessage || err?.message || "Buy failed or was rejected.", "warn");
  }
}

async function presaleClaimPurchased() {
  try {
    const signer = await presaleSigner();
    presaleLog("[data-presale-action-log]", "Opening purchased LST claim in your wallet...");
    const tx = await presaleContract(signer).claimPurchased();
    presaleLog("[data-presale-action-log]", `Claim sent: ${tx.hash}. Waiting confirmation...`);
    await tx.wait();
    presaleLog("[data-presale-action-log]", `Purchased LST claimed: ${tx.hash}`, "ok");
    await presaleUpdateAll();
  } catch (err) {
    console.error(err);
    presaleLog("[data-presale-action-log]", err?.shortMessage || err?.message || "Claim failed or nothing is available.", "warn");
  }
}

async function presaleClaimBonus() {
  try {
    const signer = await presaleSigner();
    presaleLog("[data-presale-action-log]", "Opening bonus claim in your wallet...");
    const tx = await presaleContract(signer).claimBonus();
    presaleLog("[data-presale-action-log]", `Bonus claim sent: ${tx.hash}. Waiting confirmation...`);
    await tx.wait();
    presaleLog("[data-presale-action-log]", `Bonus claimed: ${tx.hash}`, "ok");
    await presaleUpdateAll();
  } catch (err) {
    console.error(err);
    presaleLog("[data-presale-action-log]", err?.shortMessage || err?.message || "Bonus is not available yet.", "warn");
  }
}

async function presaleRefund() {
  try {
    const signer = await presaleSigner();
    const canRefund = await presaleContract().isRefundAvailable();
    if (!canRefund) throw new Error("Refund is not available by contract rule right now.");
    presaleLog("[data-presale-action-log]", "Opening refund confirmation in your wallet...");
    const tx = await presaleContract(signer).refund();
    presaleLog("[data-presale-action-log]", `Refund sent: ${tx.hash}. Waiting confirmation...`);
    await tx.wait();
    presaleLog("[data-presale-action-log]", `LUSDT refunded: ${tx.hash}`, "ok");
    await presaleUpdateAll();
  } catch (err) {
    console.error(err);
    presaleLog("[data-presale-action-log]", err?.shortMessage || err?.message || "Refund failed or is not available.", "warn");
  }
}

async function presaleUseMax() {
  try {
    const signer = await presaleSigner();
    const address = await signer.getAddress();
    const [balance, contributed] = await Promise.all([
      presaleLusdt().balanceOf(address),
      presaleContract().contributedLUSDT(address).catch(() => 0n)
    ]);
    const remainingWallet = LUST_PRESALE_MAX_WALLET > BigInt(contributed || 0) ? LUST_PRESALE_MAX_WALLET - BigInt(contributed || 0) : 0n;
    const remainingHardcap = LUST_PRESALE_HARDCAP > presaleState.raised ? LUST_PRESALE_HARDCAP - presaleState.raised : 0n;
    const max = [BigInt(balance || 0), remainingWallet, remainingHardcap].reduce((a, b) => a < b ? a : b);
    document.querySelector("[data-presale-amount]").value = presaleFormat(max, 6, 6);
    await presaleUpdateQuote();
  } catch (err) {
    presaleLog("[data-presale-action-log]", err?.message || "Could not read max LUSDT.", "warn");
  }
}

function wireLUSTPresale() {
  if (!presaleHasPage()) return;
  document.querySelector("[data-presale-refresh]")?.addEventListener("click", presaleUpdateAll);
  document.querySelector("[data-presale-amount]")?.addEventListener("input", () => setTimeout(presaleUpdateQuote, 80));
  document.querySelector("[data-presale-buy]")?.addEventListener("click", presaleBuy);
  document.querySelector("[data-presale-claim]")?.addEventListener("click", presaleClaimPurchased);
  document.querySelector("[data-presale-claim-bonus]")?.addEventListener("click", presaleClaimBonus);
  document.querySelector("[data-presale-refund]")?.addEventListener("click", presaleRefund);
  document.querySelector("[data-presale-max]")?.addEventListener("click", presaleUseMax);
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-connect-wallet]")) {
      setTimeout(presaleUpdateAll, 1200);
      setTimeout(presaleUpdateAll, 2500);
    }
  });
  presaleUpdateAll();
  setInterval(() => presaleRenderCountdown(presaleState.targetCountdown), 1000);
  setInterval(presaleUpdateAll, 25000);
}

window.lustPresale = {
  address: LUST_PRESALE_ADDRESS,
  refresh: presaleUpdateAll
};

wireLUSTPresale();
