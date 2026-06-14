# LUST Rabbit Club — Platform domain fix

Correct public site URL:

- `https://platform.lustchain.org/nfts.html`
- `https://platform.lustchain.org/nfts/lust-rabbit-club/hidden.json`
- `https://platform.lustchain.org/nfts/lust-rabbit-club/hidden.png`

Contract already deployed:

- `0x81b9a5bB109919CFF3eE4C92B2372ABCd73614e6`

Important: the deployed constructor used the old hidden URI:

- `https://lustchain.org/nfts/lust-rabbit-club/hidden.json`

After uploading this corrected site, call this owner function in the explorer Read/Write contract tab:

```text
setHiddenMetadataURI("https://platform.lustchain.org/nfts/lust-rabbit-club/hidden.json")
```

Keep sales closed until the platform URLs are tested.
