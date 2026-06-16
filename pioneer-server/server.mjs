import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  Contract,
  JsonRpcProvider,
  Wallet,
  getAddress,
  isAddress,
  verifyMessage,
  keccak256,
  toUtf8Bytes,
  formatEther
} from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8097);
const RPC_URL = process.env.RPC_URL || "https://rpc.lustchain.org";
const CHAIN_ID = Number(process.env.CHAIN_ID || 6923);
const CONTRACT_ADDRESS = getAddress(process.env.CONTRACT_ADDRESS || "0xCb207489E4dbd6D4e3bf75CA947D0C43d621Fef1");
const PRIVATE_KEY = String(process.env.MINT_AUTHORIZER_PRIVATE_KEY || "").trim();
const PUBLIC_BASE_URL = String(process.env.PUBLIC_BASE_URL || "https://downloads.lustchain.org").replace(/\/$/, "");
const PLATFORM_ORIGIN = String(process.env.PLATFORM_ORIGIN || "https://platform.lustchain.org").replace(/\/$/, "");
const RULES_VERSION = String(process.env.RULES_VERSION || "lust-pioneer-v1-20260616");
const AUTHORIZATION_TTL_SECONDS = Math.max(120, Number(process.env.AUTHORIZATION_TTL_SECONDS || 900));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const CACHE_DIR = process.env.CACHE_DIR || path.join(__dirname, "cache");
const ASSETS_DIR = process.env.ASSETS_DIR || path.join(__dirname, "assets");
const ALL_REQUIREMENTS = 31;
const MAX_SUPPLY = 10_000;

if (!PRIVATE_KEY || !/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) {
  console.error("FATAL: MINT_AUTHORIZER_PRIVATE_KEY is missing or invalid.");
  process.exit(1);
}

await fs.mkdir(DATA_DIR, { recursive: true });
await fs.mkdir(CACHE_DIR, { recursive: true });

const provider = new JsonRpcProvider(RPC_URL, CHAIN_ID, { staticNetwork: true });
const authorizer = new Wallet(PRIVATE_KEY, provider);

const ABI = [
  "function mintAuthorizer() view returns (address)",
  "function mintOpen() view returns (bool)",
  "function mintStarted() view returns (bool)",
  "function mintClosed() view returns (bool)",
  "function claimsOpen() view returns (bool)",
  "function totalMinted() view returns (uint256)",
  "function totalRewardAssigned() view returns (uint256)",
  "function totalRewardClaimed() view returns (uint256)",
  "function remainingRewardStock() view returns (uint256 noReward,uint256 fiveLST,uint256 tenLST,uint256 twentyLST,uint256 fiftyLST)",
  "function walletHasMinted(address) view returns (bool)",
  "function xAccountHashUsed(bytes32) view returns (bool)",
  "function proofHashUsed(bytes32) view returns (bool)",
  "function mintNonce(address) view returns (uint256)",
  "function ownerOf(uint256) view returns (address)",
  "function rewardOf(uint256) view returns (uint256)",
  "function rewardTierOf(uint256) view returns (uint8)",
  "function rewardClaimed(uint256) view returns (bool)"
];
const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);

const EIP712_DOMAIN = {
  name: "LUST Pioneer Rewards",
  version: "1",
  chainId: CHAIN_ID,
  verifyingContract: CONTRACT_ADDRESS
};
const EIP712_TYPES = {
  MintPermit: [
    { name: "wallet", type: "address" },
    { name: "xAccountHash", type: "bytes32" },
    { name: "proofHash", type: "bytes32" },
    { name: "requirementsMask", type: "uint256" },
    { name: "deadline", type: "uint256" },
    { name: "nonce", type: "uint256" }
  ]
};

function normalizeHandle(input) {
  let value = String(input || "").trim().replace(/^@+/, "");
  if (!value) return "";
  try {
    if (/^https?:\/\//i.test(value)) {
      const url = new URL(value);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      if (!["x.com", "twitter.com", "mobile.twitter.com"].includes(host)) return "";
      value = url.pathname.split("/").filter(Boolean)[0] || "";
    }
  } catch { return ""; }
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
    return `https://x.com/${parts[0].toLowerCase()}/status/${parts[statusIndex + 1]}`;
  } catch { return ""; }
}

