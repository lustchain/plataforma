# LUST Rabbit Club - Correct Transparency

## Official contracts

Official NFT contract:
`0x81b9a5bB109919CFF3eE4C92B2372ABCd73614e6`

Whitelist Registry contract:
`0xA16DE59e5F13eaf51464EdF807a0B23175cecfA6`

LUSDT payment token:
`0x1E8636066d7e86De0A8Bd6Acb1e54BE129aC19AE`

Current project receiver wallet:
`0x74b8db40d1bC5B590bB8dBB62dCc60Eb2DaD8f12`

## Why there are two contracts

There is only one NFT collection contract.

The Whitelist Registry is only an auxiliary on-chain registration contract. It does not mint NFTs, does not sell NFTs and does not receive LUSDT from mint payments.

## Mint prices

- Whitelist mint: `50 LUSDT`
- Public mint: `100 LUSDT`

## Fund allocation from mint

The official NFT contract has a split configured as:

- `80%` Treasury / Creator / Project
- `20%` Liquidity / Market Support

Current on-chain setup:
- Treasury wallet: `0x74b8db40d1bC5B590bB8dBB62dCc60Eb2DaD8f12`
- Liquidity wallet: `0x74b8db40d1bC5B590bB8dBB62dCc60Eb2DaD8f12`

Because both receiver fields currently point to the same wallet, 100% of mint LUSDT is received by the project wallet today. The public allocation policy is:

- 80% for creator/project treasury, development, art production, operations, marketing, infrastructure and future LUST ecosystem work
- 20% for liquidity support, pool campaigns, market depth, exchange initiatives and ecosystem liquidity actions

## Whitelist registration

- Registration fee: `0`
- Users only pay normal LUST gas
- The Registry does not collect LUSDT
- Registration does not mint an NFT
- Registration does not guarantee approval

## Royalty

- Secondary royalty: `5%`
- Royalty receiver: `0x74b8db40d1bC5B590bB8dBB62dCc60Eb2DaD8f12`
- Royalties apply only on supported secondary marketplaces

## Supply

- Total supply: `10,000 Rabbits`
- Sale supply: `9,700 Rabbits`
- Reserve supply: `300 Rabbits`

## Reserve rules

The 300 reserved Rabbits are for:

- community rewards
- miners
- ambassadors
- launch campaigns
- trusted ecosystem partners
- future LUST activations and events

The reserve is not a hidden rarity allocation. Traits and rarities will appear only after final metadata reveal.
