import { ethers } from "https://esm.sh/ethers@6.16.0";

const LUST_CHAIN_ID_HEX = "0x1b0b";
const LUST_RPC_URL = "https://rpc.lustchain.org";
const LUSDT_ADDRESS = "0x1E8636066d7e86De0A8Bd6Acb1e54BE129aC19AE";
const RABBIT_CONTRACT_ADDRESS = "0x81b9a5bB109919CFF3eE4C92B2372ABCd73614e6";
const RABBIT_REGISTRY_ADDRESS = "0xA16DE59e5F13edf51464EdF807d0B23175cecfA6";



const LUSDT_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const RABBIT_ABI = [
  "function whitelistMint(uint256 quantity)",
  "function publicMint(uint256 quantity)",
  "function totalMinted() view returns (uint256)",
  "function saleMinted() view returns (uint256)",
  "function reservedMinted() view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function SALE_SUPPLY() view returns (uint256)",
  "function RESERVED_SUPPLY() view returns (uint256)",
  "function whitelistPrice() view returns (uint256)",
  "function publicPrice() view returns (uint256)",
  "function whitelistSaleOpen() view returns (bool)",
  "function publicSaleOpen() view returns (bool)",
  "function revealed() view returns (bool)",
  "function whitelist(address account) view returns (bool)"
];

const statusEl = document.querySelector("[data-rabbit-status]");
const supplyEl = document.querySelector("[data-rabbit-supply]");
const walletEl = document.querySelector("[data-rabbit-wallet]");
const contractEl = document.querySelector("[data-rabbit-contract]");
const quantityEl = document.querySelector("#rabbitQuantity");
const approveBtn = document.querySelector("[data-rabbit-approve]");
const mintBtn = document.querySelector("[data-rabbit-mint]");

let cachedMintState = {
  whitelistSaleOpen: false,
  publicSaleOpen: false,
  isWhitelisted: false,
  connected: false
};

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function shortAddress(address) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected";
}

function getMode() {
  return document.querySelector("input[name='rabbitMintMode']:checked")?.value || "public";
}

function getQuantity() {
  const value = Number(quantityEl?.value || 1);
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.min(Math.floor(value), 5);
}

function requireContractAddress() {
  if (!ethers.isAddress(RABBIT_CONTRACT_ADDRESS)) {
    throw new Error("Rabbit contract address is missing in nfts-rabbit.js.");
  }
  return RABBIT_CONTRACT_ADDRESS;
}

function readProvider() {
  return new ethers.JsonRpcProvider(LUST_RPC_URL);
}

async function getConnectedWalletAddress() {
  if (!window.ethereum) return "";
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  return accounts?.[0] || "";
}

async function ensureLustChain() {
  if (!window.ethereum) throw new Error("Wallet not found. Install MetaMask or use a Web3 wallet.");

  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  if (String(chainId).toLowerCase() === LUST_CHAIN_ID_HEX) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: LUST_CHAIN_ID_HEX }]
    });
  } catch (switchError) {
    if (switchError?.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: LUST_CHAIN_ID_HEX,
          chainName: "LUST Chain",
          nativeCurrency: { name: "LST", symbol: "LST", decimals: 18 },
          rpcUrls: [LUST_RPC_URL],
          blockExplorerUrls: ["https://explorer.lustchain.org"]
        }]
      });
    } else {
      throw switchError;
    }
  }
}

async function getProviderAndSigner() {
  if (!window.ethereum) throw new Error("Wallet not found. Install MetaMask or use a Web3 wallet.");

  await window.ethereum.request({ method: "eth_requestAccounts" });
  await ensureLustChain();

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return { provider, signer, address: await signer.getAddress() };
}

async function priceFor(contract, mode, quantity) {
  const unit = mode === "whitelist" ? await contract.whitelistPrice() : await contract.publicPrice();
  return unit * BigInt(quantity);
}

