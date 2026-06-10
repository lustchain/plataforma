const LUST_CHAIN_ID_DECIMAL = 6923;
const LUST_CHAIN_ID_HEX = "0x1b0b";
const LUST_CAIP_CHAIN_ID = "eip155:6923";
const LUST_REOWN_PROJECT_ID = "abda6475ac4aba59197da882facababc";

const LUST_CHAIN = {
  chainId: LUST_CHAIN_ID_HEX,
  chainName: "LUST Chain",
  nativeCurrency: {
    name: "LST",
    symbol: "LST",
    decimals: 18
  },
  rpcUrls: ["https://rpc.lustchain.org"],
  blockExplorerUrls: ["https://explorer.lustchain.org"]
};

let activeWallet = {
  connector: "",
  address: "",
  chainId: "",
  provider: null
};

let walletConnectProviderPromise = null;

function shortAddress(address) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect wallet";
}

function chainText(chainId) {
  const normalized = normalizeChainId(chainId);
  if (!normalized) return "Wallet not connected";
  if (normalized === LUST_CHAIN_ID_HEX) return "LUST CHAIN READY";
  const number = normalized.startsWith("0x") ? parseInt(normalized, 16) : Number(normalized);
  return Number.isFinite(number) ? `SWITCH TO LUST ${LUST_CHAIN_ID_DECIMAL}` : "Wrong network";
}

function normalizeChainId(chainId) {
  if (chainId === undefined || chainId === null || chainId === "") return "";
  if (typeof chainId === "number") return `0x${chainId.toString(16)}`.toLowerCase();
  const raw = String(chainId).trim().toLowerCase();
  if (!raw) return "";
  if (raw.startsWith("0x")) return raw;
  if (raw.startsWith("eip155:")) {
    const value = Number(raw.replace("eip155:", ""));
    return Number.isFinite(value) ? `0x${value.toString(16)}`.toLowerCase() : "";
  }
  const value = Number(raw);
  return Number.isFinite(value) ? `0x${value.toString(16)}`.toLowerCase() : raw;
}

function connectedHtml(address, chainId) {
  const ready = normalizeChainId(chainId) === LUST_CHAIN_ID_HEX;
  return `
    <div class="connect-icon">${ready ? "✓" : "!"}</div>
    <div class="connect-copy">
      <strong>${shortAddress(address)}</strong>
      <span>${chainText(chainId)}</span>
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

function setConnectedState({ connector, address, chainId, provider }) {
  activeWallet = {
    connector: connector || "injected",
    address: address || "",
    chainId: normalizeChainId(chainId) || LUST_CHAIN_ID_HEX,
    provider: provider || null
  };

  document.querySelectorAll("[data-connect]").forEach((btn) => {
    btn.innerHTML = connectedHtml(activeWallet.address, activeWallet.chainId);
  });

  try {
    localStorage.setItem("lust_wallet_connector", activeWallet.connector);
  } catch {}
}

function setDisconnectedState() {
  activeWallet = { connector: "", address: "", chainId: "", provider: null };
  document.querySelectorAll("[data-connect]").forEach((btn) => {
    btn.innerHTML = disconnectedHtml();
  });
  try {
    localStorage.removeItem("lust_wallet_connector");
  } catch {}
}

async function addLustNetwork(provider = window.ethereum) {
  if (!provider) {
    alert("Browser wallet not found.");
    return false;
  }

  try {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [LUST_CHAIN]
    });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function switchToLust(provider = activeWallet.provider || window.ethereum) {
  if (!provider) {
    alert("Wallet not found.");
    return false;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: LUST_CHAIN_ID_HEX }]
    });
    return true;
  } catch (err) {
    if (err && (err.code === 4902 || err.code === -32603)) {
      return addLustNetwork(provider);
    }
    console.error(err);
    return false;
  }
}

function ensureWalletModal() {
  let modal = document.getElementById("walletModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "walletModal";
  modal.className = "wallet-modal-backdrop";
  modal.innerHTML = `
    <div class="wallet-modal" role="dialog" aria-modal="true" aria-label="Connect wallet">
      <div class="wallet-modal-head">
        <div class="wallet-modal-title">
          <div class="connect-icon">◫</div>
          <div>
            <div>Connect wallet</div>
            <small style="color:var(--muted);font-weight:800">LUST Chain</small>
          </div>
        </div>
        <button class="wallet-close" type="button" data-wallet-close>×</button>
      </div>
      <div class="wallet-modal-body" id="walletModalBody"></div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-wallet-close]")) {
      closeWalletModal();
    }
  });

  return modal;
}

