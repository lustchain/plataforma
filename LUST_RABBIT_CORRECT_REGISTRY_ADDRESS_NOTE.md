# LUST Rabbit Club - Correct Registry Address

The Whitelist Registry address was corrected to the exact deployed contract shown in the explorer:

`0xA16DE59e5F13eaf51464EdF807a0B23175cecfA6`

Official NFT contract remains:

`0x81b9a5bB109919CFF3eE4C92B2372ABCd73614e6`

What was corrected:
- `nfts-rabbit.js`
- `nfts.html`
- docs/notes

After uploading:
1. Hard refresh with Ctrl + F5.
2. Open `https://platform.lustchain.org/nfts.html`.
3. Registry status should read from the correct contract.
4. Since you already called `setRegistrationOpen(true)`, the status should show open if RPC/cache is updated.
