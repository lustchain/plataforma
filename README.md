# LUST Simple Platform — WalletConnect Button

Versão estática sem Next e sem npm.

Botão Connect:
- Abre modal próprio no estilo INRI
- Browser wallet / MetaMask
- WalletConnect v2 via CDN
- Switch/Add LUST Chain
- Account modal simples com copiar endereço, explorer e disconnect

Arquivos:
- index.html redireciona para bridge.html
- bridge.html
- mining.html
- swap.html
- staking.html
- liquidity.html
- p2p.html
- nfts.html
- factory.html
- explorer.html
- docs.html
- styles.css
- app.js
- .github/workflows/deploy-pages.yml


Fix atual:
- Contornos engrossados em todas as páginas.
- Connect wallet com borda mais forte.
- Clique no Connect abre modal sempre.
- Disconnect fecha modal e limpa estado local.