function openWalletModal() {
  const modal = ensureWalletModal();
  modal.classList.add("open");
  renderWalletModal();
}

function closeWalletModal() {
  document.getElementById("walletModal")?.classList.remove("open");
}

function renderWalletModal() {
  const body = document.getElementById("walletModalBody");
  if (!body) return;

  if (activeWallet.address) {
    body.innerHTML = `
      <div class="wallet-status-box">
        <div class="row"><span>Status</span><strong class="status">${chainText(activeWallet.chainId)}</strong></div>
        <div class="row"><span>Connector</span><strong>${activeWallet.connector === "walletconnect" ? "WalletConnect" : "Browser wallet"}</strong></div>
        <div>
          <span style="color:var(--muted);font-size:13px">Address</span>
          <div class="wallet-address">${activeWallet.address}</div>
        </div>
      </div>
      <div class="wallet-modal-actions">
        <button class="btn primary" type="button" data-wallet-switch>Switch/Add LUST</button>
        <button class="btn" type="button" data-wallet-copy>Copy address</button>
        <button class="btn wallet-disconnect-danger" type="button" data-wallet-disconnect>Disconnect</button>
        <a class="btn" href="https://explorer.lustchain.org/address/${activeWallet.address}" target="_blank" rel="noreferrer">Explorer</a>
      </div>
      <p class="wallet-note">This button behaves like the INRI wallet button: click connected state to manage wallet, switch network, copy address or disconnect.</p>
    `;
    body.querySelector("[data-wallet-switch]")?.addEventListener("click", async () => {
      await switchToLust(activeWallet.provider || window.ethereum);
      await hydrateWallet();
      renderWalletModal();
    });
    body.querySelector("[data-wallet-copy]")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(activeWallet.address);
      } catch {}
    });
    body.querySelector("[data-wallet-disconnect]")?.addEventListener("click", async () => {
      await disconnectWallet();
      closeWalletModal();
    });
    return;
  }

  body.innerHTML = `
    <button class="wallet-option" type="button" data-browser-wallet>
      <div class="wallet-option-icon">M</div>
      <div class="wallet-option-copy">
        <strong>Browser wallet</strong>
        <span>MetaMask, Rabby, Brave Wallet and injected EVM wallets.</span>
      </div>
    </button>

    <button class="wallet-option" type="button" data-walletconnect>
      <div class="wallet-option-icon">WC</div>
      <div class="wallet-option-copy">
        <strong>WalletConnect</strong>
        <span>Open QR modal for mobile wallets and WalletConnect-compatible apps.</span>
      </div>
    </button>

    <p class="wallet-note">WalletConnect uses the LUST Chain Reown project and opens the QR modal. Browser wallet also adds/switches to Chain ID 6923.</p>
  `;

  body.querySelector("[data-browser-wallet]")?.addEventListener("click", connectBrowserWallet);
  body.querySelector("[data-walletconnect]")?.addEventListener("click", connectWalletConnect);
}

function setWalletModalLoading(message) {
  const body = document.getElementById("walletModalBody");
  if (!body) return;
  body.innerHTML = `
    <div class="wallet-loading">
      <div class="wallet-spinner"></div>
      <span>${message}</span>
    </div>
  `;
}

async function connectBrowserWallet() {
  if (!window.ethereum) {
    alert("MetaMask/browser wallet not found.");
    return;
  }

  try {
    setWalletModalLoading("Connecting browser wallet...");
    await addLustNetwork(window.ethereum);
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const chainId = await window.ethereum.request({ method: "eth_chainId" }).catch(() => LUST_CHAIN_ID_HEX);
    const address = accounts && accounts[0];

    if (address) {
      setConnectedState({
        connector: "injected",
        address,
        chainId,
        provider: window.ethereum
      });
      renderWalletModal();
    } else {
      setDisconnectedState();
      renderWalletModal();
    }
  } catch (err) {
    console.error(err);
    setDisconnectedState();
    renderWalletModal();
  }
}

