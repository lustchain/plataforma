# LUST Platform — Full Connect Button Click V3

Correção:
- O botão inteiro Connect wallet abre o modal, não só a setinha.
- Aplicado em TODAS as páginas HTML.
- `onclick` direto + listener JS + CSS `pointer-events:none` nos filhos do botão.
- Cache busting novo em `styles.css` e `app.js`.
- Reown AppKit real mantido.

Depois do deploy:
- Use Ctrl+F5 ou janela anônima.
- Confirme que cada página carregou `app.js?v20260610-full-connect-button-v3`.
