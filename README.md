# LUST Platform — Logo/Favicon Ready

Atualizações:
- Logo LUST adicionada no topo em todas as páginas.
- Favicon adicionado:
  - `assets/favicon.ico`
  - `assets/favicon.png`
  - `assets/apple-touch-icon.png`
- Cache busting: `v20260610-logo-favicon`.
- Botão custom LUST + Reown AppKit mantido.

Arquivos para subir na raiz do GitHub:
- `.github/`
- `assets/`
- `app.js`
- `styles.css`
- todos os `.html`

Domínio:
1. Em GitHub > Settings > Pages > Custom domain, coloque o domínio/subdomínio.
2. No Hostinger DNS, crie:
   - Para subdomínio como `platform.lustchain.org`: CNAME `platform` -> `lustchain.github.io`
   - Para domínio raiz como `lustchain.org`: A records para GitHub Pages:
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
3. Aguarde DNS propagar e ative Enforce HTTPS.


Update v20260610-logo-clean-big-v6:
- Logo maior no topo.
- Removido completamente o quadro/contorno em volta da logo.
- Cache busting atualizado.


Update v20260610-topbar-pink-border-v7:
- Linha/contorno do topo trocado para rosa LUST.
- Espessura aumentada para 3px.
- Visual mais suave/profissional.


Update v20260610-topbar-pink-thick-v8:
- Linha do header em rosa LUST aplicada em todas as páginas.
- Espessura aumentada para 5px.
- Rosa mais visível.


Update v20260610-active-nav-underline-v9:
- Adicionado tracinho rosa no menu da página ativa.
- Aplicado em todas as páginas.


Clean static version: arquivos antigos Next/legacy removidos. Deploy GitHub Pages sem npm/build.


Update v20260610-top-promo-bar-v10:
- Adicionada faixa rosa acima do topo em todas as páginas.
- Texto: Invest in life’s pleasures!
- Cache busting atualizado.


## Public miner TX-FEED V3 package hashes

Windows ZIP:
`40da8ea55995d2ff811f479a62fb1814a6bc7f1cc373c66d6735c90cf7a5b20f`

Ubuntu/Linux TGZ:
`9295f7eab201589da6f7d2575dea72d40541abc93a9f251709247f436c1a5be8`

TX-FEED V3 checks the public pending transaction feed every 1 second and injects raw pending transactions into the local miner node. Windows opens a second TX-FEED V3 window. Ubuntu/Linux starts the feed in background and logs to `~/LUST-Miner/logs/txfeed-v3.log`.

Linux package note: default local RPC is 18547 and P2P is 30313, so it can run beside INRI on 8545/30303.