async function loadWalletConnectProvider() {
  if (!walletConnectProviderPromise) {
    walletConnectProviderPromise = import("https://esm.sh/@walletconnect/ethereum-provider@2.21.8").then(
      (mod) => mod.EthereumProvider.init({
        projectId: LUST_REOWN_PROJECT_ID,
        metadata: {
          name: "LUST Platform",
          description: "Official LUST Chain platform",
          url: window.location.origin,
          icons: [`${window.location.origin}/icon.png`]
        },
        showQrModal: true,
        chains: [LUST_CHAIN_ID_DECIMAL],
        optionalChains: [LUST_CHAIN_ID_DECIMAL],
        methods: [
          "eth_accounts",
          "eth_requestAccounts",
          "eth_chainId",
          "eth_sendTransaction",
          "personal_sign",
          "eth_sign",
          "eth_signTypedData",
          "eth_signTypedData_v3",
          "eth_signTypedData_v4",
          "wallet_switchEthereumChain",
          "wallet_addEthereumChain"
        ],
        optionalMethods: ["wallet_watchAsset"],
        events: ["accountsChanged", "chainChanged", "disconnect"],
        optionalEvents: ["accountsChanged", "chainChanged", "disconnect"],
        rpcMap: {
          [LUST_CHAIN_ID_DECIMAL]: "https://rpc.lustchain.org"
        }
      })
    );
  }

  return walletConnectProviderPromise;
}

async function readProviderState(provider) {
  let address = "";
  let chainId = LUST_CHAIN_ID_HEX;

  try {
    const accounts = await provider.request({ method: "eth_accounts" }, LUST_CAIP_CHAIN_ID);
    address = Array.isArray(accounts) ? accounts[0] || "" : "";
  } catch {}

  try {
    const nextChainId = await provider.request({ method: "eth_chainId" }, LUST_CAIP_CHAIN_ID);
    chainId = normalizeChainId(nextChainId) || LUST_CHAIN_ID_HEX;
  } catch {}

  if (!address && provider.session) {
    const accounts = provider.session?.namespaces?.eip155?.accounts || [];
    const first = accounts[0] || "";
    const parts = first.split(":");
    if (parts.length >= 3) {
      address = parts[2];
      chainId = normalizeChainId(parts[1]) || LUST_CHAIN_ID_HEX;
    }
  }

  return { address, chainId };
}

async function connectWalletConnect() {
  try {
    setWalletModalLoading("Opening WalletConnect QR...");
    const provider = await loadWalletConnectProvider();

    provider.on?.("accountsChanged", async () => {
      const state = await readProviderState(provider);
      if (state.address) {
        setConnectedState({ connector: "walletconnect", address: state.address, chainId: state.chainId, provider });
      }
    });

    provider.on?.("chainChanged", async () => {
      const state = await readProviderState(provider);
      if (state.address) {
        setConnectedState({ connector: "walletconnect", address: state.address, chainId: state.chainId, provider });
      }
    });

    provider.on?.("disconnect", () => {
      setDisconnectedState();
    });

    await provider.connect();
    const state = await readProviderState(provider);

    if (state.address) {
      setConnectedState({
        connector: "walletconnect",
        address: state.address,
        chainId: state.chainId || LUST_CHAIN_ID_HEX,
        provider
      });
      renderWalletModal();
    } else {
      setDisconnectedState();
      renderWalletModal();
    }
  } catch (err) {
    console.error(err);
    setDisconnectedState();
    renderWalletModal();
    alert("WalletConnect connection failed or was cancelled.");
  }
}

async function disconnectWallet() {
  try {
    if (activeWallet.connector === "walletconnect" && activeWallet.provider?.disconnect) {
      await activeWallet.provider.disconnect();
    }
  } catch (err) {
    console.error(err);
  }

  try {
    localStorage.removeItem("lust_wallet_connector");
  } catch {}

  setDisconnectedState();
}

async function hydrateWallet() {
  try {
    const saved = localStorage.getItem("lust_wallet_connector");

    if (saved === "walletconnect") {
      const provider = await loadWalletConnectProvider();
      const state = await readProviderState(provider);
      if (state.address) {
        setConnectedState({ connector: "walletconnect", address: state.address, chainId: state.chainId, provider });
        return;
      }
    }

    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      const chainId = await window.ethereum.request({ method: "eth_chainId" }).catch(() => "");
      if (accounts && accounts[0]) {
        setConnectedState({ connector: "injected", address: accounts[0], chainId, provider: window.ethereum });
        return;
      }
    }
  } catch (err) {
    console.error(err);
  }

  setDisconnectedState();
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

document.addEventListener("click", (event) => {
  const connectButton = event.target.closest("[data-connect]");
  if (connectButton) {
    event.preventDefault();
    openWalletModal();
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

window.ethereum?.on?.("accountsChanged", hydrateWallet);
window.ethereum?.on?.("chainChanged", hydrateWallet);

hydrateWallet();
