import { ethers } from "https://esm.sh/ethers@6.16.0";

const CONFIG = window.LUST_PIONEER_CONFIG || {};
const CONTRACT_ADDRESS = CONFIG.contractAddress || "0xCb207489E4dbd6D4e3bf75CA947D0C43d621Fef1";
const RPC_URL = CONFIG.rpcUrl || "https://rpc.lustchain.org";
const CHAIN_ID = Number(CONFIG.chainId || 6923);
const CHAIN_ID_HEX = CONFIG.chainIdHex || "0x1b0b";
const MAX_SUPPLY = 10_000;
const ALL_REQUIREMENTS = Number(CONFIG.requirementsMask || 31);

const ABI = [
  "function mintStarted() view returns (bool)",
  "function mintClosed() view returns (bool)",
  "function mintOpen() view returns (bool)",
  "function claimsOpen() view returns (bool)",
  "function metadataFrozen() view returns (bool)",
  "function mintEndsAt() view returns (uint64)",
  "function totalMinted() view returns (uint256)",
  "function totalRewardAssigned() view returns (uint256)",
  "function totalRewardClaimed() view returns (uint256)",
  "function remainingRewardStock() view returns (uint256 noReward,uint256 fiveLST,uint256 tenLST,uint256 twentyLST,uint256 fiftyLST)",
  "function walletHasMinted(address) view returns (bool)",
  "function xAccountHashUsed(bytes32) view returns (bool)",
  "function rewardTierOf(uint256) view returns (uint8)",
  "function rewardOf(uint256) view returns (uint256)",
  "function rewardClaimed(uint256) view returns (bool)",
  "function ownerOf(uint256) view returns (address)",
  "function mintNonce(address) view returns (uint256)",
  "function mint(bytes32 xAccountHash,bytes32 proofHash,uint256 requirementsMask,uint256 deadline,bytes mintSignature) returns (uint256 tokenId,uint256 assignedReward)",
  "function claimReward(uint256 tokenId)",
  "event PioneerMinted(address indexed wallet,bytes32 indexed xAccountHash,uint256 indexed tokenId,uint8 tier,uint256 reward)",
  "event RewardClaimed(address indexed wallet,uint256 indexed tokenId,uint256 amount)"
];

const readProvider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID, { staticNetwork: true });
const readContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, readProvider);

const state = {
  wallet: "",
  contract: null,
  tokenId: 0,
  rewardWei: 0n,
  rewardTier: 0,
  rewardClaimed: false,
  claimsOpen: false,
  refreshTimer: null
};

function qs(selector) { return document.querySelector(selector); }
function qsa(selector) { return [...document.querySelectorAll(selector)]; }
function setText(selector, value) { qsa(selector).forEach((el) => { el.textContent = value; }); }

function updateDynamicStock(stock = {}) {
  // data-pioneer-stock marker: used to verify the live stock patch is published.
  const map = {
    noReward: stock.noReward ?? stock[0],
    fiveLST: stock.fiveLST ?? stock[1],
    tenLST: stock.tenLST ?? stock[2],
    twentyLST: stock.twentyLST ?? stock[3],
    fiftyLST: stock.fiftyLST ?? stock[4]
  };
  for (const [key, value] of Object.entries(map)) {
    if (value === undefined || value === null) continue;
    qsa(`[data-pioneer-stock="${key}"]`).forEach((el) => {
      el.textContent = formatCount(value);
    });
  }
}

function rewardWeiFromMetadataValue(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("50")) return ethers.parseEther("50");
  if (text.includes("20")) return ethers.parseEther("20");
  if (text.includes("10")) return ethers.parseEther("10");
  if (text.includes("5")) return ethers.parseEther("5");
  return 0n;
}

function metadataAttribute(json, traitType) {
  const item = (json?.attributes || []).find((a) => String(a.trait_type || "").toLowerCase() === traitType.toLowerCase());
  return item?.value || "";
}

