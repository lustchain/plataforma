import { ethers } from "https://esm.sh/ethers@6.16.0";

const FACTORY_ADDRESS = "0xbCB6A89713796eE1C0414c8898dED5657e6b9526";
const LUSDT_ADDRESS = "0x1E8636066d7e86De0A8Bd6Acb1e54BE129aC19AE";
const LUST_RPC_URL = "https://rpc.lustchain.org";
const LUST_EXPLORER_URL = "https://explorer.lustchain.org";
const METADATA_ENDPOINT = `${LUST_EXPLORER_URL}/api/token-factory/metadata`;

const LUST_CHAIN = {
  chainId: "0x1b0b",
  chainName: "LUST Chain",
  nativeCurrency: { name: "LST", symbol: "LST", decimals: 18 },
  rpcUrls: [LUST_RPC_URL],
  blockExplorerUrls: [LUST_EXPLORER_URL]
};

const PAYMENT = { LUSDT: 0, LST: 1 };
const PLAN = { BASIC: 1, LOGO: 2, PREMIUM: 3 };

const PLAN_NAMES = {
  [PLAN.BASIC]: "Basic",
  [PLAN.LOGO]: "Logo",
  [PLAN.PREMIUM]: "Premium"
};

const PAYMENT_NAMES = {
  [PAYMENT.LUSDT]: "LUSDT",
  [PAYMENT.LST]: "LST"
};

const FACTORY_ABI = [
  "function paused() view returns (bool)",
  "function lusdtPaymentsEnabled() view returns (bool)",
  "function lstPaymentsEnabled() view returns (bool)",
  "function totalTokens() view returns (uint256)",
  "function getLUSDTFeeForPlan(uint8 plan) view returns (uint256)",
  "function getLSTFeeForPlan(uint8 plan) view returns (uint256)",
  "function getCreatorTokens(address creator) view returns (address[])",
  "function getTokenRecordByToken(address token) view returns (tuple(address token,address creator,uint8 plan,uint8 paymentAsset,address paymentToken,string name,string symbol,uint8 decimals,uint256 supply,uint256 totalSupply,uint256 feePaid,string metadataURI,uint256 createdAt))",
  "function createBasicToken(string name,string symbol,uint8 decimals,uint256 supply,uint8 paymentAsset) payable returns (address)",
  "function createLogoToken(string name,string symbol,uint8 decimals,uint256 supply,string metadataURI,uint8 paymentAsset) payable returns (address)",
  "function createPremiumToken(string name,string symbol,uint8 decimals,uint256 supply,string metadataURI,uint8 paymentAsset) payable returns (address)",
  "event TokenCreated(address indexed creator,address indexed token,uint8 indexed plan,uint8 paymentAsset,address paymentToken,uint256 feePaid,string metadataURI)"
];

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)"
];

const provider = new ethers.JsonRpcProvider(LUST_RPC_URL);
const factoryRead = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return [...document.querySelectorAll(selector)];
}

function setText(selector, value) {
  $all(selector).forEach((el) => { el.textContent = value; });
}