function expectedVerificationMessage({ wallet, handle, postUrl, requirementsMask, rulesVersion, issuedAt, requestNonce }) {
  return [
    "LUST Pioneer Rewards mint request",
    `Wallet: ${wallet.toLowerCase()}`,
    `X account: @${handle}`,
    `Promotion post: ${postUrl}`,
    `Requirements mask: ${requirementsMask}`,
    `Rules: ${rulesVersion}`,
    `Issued at: ${issuedAt}`,
    `Request nonce: ${requestNonce}`
  ].join("\n");
}

function canonicalProof({ wallet, handle, postUrl, rulesVersion }) {
  return JSON.stringify({
    wallet: wallet.toLowerCase(),
    xHandle: handle,
    postUrl,
    rulesVersion
  });
}

async function appendAudit(record) {
  const line = `${JSON.stringify(record)}\n`;
  await fs.appendFile(path.join(DATA_DIR, "submissions.jsonl"), line, { encoding: "utf8", mode: 0o600 });
}

function safeError(error) {
  const text = error?.shortMessage || error?.reason || error?.message || "Unexpected error";
  return String(text).slice(0, 400);
}

const app = express();
if (String(process.env.TRUST_PROXY || "1") === "1") app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === PLATFORM_ORIGIN || /^https:\/\/([a-z0-9-]+\.)?lustchain\.org$/i.test(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "32kb" }));

const authorizeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many authorization requests. Wait a few minutes." }
});

app.get("/pioneer/health", async (_req, res) => {
  try {
    const [blockNumber, configuredAuthorizer] = await Promise.all([provider.getBlockNumber(), contract.mintAuthorizer()]);
    res.json({
      ok: true,
      service: "lust-pioneer-service",
      chainId: CHAIN_ID,
      blockNumber,
      contract: CONTRACT_ADDRESS,
      configuredAuthorizer,
      serviceAuthorizer: authorizer.address,
      signerMatches: configuredAuthorizer.toLowerCase() === authorizer.address.toLowerCase()
    });
  } catch (error) {
    res.status(503).json({ ok: false, message: safeError(error) });
  }
});

app.get("/pioneer/status", async (_req, res) => {
  try {
    const [mintStarted, mintClosed, mintOpen, claimsOpen, totalMinted, totalAssigned, totalClaimed, stock, balance] = await Promise.all([
      contract.mintStarted(), contract.mintClosed(), contract.mintOpen(), contract.claimsOpen(),
      contract.totalMinted(), contract.totalRewardAssigned(), contract.totalRewardClaimed(), contract.remainingRewardStock(),
      provider.getBalance(CONTRACT_ADDRESS)
    ]);
    res.set("Cache-Control", "no-store").json({
      ok: true,
      contract: CONTRACT_ADDRESS,
      mintStarted,
      mintClosed,
      mintOpen,
      claimsOpen,
      totalMinted: totalMinted.toString(),
      remainingSupply: (BigInt(MAX_SUPPLY) - totalMinted).toString(),
      totalRewardAssignedWei: totalAssigned.toString(),
      totalRewardAssignedLST: formatEther(totalAssigned),
      totalRewardClaimedWei: totalClaimed.toString(),
      contractBalanceWei: balance.toString(),
      contractBalanceLST: formatEther(balance),
      remainingStock: {
        noReward: stock.noReward.toString(),
        fiveLST: stock.fiveLST.toString(),
        tenLST: stock.tenLST.toString(),
        twentyLST: stock.twentyLST.toString(),
        fiftyLST: stock.fiftyLST.toString()
      }
    });
  } catch (error) {
    res.status(503).json({ ok: false, message: safeError(error) });
  }
});