async function fetchTokenMetadata(tokenId) {
  const base = CONFIG.metadataBaseUrl || "https://pioneer.lustchain.org/pioneer/metadata/";
  const response = await fetch(`${base}${Number(tokenId)}.json`, { cache: "no-store" });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.ok === false) throw new Error(json.message || `Metadata failed (HTTP ${response.status}).`);
  return json;
}
function shortAddress(value) { return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "Not connected"; }
function formatCount(value) { return new Intl.NumberFormat("en-US").format(Number(value || 0)); }
function formatTokenId(value) { return `#${String(Number(value)).padStart(5, "0")}`; }
function formatReward(value) {
  const amount = Number(ethers.formatEther(value || 0n));
  return amount > 0 ? `${amount.toLocaleString("en-US")} LST` : "No LST reward";
}
function setLog(message, tone = "") {
  const el = qs("[data-pioneer-log]");
  if (!el) return;
  el.textContent = message;
  el.dataset.tone = tone;
}
function setBusy(button, busy, busyText = "Working...") {
  if (!button) return;
  if (busy) {
    if (!button.dataset.originalText) button.dataset.originalText = button.textContent;
    button.textContent = busyText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    delete button.dataset.originalText;
    button.disabled = false;
  }
}
function normalizeChainId(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") return `0x${value.toString(16)}`;
  const raw = String(value).trim().toLowerCase();
  if (raw.startsWith("eip155:")) return `0x${Number(raw.split(":")[1]).toString(16)}`;
  if (raw.startsWith("0x")) return raw;
  return `0x${Number(raw).toString(16)}`;
}

function normalizeXHandle(input) {
  let value = String(input || "").trim();
  if (!value) return "";
  value = value.replace(/^@+/, "");
  try {
    if (/^https?:\/\//i.test(value)) {
      const url = new URL(value);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      if (!["x.com", "twitter.com", "mobile.twitter.com"].includes(host)) return "";
      value = url.pathname.split("/").filter(Boolean)[0] || "";
    }
  } catch (_) { return ""; }
  value = value.replace(/^@+/, "").trim().toLowerCase();
  return /^[a-z0-9_]{1,30}$/.test(value) ? value : "";
}

function normalizePostUrl(input) {
  try {
    const url = new URL(String(input || "").trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!["x.com", "twitter.com", "mobile.twitter.com"].includes(host)) return "";
    const parts = url.pathname.split("/").filter(Boolean);
    const statusIndex = parts.findIndex((part) => part.toLowerCase() === "status");
    if (statusIndex < 1 || !/^\d+$/.test(parts[statusIndex + 1] || "")) return "";
    return `https://x.com/${parts[0]}/status/${parts[statusIndex + 1]}`;
  } catch (_) { return ""; }
}

function handleFromPostUrl(urlValue) {
  try { return new URL(urlValue).pathname.split("/").filter(Boolean)[0]?.toLowerCase() || ""; }
  catch (_) { return ""; }
}

function requirementsMask() {
  return qsa("[data-pioneer-requirement]:checked").reduce((mask, el) => mask | Number(el.value || 0), 0);
}

function getAppKitAddress() {
  try { return window.lustAppKit?.getAddress?.() || ""; }
  catch (_) { return ""; }
}

async function getEip1193Provider() {
  try {
    const walletProvider = window.lustAppKit?.getWalletProvider?.();
    if (walletProvider) return walletProvider;
  } catch (_) {}
  if (window.ethereum) return window.ethereum;
  throw new Error("No compatible wallet provider found. Connect MetaMask or another EVM wallet.");
}