function log(message, tone = "") {
  const box = $("[data-factory-log]");
  if (!box) return;
  box.textContent = message;
  box.dataset.tone = tone;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shortAddress(address) {
  return address ? `${String(address).slice(0, 6)}...${String(address).slice(-4)}` : "--";
}

function selectedPlan() {
  return Number($("[data-factory-plan]:checked")?.value || String(PLAN.BASIC));
}

function selectedPayment() {
  return Number($("[data-factory-payment]:checked")?.value || String(PAYMENT.LUSDT));
}

function formatFee(value, paymentAsset) {
  try {
    const decimals = paymentAsset === PAYMENT.LUSDT ? 6 : 18;
    const symbol = paymentAsset === PAYMENT.LUSDT ? "LUSDT" : "LST";
    const text = ethers.formatUnits(BigInt(value || 0), decimals);
    const [whole, fraction = ""] = text.split(".");
    const trimmed = fraction.replace(/0+$/, "").slice(0, paymentAsset === PAYMENT.LUSDT ? 6 : 4);
    return `${whole}${trimmed ? `.${trimmed}` : ""} ${symbol}`;
  } catch (_) {
    return `-- ${paymentAsset === PAYMENT.LUSDT ? "LUSDT" : "LST"}`;
  }
}

function getName() {
  const value = String($("[data-factory-name]")?.value || "").trim();
  if (!value) throw new Error("Enter token name.");
  if (value.length > 64) throw new Error("Token name is too long.");
  return value;
}

function getSymbol() {
  const value = String($("[data-factory-symbol]")?.value || "").trim().toUpperCase();
  if (!value) throw new Error("Enter token symbol.");
  if (value.length > 16) throw new Error("Token symbol is too long.");
  return value;
}

function getDecimals() {
  const value = Number($("[data-factory-decimals]")?.value || "18");
  if (!Number.isInteger(value) || value < 0 || value > 18) {
    throw new Error("Decimals must be between 0 and 18.");
  }
  return value;
}

function getSupply() {
  const raw = String($("[data-factory-supply]")?.value || "").trim().replaceAll(",", "");
  if (!raw || !/^\d+$/.test(raw)) throw new Error("Supply must be a whole number. Example: 1000000");
  const value = BigInt(raw);
  if (value <= 0n) throw new Error("Supply must be greater than zero.");
  return value;
}

function getUrlField(selector, label) {
  const value = String($(selector)?.value || "").trim();
  if (!value) return "";
  if (value.length > 256) throw new Error(`${label} is too long.`);
  if (!value.startsWith("https://") && !value.startsWith("http://")) {
    throw new Error(`${label} must start with https:// or http://`);
  }
  return value;
}

function getDescription(plan) {
  const value = String($("[data-factory-description]")?.value || "").trim();
  if (value.length > 800) throw new Error("Description is too long.");
  if ((plan === PLAN.LOGO || plan === PLAN.PREMIUM) && !value) throw new Error(`${PLAN_NAMES[plan]} plan requires a description.`);
  return value;
}

function getLogoFile(plan) {
  const input = $("[data-factory-logo]");
  const file = input?.files?.[0] || null;
  if ((plan === PLAN.LOGO || plan === PLAN.PREMIUM) && !file) {
    throw new Error("Logo and Premium plans require a logo image.");
  }
  if (!file) return null;
  const allowed = ["image/png", "image/webp", "image/jpeg", "image/svg+xml"];
  if (!allowed.includes(file.type)) throw new Error("Logo must be PNG, WEBP, JPG or SVG.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Logo must be 2 MB or smaller.");
  return file;
}

function updateLogoFileName() {
  const file = $("[data-factory-logo]")?.files?.[0];
  const nameEl = $("[data-factory-logo-name]");
  if (!nameEl) return;
  nameEl.textContent = file ? file.name : "No file selected";
}

async function uploadMetadataForExplorer({ plan, name, symbol, creator }) {
  if (plan === PLAN.BASIC) return "";

  const logo = getLogoFile(plan);
  const description = getDescription(plan);
  const website = plan === PLAN.PREMIUM ? getUrlField("[data-factory-website]", "Website") : "";
  const twitter = plan === PLAN.PREMIUM ? getUrlField("[data-factory-twitter]", "X/Twitter") : "";
  const telegram = plan === PLAN.PREMIUM ? getUrlField("[data-factory-telegram]", "Telegram") : "";

  const form = new FormData();
  form.append("plan", String(plan));
  form.append("name", name);
  form.append("symbol", symbol);
  form.append("description", description);
  form.append("website", website);
  form.append("twitter", twitter);
  form.append("telegram", telegram);
  form.append("creator", creator);
  if (logo) form.append("logo", logo);

  log("Uploading logo and metadata to LUST Explorer...");
  const response = await fetch(METADATA_ENDPOINT, { method: "POST", body: form });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok || !data.metadataURI) {
    throw new Error(data.error || "Metadata upload failed.");
  }

  const generated = $("[data-factory-metadata-generated]");
  if (generated) generated.value = data.metadataURI;

  log("Metadata created. Opening token creation confirmation in wallet...");
  return data.metadataURI;
}

function injectedProvider() {
  const eth = window.ethereum;
  if (!eth) throw new Error("MetaMask or another injected wallet was not found.");
  return eth;
}

