# LUST Rabbit Club - Registry Network Fix

This package fixes two issues:

1. The long registry contract address overflowing the UI.
2. The whitelist registration/status not working when the wallet is on the wrong chain.

Registry contract:
`0xA16DE59e5F13edf51464EdF807d0B23175cecfA6`

Official NFT contract:
`0x81b9a5bB109919CFF3eE4C92B2372ABCd73614e6`

## Why registration may fail

The registry is deployed on LUST Chain:

- Chain ID: `6923`
- Hex chain ID: `0x1b0b`
- RPC: `https://rpc.lustchain.org`

If MetaMask is on Polygon, BSC, Ethereum, or any other chain, registration cannot work.

The updated site now tries to switch/add LUST Chain before registering.

## Owner step required

The registry also needs to be opened by the owner:

```solidity
setRegistrationOpen(true)
```

If this is still false, the button will show:

`Whitelist registry is not open yet.`

## Test after upload

Open:

`https://platform.lustchain.org/nfts.html`

The registry status should show something like:

`Open · 0 / 9700 registered · free`

Then test the button:

`Join Whitelist On-Chain`