async function getBrowserSigner() {
  const eip1193 = await getEip1193Provider();
  const browserProvider = new ethers.BrowserProvider(eip1193);
  const network = await browserProvider.getNetwork();
  if (Number(network.chainId) !== CHAIN_ID) {
    try {
      await eip1193.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_ID_HEX }] });
    } catch (switchError) {
      if (switchError?.code === 4902) {
        await eip1193.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: CHAIN_ID_HEX,
            chainName: "LUST Chain",
            nativeCurrency: { name: "LST", symbol: "LST", decimals: 18 },
            rpcUrls: [RPC_URL],
            blockExplorerUrls: [CONFIG.explorerUrl || "https://explorer.lustchain.org"]
          }]
        });
      } else {
        throw switchError;
      }
    }
  }
  const refreshed = new ethers.BrowserProvider(eip1193);
  const signer = await refreshed.getSigner();
  return { signer, provider: refreshed, address: await signer.getAddress() };
}

function configureShortcuts() {
  const profile = qs("[data-pioneer-x-profile]");
  const campaign = qs("[data-pioneer-campaign-post]");
  const presale = qs("[data-pioneer-presale]");
  if (profile && CONFIG.officialXProfileUrl) { profile.href = CONFIG.officialXProfileUrl; profile.hidden = false; }
  if (campaign && CONFIG.officialCampaignPostUrl) { campaign.href = CONFIG.officialCampaignPostUrl; campaign.hidden = false; }
  if (presale) presale.href = CONFIG.presaleUrl || "./presale.html";
}

function cardImageForReward(rewardWei) {
  const amount = Number(ethers.formatEther(rewardWei || 0n));
  if (amount === 5) return "./assets/pioneer/5lst.png";
  if (amount === 10) return "./assets/pioneer/10lst.png";
  if (amount === 20) return "./assets/pioneer/20lst.png";
  if (amount === 50) return "./assets/pioneer/50lst.png";
  return "./assets/pioneer/nolst.png";
}

function renderedCardHtml(tokenId, rewardWei) {
  const rewarded = BigInt(rewardWei || 0n) > 0n;
  return `<div class="pioneer-rendered-card">
    <img src="${cardImageForReward(rewardWei)}" alt="LUST Pioneer ${formatReward(rewardWei)} card">
    <span class="pioneer-card-number ${rewarded ? "reward" : ""}">${formatTokenId(tokenId)}</span>
  </div>`;
}

function renderToken(tokenId, rewardWei, claimed, claimsOpen, ownerMatches = true) {
  state.tokenId = Number(tokenId || 0);
  state.rewardWei = BigInt(rewardWei || 0n);
  state.rewardClaimed = Boolean(claimed);
  state.claimsOpen = Boolean(claimsOpen);

  const card = qs("[data-pioneer-user-card]");
  if (card) card.innerHTML = renderedCardHtml(state.tokenId, state.rewardWei);
  setText("[data-pioneer-token-id]", formatTokenId(state.tokenId));
  setText("[data-pioneer-reward]", formatReward(state.rewardWei));

  let claimStatus = "No reward";
  if (state.rewardWei > 0n) {
    if (state.rewardClaimed) claimStatus = "Claimed";
    else if (!state.claimsOpen) claimStatus = "Locked until liquidity launch";
    else if (!ownerMatches) claimStatus = "Connected wallet is not the owner";
    else claimStatus = "Ready to claim";
  }
  setText("[data-pioneer-claim-status]", claimStatus);

  const claimButton = qs("[data-pioneer-claim]");
  if (claimButton) {
    claimButton.disabled = !(state.rewardWei > 0n && state.claimsOpen && !state.rewardClaimed && ownerMatches);
    claimButton.textContent = state.rewardWei > 0n ? `Claim ${formatReward(state.rewardWei)}` : "No reward to claim";
  }
  const input = qs("[data-pioneer-token-input]");
  if (input) input.value = String(state.tokenId);
}

