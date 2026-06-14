import { ethers } from "https://esm.sh/ethers@6.16.0";

const LUST_CHAIN_ID_HEX = "0x1b0b";
const LUSDT_ADDRESS = "0x1E8636066d7e86De0A8Bd6Acb1e54BE129aC19AE";

// After deploying LUSTRabbitClub.sol, paste the contract address here.
// Example: const RABBIT_CONTRACT_ADDRESS = "0x1234...";
const RABBIT_CONTRACT_ADDRESS = "";

const LUSDT_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const RABBIT_ABI = [
  "function whitelistMint(uint256 quantity)",
  "function publicMint(uint256 quantity)",
  "function totalMinted() view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function whitelistPrice() view returns (uint256)",
  "function publicPrice() view returns (uint256)",
  "function whitelistSaleOpen() view returns (bool)",
  "function publicSaleOpen() view returns (bool)",
  "function whitelist(address account) view returns (bool)"
];

const statusEl = document.querySelector("[data-rabbit-status]");
const supplyEl = document.querySelector("[data-rabbit-supply]");
const walletEl = document.querySelector("[data-rabbit-wallet]");
const contractEl = document.querySelector("[data-rabbit-contract]");
const quantityEl = document.querySelector("#rabbitQuantity");
const approveBtn = document.querySelector("[data-rabbit-approve]");
const mintBtn = document.querySelector("[data-rabbit-mint]");

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
  return Math.floor(value);
}

async function getProviderAndSigner() {
  if (!window.ethereum) throw new Error("Wallet not found. Install MetaMask or use a Web3 wallet.");

  await window.ethereum.request({ method: "eth_requestAccounts" });

  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  if (String(chainId).toLowerCase() !== LUST_CHAIN_ID_HEX) {
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: LUST_CHAIN_ID_HEX }] });
    } catch (switchError) {
      if (switchError?.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: LUST_CHAIN_ID_HEX,
            chainName: "LUST Chain",
            nativeCurrency: { name: "LST", symbol: "LST", decimals: 18 },
            rpcUrls: ["https://rpc.lustchain.org"],
            blockExplorerUrls: ["https://explorer.lustchain.org"]
          }]
        });
      } else {
        throw switchError;
      }
    }
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return { provider, signer, address: await signer.getAddress() };
}

function requireContractAddress() {
  if (!ethers.isAddress(RABBIT_CONTRACT_ADDRESS)) {
    throw new Error("Contract not deployed yet. Deploy LUSTRabbitClub.sol, then paste the address inside nfts-rabbit.js.");
  }
  return RABBIT_CONTRACT_ADDRESS;
}

async function priceFor(contract, mode, quantity) {
  const unit = mode === "whitelist" ? await contract.whitelistPrice() : await contract.publicPrice();
  return unit * BigInt(quantity);
}

async function refreshRabbitInfo() {
  if (contractEl) {
    contractEl.textContent = ethers.isAddress(RABBIT_CONTRACT_ADDRESS) ? RABBIT_CONTRACT_ADDRESS : "Pending deploy";
  }

  if (!ethers.isAddress(RABBIT_CONTRACT_ADDRESS)) {
    if (approveBtn) approveBtn.disabled = true;
    if (mintBtn) mintBtn.disabled = true;
    if (supplyEl) supplyEl.textContent = "0 / 10,000";
    setStatus("Pre-launch ready. The teaser image and hidden metadata are live in the site files. Deploy the contract, paste the address in nfts-rabbit.js, then open whitelist or public sale.");
    return;
  }

  try {
    const { signer, address } = await getProviderAndSigner();
    const contract = new ethers.Contract(RABBIT_CONTRACT_ADDRESS, RABBIT_ABI, signer);
    const minted = await contract.totalMinted();
    const max = await contract.MAX_SUPPLY();
    const wlOpen = await contract.whitelistSaleOpen();
    const publicOpen = await contract.publicSaleOpen();
    const isWhitelisted = await contract.whitelist(address);

    if (walletEl) walletEl.textContent = shortAddress(address);
    if (supplyEl) supplyEl.textContent = `${minted.toString()} / ${max.toString()}`;
    if (approveBtn) approveBtn.disabled = false;
    if (mintBtn) mintBtn.disabled = false;

    setStatus(`Connected. Whitelist sale: ${wlOpen ? "open" : "closed"}. Public sale: ${publicOpen ? "open" : "closed"}. Your whitelist: ${isWhitelisted ? "yes" : "no"}.`);
  } catch (error) {
    setStatus(error?.message || "Could not refresh NFT info.");
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

approveBtn?.addEventListener("click", approveLusdt);
mintBtn?.addEventListener("click", mintRabbit);
window.addEventListener("load", refreshRabbitInfo);
window.ethereum?.on?.("accountsChanged", refreshRabbitInfo);
window.ethereum?.on?.("chainChanged", () => setTimeout(refreshRabbitInfo, 500));
