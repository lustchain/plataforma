import { ethers } from "https://esm.sh/ethers@6.16.0";


const LUST_CHAIN_ID_HEX = "0x1b0b";
const LUST_CHAIN_CONFIG = {
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

async function ensureLustChain() {
  if (!window.ethereum) {
    throw new Error("MetaMask not found.");
  }

  const currentChainId = await window.ethereum.request({ method: "eth_chainId" });

  if (String(currentChainId).toLowerCase() === LUST_CHAIN_ID_HEX) {
    return;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: LUST_CHAIN_ID_HEX }]
    });
  } catch (switchError) {
    // 4902 = chain not added in wallet
    if (switchError && switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [LUST_CHAIN_CONFIG]
      });
    } else {
      throw switchError;
    }
  }
}

function getPublicLustProvider() {
  return new ethers.JsonRpcProvider("https://rpc.lustchain.org", {
    chainId: 6923,
    name: "lust"
  });
}

async function readRegistryStatus() {
  if (!registryStatusEl || !ethers) return;

  try {
    // Public RPC read, so status works even before wallet connection.
    const provider = getPublicLustProvider();
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
    registryStatusEl.textContent = "Unable to read registry. Check LUST RPC or refresh.";
  }
}

async function joinWhitelistOnChain() {
  try {
    await ensureLustChain();

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
      setWhitelistStatus("Whitelist registry is not open yet. Owner must call setRegistrationOpen(true).");
      return;
    }

    if (alreadyRegistered) {
      setWhitelistStatus(`Wallet already registered: ${shortAddress(address)}.`);
      return;
    }

    setWhitelistStatus("Sending on-chain whitelist registration on LUST Chain...");
    const tx = await registry.register({ value: fee });
    setWhitelistStatus(`Registration sent: ${tx.hash}`);
    await tx.wait();
    setWhitelistStatus(`Registered successfully: ${shortAddress(address)}. This does not mint a Rabbit yet.`);
    await readRegistryStatus();
  } catch (error) {
    setWhitelistStatus(error?.shortMessage || error?.message || "On-chain registration failed. Check that MetaMask is on LUST Chain.");
  }
}

onchainRegisterBtn?.addEventListener("click", joinWhitelistOnChain);
readRegistryStatus();

if (window.ethereum) {
  window.ethereum.on?.("chainChanged", () => {
    readRegistryStatus();
  });
}

approveBtn?.addEventListener("click", approveLusdt);
mintBtn?.addEventListener("click", mintRabbit);
quantityEl?.addEventListener("change", refreshRabbitInfo);
document.querySelectorAll("input[name='rabbitMintMode']").forEach((el) => el.addEventListener("change", refreshRabbitInfo));
window.addEventListener("load", refreshRabbitInfo);
window.ethereum?.on?.("accountsChanged", refreshRabbitInfo);
window.ethereum?.on?.("chainChanged", () => setTimeout(refreshRabbitInfo, 500));
