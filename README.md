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


Clean static version: arquivos antigos Next/INRI removidos. Deploy GitHub Pages sem npm/build.