app.post("/pioneer/authorize", authorizeLimiter, async (req, res) => {
  const requestId = crypto.randomUUID();
  try {
    const walletInput = String(req.body?.wallet || "").trim();
    if (!isAddress(walletInput)) throw new Error("Invalid wallet address.");
    const wallet = getAddress(walletInput);
    const handle = normalizeHandle(req.body?.xHandle);
    const postUrl = normalizePostUrl(req.body?.postUrl);
    const requirementsMask = Number(req.body?.requirementsMask || 0);
    const rulesVersion = String(req.body?.rulesVersion || "");
    const issuedAt = Number(req.body?.issuedAt || 0);
    const requestNonce = String(req.body?.requestNonce || "");
    const message = String(req.body?.message || "");
    const walletSignature = String(req.body?.walletSignature || "");

    if (!handle) throw new Error("Invalid X account.");
    if (!postUrl) throw new Error("Invalid public X post URL.");
    if (new URL(postUrl).pathname.split("/").filter(Boolean)[0].toLowerCase() !== handle) {
      throw new Error("The X post must belong to the submitted X account.");
    }
    if ((requirementsMask & ALL_REQUIREMENTS) !== ALL_REQUIREMENTS) throw new Error("All campaign requirements must be confirmed.");
    if (rulesVersion !== RULES_VERSION) throw new Error("Campaign rules version mismatch. Refresh the page.");
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isInteger(issuedAt) || Math.abs(now - issuedAt) > 600) throw new Error("Verification request expired. Try again.");
    if (!/^0x[0-9a-fA-F]{32}$/.test(requestNonce)) throw new Error("Invalid request nonce.");

    const expectedMessage = expectedVerificationMessage({ wallet, handle, postUrl, requirementsMask, rulesVersion, issuedAt, requestNonce });
    if (message !== expectedMessage) throw new Error("Wallet verification message mismatch.");
    const recovered = verifyMessage(message, walletSignature);
    if (recovered.toLowerCase() !== wallet.toLowerCase()) throw new Error("Wallet signature verification failed.");

    const xAccountHash = keccak256(toUtf8Bytes(handle));
    const proofHash = keccak256(toUtf8Bytes(canonicalProof({ wallet, handle, postUrl, rulesVersion })));

    const [mintOpen, walletUsed, xUsed, proofUsed, nonce, configuredAuthorizer] = await Promise.all([
      contract.mintOpen(), contract.walletHasMinted(wallet), contract.xAccountHashUsed(xAccountHash),
      contract.proofHashUsed(proofHash), contract.mintNonce(wallet), contract.mintAuthorizer()
    ]);

    if (!mintOpen) throw new Error("The Pioneer mint is not open.");
    if (walletUsed) throw new Error("This wallet has already minted.");
    if (xUsed) throw new Error("This X account has already been used.");
    if (proofUsed) throw new Error("This promotion proof has already been used.");
    if (configuredAuthorizer.toLowerCase() !== authorizer.address.toLowerCase()) {
      throw new Error("Server signer does not match the contract mintAuthorizer.");
    }

    const deadline = BigInt(now + AUTHORIZATION_TTL_SECONDS);
    const value = { wallet, xAccountHash, proofHash, requirementsMask: BigInt(requirementsMask), deadline, nonce };
    const mintSignature = await authorizer.signTypedData(EIP712_DOMAIN, EIP712_TYPES, value);

    await appendAudit({
      requestId,
      createdAt: new Date().toISOString(),
      wallet,
      xHandle: handle,
      postUrl,
      xAccountHash,
      proofHash,
      requirementsMask,
      rulesVersion,
      nonce: nonce.toString(),
      deadline: deadline.toString(),
      ipHash: crypto.createHash("sha256").update(String(req.ip || "")).digest("hex")
    });

    res.set("Cache-Control", "no-store").json({
      ok: true,
      requestId,
      wallet,
      xAccountHash,
      proofHash,
      requirementsMask,
      deadline: deadline.toString(),
      nonce: nonce.toString(),
      mintSignature
    });
  } catch (error) {
    console.error("authorize error", requestId, error);
    res.status(400).json({ ok: false, requestId, message: safeError(error) });
  }
});

function baseAssetForReward(rewardLST) {
  if (rewardLST === 5) return "5lst.png";
  if (rewardLST === 10) return "10lst.png";
  if (rewardLST === 20) return "20lst.png";
  if (rewardLST === 50) return "50lst.png";
  return "nolst.png";
}

async function tokenData(tokenId) {
  if (!Number.isInteger(tokenId) || tokenId < 1 || tokenId > MAX_SUPPLY) throw new Error("Invalid token ID.");
  const [owner, rewardWei, tier, claimed, claimsOpen] = await Promise.all([
    contract.ownerOf(tokenId), contract.rewardOf(tokenId), contract.rewardTierOf(tokenId),
    contract.rewardClaimed(tokenId), contract.claimsOpen()
  ]);
  const rewardLST = Number(formatEther(rewardWei));
  return { tokenId, owner, rewardWei, rewardLST, tier: Number(tier), claimed, claimsOpen };
}