async function ensureLustChain() {
  const eth = injectedProvider();
  const current = await eth.request({ method: "eth_chainId" });
  if (String(current).toLowerCase() === LUST_CHAIN.chainId) return;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: LUST_CHAIN.chainId }] });
  } catch (err) {
    if (err?.code === 4902 || String(err?.message || "").includes("Unrecognized chain")) {
      await eth.request({ method: "wallet_addEthereumChain", params: [LUST_CHAIN] });
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: LUST_CHAIN.chainId }] });
      return;
    }
    throw err;
  }
}

async function signer() {
  const eth = injectedProvider();
  await eth.request({ method: "eth_requestAccounts" });
  const browserProvider = new ethers.BrowserProvider(eth);
  return browserProvider.getSigner();
}

async function walletAddress() {
  try {
    const eth = injectedProvider();
    const accounts = await eth.request({ method: "eth_accounts" });
    return accounts?.[0] || "";
  } catch (_) {
    return "";
  }
}

async function readFees(plan = selectedPlan()) {
  const [lusdtFee, lstFee] = await Promise.all([
    factoryRead.getLUSDTFeeForPlan(plan),
    factoryRead.getLSTFeeForPlan(plan)
  ]);
  return { lusdtFee: BigInt(lusdtFee), lstFee: BigInt(lstFee) };
}

async function updateSelection() {
  const plan = selectedPlan();
  const payment = selectedPayment();

  $all("[data-factory-plan-card]").forEach((card) => {
    const input = card.querySelector("[data-factory-plan]");
    card.classList.toggle("is-selected", input?.checked === true);
  });

  $all("[data-factory-payment-card]").forEach((card) => {
    const input = card.querySelector("[data-factory-payment]");
    card.classList.toggle("is-selected", input?.checked === true);
  });

  const metadataWrap = $(".factory-metadata-wrap");
  if (metadataWrap) metadataWrap.style.display = plan === PLAN.BASIC ? "none" : "block";

  $all(".factory-premium-only").forEach((el) => {
    el.style.display = plan === PLAN.PREMIUM ? "block" : "none";
  });

  const descriptionNote = $("[data-factory-description-note]");
  if (descriptionNote) {
    descriptionNote.textContent = plan === PLAN.PREMIUM
      ? "Premium profile: use a full project description. Website and social links are available."
      : "Logo profile: use a short description. Website and social links are reserved for Premium.";
  }

  setText("[data-factory-summary-plan]", PLAN_NAMES[plan] || "--");
  setText("[data-factory-summary-payment]", PAYMENT_NAMES[payment] || "--");

  try {
    const { lusdtFee, lstFee } = await readFees(plan);
    setText("[data-factory-selected-lusdt-fee]", formatFee(lusdtFee, PAYMENT.LUSDT));
    setText("[data-factory-selected-lst-fee]", formatFee(lstFee, PAYMENT.LST));
    setText("[data-factory-summary-fee]", payment === PAYMENT.LUSDT ? formatFee(lusdtFee, PAYMENT.LUSDT) : formatFee(lstFee, PAYMENT.LST));
  } catch (err) {
    console.warn(err);
    setText("[data-factory-summary-fee]", "Unavailable");
  }
}

async function refreshWalletData() {
  const address = await walletAddress();
  if (!address) {
    setText("[data-factory-wallet]", "Not connected");
    setText("[data-factory-lusdt-balance]", "Connect wallet");
    setText("[data-factory-lusdt-allowance]", "Connect wallet");
    renderMyTokens([]);
    return;
  }

  setText("[data-factory-wallet]", shortAddress(address));

  try {
    const token = new ethers.Contract(LUSDT_ADDRESS, ERC20_ABI, provider);
    const [balance, allowance, tokens] = await Promise.all([
      token.balanceOf(address),
      token.allowance(address, FACTORY_ADDRESS),
      factoryRead.getCreatorTokens(address)
    ]);
    setText("[data-factory-lusdt-balance]", formatFee(balance, PAYMENT.LUSDT));
    setText("[data-factory-lusdt-allowance]", formatFee(allowance, PAYMENT.LUSDT));
    await renderMyTokens(tokens);
  } catch (err) {
    console.warn(err);
    setText("[data-factory-lusdt-balance]", "Unavailable");
    setText("[data-factory-lusdt-allowance]", "Unavailable");
  }
}