function showReveal(tokenId, rewardWei) {
  const modal = qs("[data-pioneer-reveal]");
  const card = qs("[data-pioneer-reveal-card]");
  if (!modal || !card) return;
  card.innerHTML = renderedCardHtml(tokenId, rewardWei);
  const rewarded = BigInt(rewardWei || 0n) > 0n;
  setText("[data-pioneer-reveal-result]", rewarded ? `Congratulations — ${formatReward(rewardWei)} reward` : "Official Pioneer NFT — no LST reward");
  setText("[data-pioneer-reveal-copy]", rewarded
    ? "Your reward is recorded on-chain and remains locked until the official liquidity launch."
    : "Your numbered NFT is part of the official 10,000-card Pioneer collection.");
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeReveal() {
  const modal = qs("[data-pioneer-reveal]");
  if (modal) modal.hidden = true;
  document.body.style.overflow = "";
}

async function refreshWalletState() {
  const appKitAddress = getAppKitAddress();
  let injectedAddress = "";
  try {
    const provider = await getEip1193Provider();
    const accounts = await provider.request?.({ method: "eth_accounts" });
    injectedAddress = accounts?.[0] || "";
  } catch (_) {}
  state.wallet = ethers.isAddress(appKitAddress) ? appKitAddress : (ethers.isAddress(injectedAddress) ? injectedAddress : "");
  setText("[data-pioneer-wallet]", shortAddress(state.wallet));
  return state.wallet;
}

async function fetchBackendStatus() {
  if (!CONFIG.statusEndpoint) throw new Error("Status endpoint is not configured.");
  const response = await fetch(CONFIG.statusEndpoint, { cache: "no-store" });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.ok) throw new Error(json.message || `Status failed (HTTP ${response.status}).`);
  return json;
}

async function findMintedTokenForWallet(address) {
  if (!ethers.isAddress(address)) return 0;
  try {
    const topic = readContract.interface.getEvent('PioneerMinted').topicHash;
    const walletTopic = ethers.zeroPadValue(address, 32);
    const logs = await readProvider.getLogs({
      address: CONTRACT_ADDRESS,
      topics: [topic, walletTopic],
      fromBlock: Number(CONFIG.deploymentBlock || 0),
      toBlock: 'latest'
    });
    const last = logs[logs.length - 1];
    if (!last) return 0;
    const parsed = readContract.interface.parseLog(last);
    return Number(parsed?.args?.tokenId || 0);
  } catch (error) {
    console.warn('Could not auto-discover Pioneer token by wallet', error);
    return 0;
  }
}

async function safeWalletHasMinted(address) {
  try { return await readContract.walletHasMinted(address); }
  catch (_) { return false; }
}

