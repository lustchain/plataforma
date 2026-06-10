import { createAppKit } from "https://esm.sh/@reown/appkit@1.8.20";
import { EthersAdapter } from "https://esm.sh/@reown/appkit-adapter-ethers@1.8.20";
import { defineChain } from "https://esm.sh/@reown/appkit@1.8.20/networks";

const LUST_CHAIN_ID_DECIMAL = 6923;
const LUST_CHAIN_ID_HEX = "0x1b0b";
const LUST_REOWN_PROJECT_ID = "abda6475ac4aba59197da882facababc";

const lustNetwork = defineChain({
  id: LUST_CHAIN_ID_DECIMAL,
  caipNetworkId: `eip155:${LUST_CHAIN_ID_DECIMAL}`,
  chainNamespace: "eip155",
  name: "LUST Chain",
  nativeCurrency: {
    decimals: 18,
    name: "LST",
    symbol: "LST"
  },
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

const featuredWalletIds = [
  "c57ca95b47569778a828d19178114f2db125b25b778adf5cba72bd778e231769",
  "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369",
  "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0"
];

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
  featuredWalletIds,
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

let currentWallet = {
  address: "",
  chainId: "",
  isConnected: false
};

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

function buttonDisconnectedHtml() {
  return `
    <div class="connect-icon">◫</div>
    <div class="connect-copy">
      <strong>Connect wallet</strong>
      <span>Wallet not connected</span>
    </div>
    <div class="connect-caret">⌄</div>
  `;
}

function buttonConnectedHtml(address, chainId) {
  const ready = normalizeChainId(chainId) === LUST_CHAIN_ID_HEX;
  return `
    <div class="connect-icon ${ready ? "ready" : "warn"}">${ready ? "✓" : "!"}</div>
    <div class="connect-copy">
      <strong>${shortAddress(address)}</strong>
      <span>${ready ? "LUST CHAIN READY" : `SWITCH TO LUST ${LUST_CHAIN_ID_DECIMAL}`}</span>
    </div>
    <div class="connect-caret">⌄</div>
  `;
}

function updateConnectButtons() {
  const address = currentWallet.address || "";
  const chainId = normalizeChainId(currentWallet.chainId || "");

  document.querySelectorAll("[data-connect]").forEach((btn) => {
    btn.innerHTML = currentWallet.isConnected && address
      ? buttonConnectedHtml(address, chainId)
      : buttonDisconnectedHtml();
  });
}

function readAppKitState() {
  try {
    const address = appKit.getAddress?.() || "";
    const rawChainId = appKit.getChainId?.() || "";
    const isConnected = Boolean(appKit.getIsConnected?.() || address);

    currentWallet = {
      address,
      chainId: normalizeChainId(rawChainId),
      isConnected
    };

    updateConnectButtons();
  } catch (err) {
    console.warn("AppKit state read failed", err);
  }
}

async function openWallet() {
  try {
    readAppKitState();

    if (currentWallet.isConnected && currentWallet.address) {
      await appKit.open({ view: "Account" });
    } else {
      await appKit.open({ view: "Connect", namespace: "eip155" });
    }

    window.setTimeout(readAppKitState, 400);
    window.setTimeout(readAppKitState, 1200);
    window.setTimeout(readAppKitState, 2500);
  } catch (err) {
    console.error(err);
    alert("Could not open wallet modal.");
  }
}

async function switchToLust() {
  try {
    await appKit.switchNetwork(lustNetwork);
    window.setTimeout(readAppKitState, 450);
  } catch (err) {
    console.warn("Network switch cancelled or failed", err);
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

appKit.subscribeProvider?.((state) => {
  currentWallet = {
    address: state?.address || appKit.getAddress?.() || "",
    chainId: normalizeChainId(state?.chainId || appKit.getChainId?.() || ""),
    isConnected: Boolean(state?.isConnected || state?.address || appKit.getIsConnected?.())
  };

  updateConnectButtons();

  if (currentWallet.isConnected && currentWallet.address && normalizeChainId(currentWallet.chainId) !== LUST_CHAIN_ID_HEX) {
    window.setTimeout(switchToLust, 300);
  }
});

appKit.subscribeState?.(() => {
  window.setTimeout(readAppKitState, 100);
  window.setTimeout(readAppKitState, 1000);
});

appKit.subscribeEvents?.(() => {
  window.setTimeout(readAppKitState, 120);
  window.setTimeout(readAppKitState, 900);
});

document.addEventListener("click", (event) => {
  const connectButton = event.target.closest("[data-connect]");
  if (connectButton) {
    event.preventDefault();
    openWallet();
  }
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

updateConnectButtons();
readAppKitState();
window.setTimeout(readAppKitState, 700);
window.setTimeout(readAppKitState, 2200);