async function refreshFactory() {
  try {
    const [paused, lusdtEnabled, lstEnabled, total] = await Promise.all([
      factoryRead.paused(),
      factoryRead.lusdtPaymentsEnabled(),
      factoryRead.lstPaymentsEnabled(),
      factoryRead.totalTokens()
    ]);

    setText("[data-factory-address-short]", shortAddress(FACTORY_ADDRESS));
    setText("[data-factory-total-tokens]", String(total));
    setText("[data-factory-status]", paused ? "Paused" : "Online");
    setText("[data-factory-lusdt-enabled]", lusdtEnabled ? "Enabled" : "Disabled");
    setText("[data-factory-lst-enabled]", lstEnabled ? "Enabled" : "Disabled");

    await updateSelection();
    await refreshWalletData();
  } catch (err) {
    console.error(err);
    setText("[data-factory-status]", "Unavailable");
    log(err?.shortMessage || err?.message || "Could not load factory data.", "warn");
  }
}

async function approveLUSDT() {
  try {
    await ensureLustChain();
    const s = await signer();
    const plan = selectedPlan();
    const fee = BigInt(await factoryRead.getLUSDTFeeForPlan(plan));
    if (fee <= 0n) {
      log("No LUSDT approval is needed for this plan.", "ok");
      return;
    }

    const owner = await s.getAddress();
    const token = new ethers.Contract(LUSDT_ADDRESS, ERC20_ABI, s);
    const currentAllowance = BigInt(await token.allowance(owner, FACTORY_ADDRESS));
    if (currentAllowance >= fee) {
      log("LUSDT allowance is already enough.", "ok");
      await refreshWalletData();
      return;
    }

    log(`Approving ${formatFee(fee, PAYMENT.LUSDT)}...`);
    const tx = await token.approve(FACTORY_ADDRESS, fee);
    log(`Approval sent: ${tx.hash}. Waiting confirmation...`);
    await tx.wait();
    log("LUSDT approved successfully.", "ok");
    await refreshWalletData();
  } catch (err) {
    console.error(err);
    log(err?.shortMessage || err?.message || "Approval failed or was rejected.", "warn");
  }
}

function parseCreatedToken(receipt) {
  const iface = new ethers.Interface(FACTORY_ABI);
  for (const item of receipt.logs || []) {
    try {
      if (String(item.address).toLowerCase() !== FACTORY_ADDRESS.toLowerCase()) continue;
      const parsed = iface.parseLog(item);
      if (parsed?.name === "TokenCreated") return parsed.args.token;
    } catch (_) {}
  }
  return "";
}

function renderCreatedToken(tokenAddress, txHash, name, symbol) {
  const box = $("[data-factory-success]");
  if (!box) return;
  box.innerHTML = `
    <div class="factory-token-item">
      <strong>${escapeHtml(name)} (${escapeHtml(symbol)})</strong>
      <span>${escapeHtml(tokenAddress)}</span>
      <a href="${LUST_EXPLORER_URL}/token/${tokenAddress}" target="_blank" rel="noopener">Open token on explorer</a><br>
      <a href="${LUST_EXPLORER_URL}/tx/${txHash}" target="_blank" rel="noopener">Open creation transaction</a>
    </div>
  `;
}