async function refreshContractState({ quiet = false } = {}) {
  try {
    let mintStarted, mintClosed, mintOpen, claimsOpen, metadataFrozen, totalMinted, totalAssigned, totalClaimed, stock;

    try {
      const status = await fetchBackendStatus();
      mintStarted = Boolean(status.mintStarted);
      mintClosed = Boolean(status.mintClosed);
      mintOpen = Boolean(status.mintOpen);
      claimsOpen = Boolean(status.claimsOpen);
      metadataFrozen = Boolean(status.metadataFrozen);
      totalMinted = BigInt(status.totalMinted || 0);
      totalAssigned = BigInt(status.totalRewardAssigned || 0);
      totalClaimed = BigInt(status.totalRewardClaimed || 0);
      stock = status.stock || {};
    } catch (backendError) {
      const onchain = await Promise.all([
        readContract.mintStarted(), readContract.mintClosed(), readContract.mintOpen(), readContract.claimsOpen(),
        readContract.metadataFrozen(), readContract.totalMinted(), readContract.totalRewardAssigned(), readContract.totalRewardClaimed(),
        readContract.remainingRewardStock()
      ]);
      [mintStarted, mintClosed, mintOpen, claimsOpen, metadataFrozen, totalMinted, totalAssigned, totalClaimed, stock] = onchain;
    }

    const minted = Number(totalMinted);
    const remaining = MAX_SUPPLY - minted;
    setText("[data-pioneer-total-minted]", formatCount(minted));
    setText("[data-pioneer-remaining]", formatCount(remaining));
    const progress = qs("[data-pioneer-progress-bar]");
    if (progress) progress.style.width = `${Math.min(100, (minted / MAX_SUPPLY) * 100)}%`;

    updateDynamicStock(stock);

    const pill = qs("[data-pioneer-live-pill]");
    if (pill) {
      if (mintOpen) { pill.textContent = "Mint open"; pill.dataset.tone = "ok"; }
      else if (!metadataFrozen) { pill.textContent = "Preparing metadata"; pill.dataset.tone = "warn"; }
      else if (!mintStarted) { pill.textContent = "Campaign not started"; pill.dataset.tone = "warn"; }
      else if (mintClosed || remaining === 0) { pill.textContent = "Mint closed"; pill.dataset.tone = "warn"; }
      else { pill.textContent = "Mint unavailable"; pill.dataset.tone = "warn"; }
    }

    state.claimsOpen = Boolean(claimsOpen);
    state.contract = { mintStarted, mintClosed, mintOpen, metadataFrozen, minted, remaining, totalAssigned, totalClaimed, stock };

    const mintButton = qs("[data-pioneer-mint]");
    if (mintButton) mintButton.disabled = !mintOpen;

    await refreshWalletState();
    if (state.wallet) {
      const alreadyMinted = await safeWalletHasMinted(state.wallet);
      if (alreadyMinted && !state.tokenId) {
        const storageKey = `lustPioneerToken:${state.wallet.toLowerCase()}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          await loadToken(Number(stored), { quiet: true });
        } else {
          const discoveredTokenId = await findMintedTokenForWallet(state.wallet);
          if (discoveredTokenId > 0) {
            localStorage.setItem(storageKey, String(discoveredTokenId));
            await loadToken(discoveredTokenId, { quiet: true });
          }
        }
      }
      if (mintButton) mintButton.disabled = !mintOpen || alreadyMinted;
      if (alreadyMinted) {
        setLog(state.tokenId
          ? `This wallet already minted ${formatTokenId(state.tokenId)}. Use this page as the official Pioneer viewer.`
          : "This wallet has already minted one Pioneer NFT. Use the token ID box to load it on this page.", "ok");
      } else if (!quiet && mintOpen) {
        setLog("Mint is open. Complete the X fields and all five confirmations.", "ok");
      }
    } else if (!quiet) {
      setLog(mintOpen ? "Mint is open. Connect your wallet and complete all requirements." : "Connect your wallet and complete all requirements.");
    }
  } catch (error) {
    console.error(error);
    const pill = qs("[data-pioneer-live-pill]");
    if (pill) { pill.textContent = "Status unavailable"; pill.dataset.tone = "warn"; }
    if (!quiet) setLog(error?.shortMessage || error?.message || "Could not read the NFT contract status.", "warn");
  }
}

async function requestAuthorization(payload) {
  const endpoint = CONFIG.authorizeEndpoint;
  if (!endpoint) throw new Error("Mint authorization endpoint is not configured.");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.ok) throw new Error(json.message || json.error || `Authorization failed (HTTP ${response.status}).`);
  return json;
}

async function mintPioneer() {
  const button = qs("[data-pioneer-mint]");
  try {
    setBusy(button, true, "Preparing mint...");
    const { signer, address } = await getBrowserSigner();
    state.wallet = address;
    setText("[data-pioneer-wallet]", shortAddress(address));

    const contractState = state.contract || {};
    if (!contractState.mintOpen) {
      await refreshContractState({ quiet: true });
      if (!state.contract?.mintOpen) throw new Error("The Pioneer mint is not open yet.");
    }
    if (await safeWalletHasMinted(address)) throw new Error("This wallet has already minted one Pioneer NFT.");

    const handle = normalizeXHandle(qs("[data-pioneer-x-handle]")?.value);
    const postUrl = normalizePostUrl(qs("[data-pioneer-post-url]")?.value);
    const mask = requirementsMask();
    if (!handle) throw new Error("Enter a valid X username or profile URL.");
    if (!postUrl) throw new Error("Enter a valid public X post URL.");
    if (handleFromPostUrl(postUrl) !== handle) throw new Error("The promotion post must belong to the same X account entered above.");
    if ((mask & ALL_REQUIREMENTS) !== ALL_REQUIREMENTS) throw new Error("Confirm all five campaign requirements before minting.");

    const issuedAt = Math.floor(Date.now() / 1000);
    const requestNonce = ethers.hexlify(ethers.randomBytes(16));
    const message = [
      "LUST Pioneer Rewards mint request",
      `Wallet: ${address.toLowerCase()}`,
      `X account: @${handle}`,
      `Promotion post: ${postUrl}`,
      `Requirements mask: ${mask}`,
      `Rules: ${CONFIG.rulesVersion || "lust-pioneer-v1"}`,
      `Issued at: ${issuedAt}`,
      `Request nonce: ${requestNonce}`
    ].join("\n");

    setLog("Sign the free verification message. This does not spend LST.");
    const walletSignature = await signer.signMessage(message);

    setLog("Checking participation and preparing the on-chain mint authorization...");
    const authorization = await requestAuthorization({
      wallet: address,
      xHandle: handle,
      postUrl,
      requirementsMask: mask,
      rulesVersion: CONFIG.rulesVersion,
      issuedAt,
      requestNonce,
      message,
      walletSignature
    });

    const writeContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    setLog("Authorization ready. Confirm the NFT mint transaction in your wallet.");
    setBusy(button, true, "Waiting for wallet...");
    const tx = await writeContract.mint(
      authorization.xAccountHash,
      authorization.proofHash,
      BigInt(authorization.requirementsMask),
      BigInt(authorization.deadline),
      authorization.mintSignature
    );

    setLog(`Mint sent: ${tx.hash}. Waiting for confirmation...`);
    setBusy(button, true, "Minting NFT...");
    const receipt = await tx.wait();
    let minted = null;
    for (const log of receipt.logs || []) {
      try {
        const parsed = writeContract.interface.parseLog(log);
        if (parsed?.name === "PioneerMinted") {
          minted = { tokenId: Number(parsed.args.tokenId), reward: BigInt(parsed.args.reward), tier: Number(parsed.args.tier) };
          break;
        }
      } catch (_) {}
    }
    if (!minted) throw new Error("Mint confirmed, but the result event could not be decoded. Refresh the page and load your token ID.");

    localStorage.setItem(`lustPioneerToken:${address.toLowerCase()}`, String(minted.tokenId));
    renderToken(minted.tokenId, minted.reward, false, state.claimsOpen, true);
    showReveal(minted.tokenId, minted.reward);
    setLog(`NFT ${formatTokenId(minted.tokenId)} minted successfully. Result: ${formatReward(minted.reward)}.`, "ok");
    await refreshContractState({ quiet: true });
  } catch (error) {
    console.error(error);
    setLog(error?.shortMessage || error?.reason || error?.message || "Mint failed or was rejected.", "error");
  } finally {
    setBusy(button, false);
    if (state.contract && !state.contract.mintOpen) button.disabled = true;
  }
}

async function loadToken(tokenIdValue, { quiet = false } = {}) {
  const tokenId = Number(tokenIdValue || qs("[data-pioneer-token-input]")?.value || 0);
  if (!Number.isInteger(tokenId) || tokenId < 1 || tokenId > MAX_SUPPLY) {
    if (!quiet) setLog("Enter a valid token ID from 1 to 10000.", "warn");
    return;
  }
  try {
    const [owner, reward, tier, claimed, claimsOpen] = await Promise.all([
      readContract.ownerOf(tokenId), readContract.rewardOf(tokenId), readContract.rewardTierOf(tokenId),
      readContract.rewardClaimed(tokenId), readContract.claimsOpen()
    ]);
    await refreshWalletState();
    const ownerMatches = state.wallet && owner.toLowerCase() === state.wallet.toLowerCase();
    state.rewardTier = Number(tier);
    renderToken(tokenId, reward, claimed, claimsOpen, ownerMatches);
    if (!quiet) setLog(ownerMatches ? `Loaded your NFT ${formatTokenId(tokenId)}.` : `Loaded ${formatTokenId(tokenId)}. Connect its owner wallet to claim.`, ownerMatches ? "ok" : "warn");
  } catch (error) {
    console.warn("RPC token load failed, trying backend metadata:", error);
    try {
      const json = await fetchTokenMetadata(tokenId);
      const rewardValue = metadataAttribute(json, "Reward");
      const claimStatus = metadataAttribute(json, "Claim Status");
      const owner = metadataAttribute(json, "Owner");
      const reward = rewardWeiFromMetadataValue(rewardValue);
      const claimed = String(claimStatus).toLowerCase().includes("claimed");
      await refreshWalletState();
      const ownerMatches = state.wallet && ethers.isAddress(owner) && owner.toLowerCase() === state.wallet.toLowerCase();
      renderToken(tokenId, reward, claimed, state.claimsOpen, ownerMatches);
      if (!quiet) setLog(ownerMatches ? `Loaded your NFT ${formatTokenId(tokenId)} on the official Pioneer viewer.` : `Loaded ${formatTokenId(tokenId)} from metadata.`, ownerMatches ? "ok" : "warn");
    } catch (metadataError) {
      console.error(metadataError);
      if (!quiet) setLog(metadataError?.shortMessage || metadataError?.message || error?.shortMessage || error?.message || "NFT not found.", "warn");
    }
  }
}

async function claimReward() {
  const button = qs("[data-pioneer-claim]");
  try {
    if (!state.tokenId) throw new Error("Load your NFT first.");
    setBusy(button, true, "Preparing claim...");
    const { signer, address } = await getBrowserSigner();
    const owner = await readContract.ownerOf(state.tokenId);
    if (owner.toLowerCase() !== address.toLowerCase()) throw new Error("The connected wallet is not the owner of this NFT.");
    const writeContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    setLog(`Confirm the ${formatReward(state.rewardWei)} reward claim in your wallet.`);
    const tx = await writeContract.claimReward(state.tokenId);
    setBusy(button, true, "Claiming reward...");
    setLog(`Claim sent: ${tx.hash}. Waiting for confirmation...`);
    await tx.wait();
    await loadToken(state.tokenId, { quiet: true });
    setLog(`${formatReward(state.rewardWei)} claimed successfully.`, "ok");
  } catch (error) {
    console.error(error);
    setLog(error?.shortMessage || error?.reason || error?.message || "Reward claim failed or was rejected.", "error");
  } finally {
    setBusy(button, false);
    if (!(state.rewardWei > 0n && state.claimsOpen && !state.rewardClaimed)) button.disabled = true;
  }
}

function bindEvents() {
  qs("[data-pioneer-mint]")?.addEventListener("click", mintPioneer);
  qs("[data-pioneer-refresh]")?.addEventListener("click", () => refreshContractState());
  qs("[data-pioneer-load-token]")?.addEventListener("click", () => loadToken());
  qs("[data-pioneer-claim]")?.addEventListener("click", claimReward);
  qs("[data-pioneer-token-input]")?.addEventListener("keydown", (event) => { if (event.key === "Enter") loadToken(); });
  qsa("[data-pioneer-close-reveal]").forEach((el) => el.addEventListener("click", closeReveal));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeReveal(); });
  window.ethereum?.on?.("accountsChanged", () => { state.tokenId = 0; refreshContractState(); });
  window.ethereum?.on?.("chainChanged", () => refreshContractState());
}

configureShortcuts();
bindEvents();
refreshContractState();
state.refreshTimer = window.setInterval(() => refreshContractState({ quiet: true }), 20_000);
