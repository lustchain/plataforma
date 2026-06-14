# LUST Rabbit Club launch notes

This update only changes/adds the NFT launch files. Other platform pages remain untouched.

## Added files

- `nfts.html` — LUST Rabbit Club landing and mint panel.
- `nfts-rabbit.css` — styles loaded only by `nfts.html`.
- `nfts-rabbit.js` — mint/approve logic loaded only by `nfts.html`.
- `nfts/lust-rabbit-club/hidden.webp` — pre-reveal image.
- `nfts/lust-rabbit-club/teaser.webp` — teaser image shown on the NFT page.
- `nfts/lust-rabbit-club/hidden.json` — metadata URI for the contract deploy.
- `contracts/LUSTRabbitClub.sol` — Remix contract source.

## Deploy parameters

Compiler: `0.8.30`
EVM: `London`
Optimization: `200`

Constructor:

```text
_paymentToken: 0x1E8636066d7e86De0A8Bd6Acb1e54BE129aC19AE
_treasuryWallet: YOUR_WALLET
_liquidityWallet: YOUR_WALLET_OR_LIQUIDITY_WALLET
_hiddenMetadataURI: https://platform.lustchain.org/nfts/lust-rabbit-club/hidden.json
_royaltyReceiver: YOUR_WALLET
_royaltyFeeNumerator: 500
```

## After deploy

1. Verify the contract on the explorer.
2. Open `nfts-rabbit.js`.
3. Paste the deployed contract address in:

```js
const RABBIT_CONTRACT_ADDRESS = "";
```

4. Keep sales closed while testing:

```text
whitelistSaleOpen = false
publicSaleOpen = false
revealed = false
```

5. When ready, open whitelist with:

```text
setWhitelistBatch([...wallets], true)
setWhitelistSaleOpen(true)
```

6. Public sale:

```text
setWhitelistSaleOpen(false)
setPublicSaleOpen(true)
```
