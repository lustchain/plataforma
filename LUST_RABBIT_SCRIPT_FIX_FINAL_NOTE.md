# LUST Rabbit Club - Final Script Fix

This package fixes the site registration script while preserving the NFT mint panel.

Official NFT contract:
`0x81b9a5bB109919CFF3eE4C92B2372ABCd73614e6`

Whitelist Registry contract configured in JS:
`0xA16DE59e5F13eaf51464EdF807a0B23175cecfA6`

What was fixed:
- The registry JS block reads the registry using the public LUST RPC.
- The Join Whitelist On-Chain button switches/adds LUST Chain before sending the transaction.
- The Use connected wallet button works again.
- The layout keeps the long registry address from overflowing.

After upload:
1. Hard refresh with Ctrl + F5.
2. Confirm registry status changes from `Checking on-chain...` to `Open · 0 / 9700 registered · free`.
3. Click `Join Whitelist On-Chain` with MetaMask on LUST Chain.
