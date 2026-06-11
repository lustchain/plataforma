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


## Public miner TX-FEED V2 package hashes

Windows ZIP:
`63b061ff027020c95197a869875bdcb4b3452bfefac7bea682971b9de0dc65ad`

Ubuntu/Linux TGZ:
`3b659599eab720d4003157c15eebc8ef03a0abe51f6a1bc2129fc09f68e8fe61`

TX-FEED V2 checks the public pending transaction feed every 1 second and injects raw pending transactions into the local miner node. Windows opens a second TX-FEED V2 window. Ubuntu/Linux starts the feed in background and logs to `~/LUST-Miner/logs/txfeed-linux.log`.