async function createToken(event) {
  event?.preventDefault?.();
  try {
    await ensureLustChain();

    const plan = selectedPlan();
    const payment = selectedPayment();
    const name = getName();
    const symbol = getSymbol();
    const decimals = getDecimals();
    const supply = getSupply();

    const s = await signer();
    const creator = await s.getAddress();
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, s);

    if (payment === PAYMENT.LUSDT) {
      const fee = BigInt(await factoryRead.getLUSDTFeeForPlan(plan));
      const owner = await s.getAddress();
      const token = new ethers.Contract(LUSDT_ADDRESS, ERC20_ABI, s);
      const currentAllowance = BigInt(await token.allowance(owner, FACTORY_ADDRESS));
      if (currentAllowance < fee) {
        log(`Approval needed first: ${formatFee(fee, PAYMENT.LUSDT)}. Confirm approval in wallet...`);
        const approveTx = await token.approve(FACTORY_ADDRESS, fee);
        log(`Approval sent: ${approveTx.hash}. Waiting confirmation...`);
        await approveTx.wait();
      }
    }

    const value = payment === PAYMENT.LST ? BigInt(await factoryRead.getLSTFeeForPlan(plan)) : 0n;
    const metadataURI = await uploadMetadataForExplorer({ plan, name, symbol, creator });

    if (plan === PLAN.BASIC) log("Opening token creation confirmation in wallet...");

    let tx;
    if (plan === PLAN.BASIC) {
      tx = await factory.createBasicToken(name, symbol, decimals, supply, payment, { value });
    } else if (plan === PLAN.LOGO) {
      tx = await factory.createLogoToken(name, symbol, decimals, supply, metadataURI, payment, { value });
    } else if (plan === PLAN.PREMIUM) {
      tx = await factory.createPremiumToken(name, symbol, decimals, supply, metadataURI, payment, { value });
    } else {
      throw new Error("Invalid plan.");
    }

    log(`Creation sent: ${tx.hash}. Waiting confirmation...`);
    const receipt = await tx.wait();
    const tokenAddress = parseCreatedToken(receipt);
    if (!tokenAddress) {
      log(`Token transaction confirmed, but event parsing failed. Open tx: ${tx.hash}`, "warn");
      return;
    }

    log(`Token created successfully: ${tokenAddress}`, "ok");
    renderCreatedToken(tokenAddress, tx.hash, name, symbol);
    setTimeout(refreshFactory, 1200);
  } catch (err) {
    console.error(err);
    log(err?.shortMessage || err?.message || "Token creation failed or was rejected.", "warn");
  }
}

async function renderMyTokens(tokens) {
  const box = $("[data-factory-token-list]");
  if (!box) return;

  if (!tokens || tokens.length === 0) {
    box.innerHTML = "<p>No tokens created by this wallet yet.</p>";
    return;
  }

  const latest = [...tokens].slice(-8).reverse();
  const records = await Promise.all(latest.map(async (token) => {
    try { return await factoryRead.getTokenRecordByToken(token); }
    catch (_) { return { token, name: "Token", symbol: "TOKEN", plan: 0 }; }
  }));

  box.innerHTML = records.map((record) => {
    const token = record.token || record[0];
    const name = record.name || record[5] || "Token";
    const symbol = record.symbol || record[6] || "TOKEN";
    const plan = Number(record.plan ?? record[2] ?? 0);
    return `
      <div class="factory-token-item">
        <strong>${escapeHtml(name)} (${escapeHtml(symbol)})</strong>
        <span>${escapeHtml(token)}</span>
        <span>Plan: ${escapeHtml(PLAN_NAMES[plan] || "--")}</span>
        <a href="${LUST_EXPLORER_URL}/token/${token}" target="_blank" rel="noopener">Open on explorer</a>
      </div>
    `;
  }).join("");
}

function wireFactoryPage() {
  $all("[data-factory-plan], [data-factory-payment]").forEach((input) => {
    input.addEventListener("change", () => {
      updateSelection();
      refreshWalletData();
    });
  });

  $("[data-factory-logo-picker]")?.addEventListener("click", () => {
    $("[data-factory-logo]")?.click();
  });
  $("[data-factory-logo]")?.addEventListener("change", updateLogoFileName);

  $("[data-factory-refresh]")?.addEventListener("click", refreshFactory);
  $("[data-factory-approve]")?.addEventListener("click", approveLUSDT);
  $("#tokenFactoryForm")?.addEventListener("submit", createToken);
  $("[data-factory-address-short]")?.addEventListener("click", () => {
    navigator.clipboard?.writeText?.(FACTORY_ADDRESS).catch(() => {});
    log("Factory address copied.", "ok");
  });

  if (window.ethereum?.on) {
    window.ethereum.on("accountsChanged", refreshFactory);
    window.ethereum.on("chainChanged", refreshFactory);
  }

  setText("[data-factory-address-short]", shortAddress(FACTORY_ADDRESS));
  updateLogoFileName();
  updateSelection();
  refreshFactory();
  setInterval(refreshFactory, 30000);
}

wireFactoryPage();
