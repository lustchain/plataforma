LUST Mining page V7A25 registration-ready patch

Use this ZIP to update the site registration page only.

Important blocks:
- RegistryBlock: 138282
- SignatureBlock: 139082
- AutonomyBlock: 999999999999

What changed:
- mining.html now shows the correct V7A25 fixed blocks.
- app.js blocks the Register button until current LUST block >= 138282.
- app.js checks eth_blockNumber again before sending the registration transaction.
- Download buttons no longer point to missing /downloads files; use the private miner package directly.

Registration transaction details:
- to: 0x0000000000000000000000000000000000006923
- data: 0x4c5143525f5632 + operator address without 0x
- value: 0
- chain: LUST Chain 6923

Do not register before block 138282.