function updateActionButtons() {
  const mode = getMode();
  const saleOpen = mode === "whitelist" ? cachedMintState.whitelistSaleOpen : cachedMintState.publicSaleOpen;
  const whitelistBlocked = mode === "whitelist" && cachedMintState.connected && !cachedMintState.isWhitelisted;
  const canUse = saleOpen && !whitelistBlocked;

  if (approveBtn) approveBtn.disabled = !canUse;
  if (mintBtn) mintBtn.disabled = !canUse;
}

async function refreshRabbitInfo() {
  const contractAddress = requireContractAddress();

  if (contractEl) contractEl.textContent = contractAddress;

  try {
    const provider = readProvider();
    const contract = new ethers.Contract(contractAddress, RABBIT_ABI, provider);

    const [minted, max, saleMinted, saleMax, reservedMinted, reserveMax, wlOpen, pubOpen, revealed] = await Promise.all([
      contract.totalMinted(),
      contract.MAX_SUPPLY(),
      contract.saleMinted(),
      contract.SALE_SUPPLY(),
      contract.reservedMinted(),
      contract.RESERVED_SUPPLY(),
      contract.whitelistSaleOpen(),
      contract.publicSaleOpen(),
      contract.revealed()
    ]);

    const connectedAddress = await getConnectedWalletAddress();
    let isWhitelisted = false;
    if (connectedAddress) {
      isWhitelisted = await contract.whitelist(connectedAddress);
    }

    cachedMintState = {
      whitelistSaleOpen: wlOpen,
      publicSaleOpen: pubOpen,
      isWhitelisted,
      connected: Boolean(connectedAddress)
    };

    if (walletEl) walletEl.textContent = shortAddress(connectedAddress);
    if (supplyEl) supplyEl.textContent = `${minted.toString()} / ${max.toString()} · Sale ${saleMinted.toString()} / ${saleMax.toString()} · Reserve ${reservedMinted.toString()} / ${reserveMax.toString()}`;

    updateActionButtons();

    const mode = getMode();
    if (!wlOpen && !pubOpen) {
      setStatus(`Contract connected. Mint is still closed. Reveal: ${revealed ? "yes" : "no"}. Open whitelist or public sale only after final tests.`);
    } else if (mode === "whitelist") {
      setStatus(`Whitelist sale: ${wlOpen ? "open" : "closed"}. Wallet: ${connectedAddress ? shortAddress(connectedAddress) : "not connected"}. Whitelisted: ${isWhitelisted ? "yes" : "no"}.`);
    } else {
      setStatus(`Public sale: ${pubOpen ? "open" : "closed"}. Wallet: ${connectedAddress ? shortAddress(connectedAddress) : "not connected"}.`);
    }
  } catch (error) {
    if (approveBtn) approveBtn.disabled = true;
    if (mintBtn) mintBtn.disabled = true;
    setStatus(error?.shortMessage || error?.message || "Could not refresh NFT info.");
  }
}

async function approveLusdt() {
  try {
    const contractAddress = requireContractAddress();
    setStatus("Preparing LUSDT approval...");

    const { signer } = await getProviderAndSigner();
    const rabbit = new ethers.Contract(contractAddress, RABBIT_ABI, signer);
    const lusdt = new ethers.Contract(LUSDT_ADDRESS, LUSDT_ABI, signer);
    const amount = await priceFor(rabbit, getMode(), getQuantity());

    const tx = await lusdt.approve(contractAddress, amount);
    setStatus(`Approval sent: ${tx.hash}`);
    await tx.wait();
    setStatus("LUSDT approved. Now you can mint.");
  } catch (error) {
    setStatus(error?.shortMessage || error?.message || "Approval failed.");
  }
}

