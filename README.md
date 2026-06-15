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

V7A13 fork: `123387`

Windows ZIP:
`5c3f943b7e7c075ae4d2ed584d9ecfa3a03192d9f60550095c126bda435e7249`

Ubuntu/Linux TGZ:
`ef77f4d4dd00c4b4d0e0fe974d7f6b7aa40c44658df3c2261ec28dfe90b0901d`

Windows is the recommended/easy public miner at launch. Ubuntu/Linux is advanced/beta. TX-FEED V3 checks the public pending transaction feed every 0.5 seconds and injects raw pending transactions into the local miner node.

Snapshot server note: latest snapshot is rebuilt automatically when the public snapshot is behind by about 1000 blocks.


Update v20260613-p2p-lusdt-v1:
- Página P2P recriada com visual LUST/INRI premium.
- Contrato P2P conectado: `0xcd821ede23048f8fea777eeec3948135758e4926`.
- Par nativo: `LST / LUSDT`.
- LUSDT: `0x1E8636066d7e86De0A8Bd6Acb1e54BE129aC19AE`.
- Funções adicionadas no site: criar ordem de venda, criar ordem de compra, approve automático de LUSDT, preencher ordem, editar preço, editar deadline, cancelar, adicionar/remover tamanho e listar ordens abertas.
- Cache busting atualizado em `p2p.html`.

## Token Factory Premium links update

The Factory Premium plan now sends a complete explorer profile payload:
website, X/Twitter, Telegram, Discord, Instagram, YouTube, GitHub, Medium/Blog, LinkedIn, Whitepaper/Docs, Audit report, CoinGecko, CoinMarketCap, DexScreener and support email.

The contract is unchanged. These fields are off-chain metadata sent to the LUST explorer metadata endpoint before token creation.

