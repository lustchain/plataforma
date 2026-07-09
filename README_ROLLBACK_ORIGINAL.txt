LUST rollback original stable package

This package restores the frontend files from the original uploaded ZIP: plataforma-main(28).zip.
It is meant to remove the broken V14/V15/V16 visual patches from the active site.

UPLOAD:
- Use the ROOT zip if your GitHub Pages folder already contains index.html, styles.css, nfts.html, pioneer.html.
- Upload all files from this package to the same folder, overwriting existing files.

TEST:
- /LUST_ROLLBACK_ORIGINAL_CHECK.html
- /index.html
- /nfts.html
- /pioneer.html

Optional cleanup later: delete unused old files named lust-visual-v*.css, lust-visual-v*.js, LUST_V*_CHECK.html, and assets/lust-v*.svg/png if they remain in the repository. They are not used after this rollback as long as the restored HTML files overwrite the patched ones.
