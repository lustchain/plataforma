# LUST Pioneer service deployment

This service is required because the deployed NFT contract accepts only an EIP-712 mint authorization signed by `mintAuthorizer`. It also serves dynamic metadata and numbered PNGs because each reward is drawn during mint.

## Important security rule

Never upload `.env` or the mint-authorizer private key to GitHub. The private key stays only on the server with file mode `600`.

## Install

```bash
mkdir -p /opt/lust-pioneer
cp -a pioneer-server/. /opt/lust-pioneer/
cd /opt/lust-pioneer
npm install --omit=dev
cp .env.example .env
chmod 600 .env
nano .env
```

The private key in `.env` must belong to the address returned by the contract's `mintAuthorizer()` function. The current contract was deployed with owner and mintAuthorizer set to `0x5feb6d7135318565Fb02F6513dB4758dB51Df9D7`. For production, create a dedicated hot signer, call `setMintAuthorizer(newSigner)` from the owner wallet, and put only the dedicated signer's private key on the server.

## Start with PM2

```bash
cd /opt/lust-pioneer
pm2 start ecosystem.config.cjs
pm2 save
pm2 logs lust-pioneer-service --lines 100
```

## Nginx routes on downloads.lustchain.org

```nginx
location /pioneer/ {
    proxy_pass http://127.0.0.1:8097;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Because `proxy_pass` has no trailing slash, `/pioneer/authorize` reaches the same path in Node.

Reload safely:

```bash
nginx -t && systemctl reload nginx
```

## Test before opening mint

```bash
curl -s https://downloads.lustchain.org/pioneer/health | jq
curl -s https://downloads.lustchain.org/pioneer/status | jq
```

`signerMatches` must be `true`.

## Contract metadata settings

After the service is online, call:

- `setMetadata("https://downloads.lustchain.org/pioneer/metadata/", "https://downloads.lustchain.org/pioneer/collection.json")`
- test metadata after one controlled test mint
- then call `freezeMetadata()` only after every URL is confirmed

Do not run `startMint()` until the service signer, page, metadata, reward reserve and end timestamp are all verified.