async function mintRabbit() {
  try {
    const contractAddress = requireContractAddress();
    setStatus("Preparing mint...");

    const { signer } = await getProviderAndSigner();
    const rabbit = new ethers.Contract(contractAddress, RABBIT_ABI, signer);
    const quantity = getQuantity();
    const mode = getMode();

    const tx = mode === "whitelist" ? await rabbit.whitelistMint(quantity) : await rabbit.publicMint(quantity);
    setStatus(`Mint sent: ${tx.hash}`);
    await tx.wait();
    setStatus("Mint confirmed. Welcome to LUST Rabbit Club.");
    await refreshRabbitInfo();
  } catch (error) {
    setStatus(error?.shortMessage || error?.message || "Mint failed.");
  }
}





const RABBIT_REGISTRY_ABI = [
  "function register() external payable",
  "function registrationOpen() view returns (bool)",
  "function locked() view returns (bool)",
  "function registrationFee() view returns (uint256)",
  "function maxRegistrations() view returns (uint256)",
  "function registeredCount() view returns (uint256)",
  "function isRegistered(address wallet) view returns (bool)"
];

const registryStatusEl = document.querySelector("[data-registry-status]");
const onchainRegisterBtn = document.querySelector("[data-onchain-register]");

async function readRegistryStatus() {
  if (!registryStatusEl || !window.ethereum || !ethers) return;

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const registry = new ethers.Contract(RABBIT_REGISTRY_ADDRESS, RABBIT_REGISTRY_ABI, provider);

    const [open, locked, fee, count, max] = await Promise.all([
      registry.registrationOpen(),
      registry.locked(),
      registry.registrationFee(),
      registry.registeredCount(),
      registry.maxRegistrations()
    ]);

    const feeText = fee === 0n ? "free" : `${ethers.formatEther(fee)} LST`;
    registryStatusEl.textContent = locked
      ? `Closed · ${count.toString()} / ${max.toString()} registered`
      : `${open ? "Open" : "Closed"} · ${count.toString()} / ${max.toString()} registered · ${feeText}`;
  } catch (error) {
    registryStatusEl.textContent = "Unable to read registry";
  }
}

async function joinWhitelistOnChain() {
  try {
    const { signer, address } = await getProviderAndSigner();
    const registry = new ethers.Contract(RABBIT_REGISTRY_ADDRESS, RABBIT_REGISTRY_ABI, signer);

    const [open, locked, fee, alreadyRegistered] = await Promise.all([
      registry.registrationOpen(),
      registry.locked(),
      registry.registrationFee(),
      registry.isRegistered(address)
    ]);

    if (locked) {
      setWhitelistStatus("Whitelist registry is locked.");
      return;
    }

    if (!open) {
      setWhitelistStatus("Whitelist registry is not open yet.");
      return;
    }

    if (alreadyRegistered) {
      setWhitelistStatus(`Wallet already registered: ${shortAddress(address)}.`);
      return;
    }

    setWhitelistStatus("Sending on-chain whitelist registration...");
    const tx = await registry.register({ value: fee });
    setWhitelistStatus(`Registration sent: ${tx.hash}`);
    await tx.wait();
    setWhitelistStatus(`Registered successfully: ${shortAddress(address)}. This does not mint a Rabbit yet.`);
    await readRegistryStatus();
  } catch (error) {
    setWhitelistStatus(error?.shortMessage || error?.message || "On-chain registration failed.");
  }
}

onchainRegisterBtn?.addEventListener("click", joinWhitelistOnChain);
readRegistryStatus();

approveBtn?.addEventListener("click", approveLusdt);
mintBtn?.addEventListener("click", mintRabbit);
quantityEl?.addEventListener("change", refreshRabbitInfo);
document.querySelectorAll("input[name='rabbitMintMode']").forEach((el) => el.addEventListener("change", refreshRabbitInfo));
window.addEventListener("load", refreshRabbitInfo);
window.ethereum?.on?.("accountsChanged", refreshRabbitInfo);
window.ethereum?.on?.("chainChanged", () => setTimeout(refreshRabbitInfo, 500));
