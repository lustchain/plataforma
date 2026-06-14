# LUST Rabbit Club - Whitelist and Launch Guide

Contract:
`0x81b9a5bB109919CFF3eE4C92B2372ABCd73614e6`

Platform page:
`https://platform.lustchain.org/nfts.html`

Hidden metadata:
`https://platform.lustchain.org/nfts/lust-rabbit-club/hidden.json`

## Final narrative

- Total supply: 10,000 Rabbits
- Sale supply: 9,700 whitelist/public mint
- Reserve: 300 transparent community/ecosystem Rabbits
- No hidden rarity separation
- Reveal after the artwork and metadata are generated
- Future holder activations: LUST Bunny Pets or Rabbit Serum

## Reserve rules

The 300 reserved Rabbits are for:
- community rewards
- miners
- ambassadors
- launch campaigns
- trusted ecosystem partners
- future LUST activations and events

The reserve is not for secretly selecting rare traits before reveal.

## Whitelist steps in explorer

1. Open the contract on explorer.
2. Go to `Contract > Read/Write contract`.
3. Connect the owner wallet.
4. Add addresses with:

```solidity
setWhitelistBatch([address1,address2,address3], true)
```

Use smaller batches first, for example 20 to 50 wallets, to avoid gas issues.

5. Check one wallet with:

```solidity
whitelist(walletAddress)
```

6. Open whitelist sale:

```solidity
setWhitelistSaleOpen(true)
```

7. Keep public sale closed:

```solidity
setPublicSaleOpen(false)
```

## Public sale later

When whitelist is done:

```solidity
setWhitelistSaleOpen(false)
setPublicSaleOpen(true)
```

## Do not do now

Do not call:
- `setRevealed(true)`
- `freezeMetadata()`

Only reveal after all 10,000 JSON metadata files and images are final.
