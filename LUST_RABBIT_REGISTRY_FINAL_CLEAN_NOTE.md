# LUST Rabbit Club - Registry Final Clean Fix

This package rebuilds the whitelist registry JavaScript block cleanly.

Fixed:
- removed broken literal backslash-n in JS
- kept exact registry contract address
- kept exact official NFT contract address
- added live registry count
- added connected wallet registry status
- kept LUST Chain switch before register

Official NFT contract:
`0x81b9a5bB109919CFF3eE4C92B2372ABCd73614e6`

Whitelist Registry:
`0xA16DE59e5F13eaf51464EdF807a0B23175cecfA6`

After upload:
1. Hard refresh with Ctrl + F5.
2. Registry status should show: Open · count / 9700 registered · free.
3. Try Join Whitelist On-Chain with a wallet that has not registered yet.