function tierLabel(tier) {
  return ["No Reward", "Reward", "Rare Reward", "Epic Reward", "Legendary Reward"][tier] || "Unknown";
}

function claimStatus(data) {
  if (data.rewardLST === 0) return "No Reward";
  if (data.claimed) return "Claimed";
  if (!data.claimsOpen) return "Locked Until Liquidity Launch";
  return "Claimable";
}

app.get("/pioneer/metadata/:file", async (req, res) => {
  try {
    const match = String(req.params.file || "").match(/^(\d+)\.json$/);
    if (!match) return res.status(404).json({ ok: false, message: "Metadata not found." });
    const data = await tokenData(Number(match[1]));
    const rewardText = data.rewardLST > 0 ? `${data.rewardLST} LST` : "No LST Reward";
    res.set("Cache-Control", "no-store").json({
      name: `LUST Pioneer Reward #${String(data.tokenId).padStart(5, "0")}`,
      description: "Official LUST Chain promotional Pioneer NFT. Reward claims unlock only after the official liquidity launch.",
      image: `${PUBLIC_BASE_URL}/pioneer/image/${data.tokenId}.png`,
      external_url: `${PLATFORM_ORIGIN}/pioneer.html?tokenId=${data.tokenId}`,
      attributes: [
        { trait_type: "Reward", value: rewardText },
        { trait_type: "Tier", value: tierLabel(data.tier) },
        { trait_type: "Claim Status", value: claimStatus(data) },
        { display_type: "number", trait_type: "Pioneer Number", value: data.tokenId }
      ]
    });
  } catch (error) {
    res.status(404).json({ ok: false, message: safeError(error) });
  }
});

app.get("/pioneer/image/:file", async (req, res) => {
  try {
    const match = String(req.params.file || "").match(/^(\d+)\.png$/);
    if (!match) return res.status(404).end();
    const tokenId = Number(match[1]);
    const cacheFile = path.join(CACHE_DIR, `${tokenId}.png`);
    try {
      await fs.access(cacheFile);
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      return res.sendFile(cacheFile);
    } catch {}

    const data = await tokenData(tokenId);
    const asset = path.join(ASSETS_DIR, baseAssetForReward(data.rewardLST));
    const label = `#${String(tokenId).padStart(5, "0")}`;
    const color = data.rewardLST > 0 ? "#ffd76c" : "#ff3c9a";
    const border = data.rewardLST > 0 ? "#b8942d" : "#f70375";
    const overlay = Buffer.from(`
      <svg width="612" height="612" xmlns="http://www.w3.org/2000/svg">
        <rect x="451" y="548" width="126" height="36" rx="9" fill="rgba(0,0,0,.82)" stroke="${border}" stroke-width="1.5"/>
        <text x="514" y="572" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="800" letter-spacing="2" fill="${color}">${label}</text>
      </svg>`);
    await sharp(asset).composite([{ input: overlay, top: 0, left: 0 }]).png({ compressionLevel: 9 }).toFile(cacheFile);
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    return res.sendFile(cacheFile);
  } catch (error) {
    console.error("image error", error);
    res.status(404).end();
  }
});

app.get("/pioneer/collection.json", (_req, res) => {
  res.set("Cache-Control", "public, max-age=3600").json({
    name: "LUST Pioneer Rewards",
    description: "10,000 official LUST Chain promotional NFTs with immediate 0, 5, 10, 20 or 50 LST results.",
    image: `${PLATFORM_ORIGIN}/assets/pioneer/50lst.png`,
    external_link: `${PLATFORM_ORIGIN}/pioneer.html`,
    seller_fee_basis_points: 0,
    fee_recipient: "0x0000000000000000000000000000000000000000"
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(400).json({ ok: false, message: safeError(error) });
});

app.listen(PORT, "127.0.0.1", async () => {
  const configuredAuthorizer = await contract.mintAuthorizer().catch(() => "unavailable");
  console.log(`LUST Pioneer service listening on 127.0.0.1:${PORT}`);
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`Service signer: ${authorizer.address}`);
  console.log(`Contract signer: ${configuredAuthorizer}`);
});
