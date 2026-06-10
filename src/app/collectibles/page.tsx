import { LustShell } from '@/components/lust-site-shell'
import { LustCollectiblesPage } from '@/components/lust-collectibles-page'

export const metadata = {
  title: 'LUST World Meme Collectibles | Mint Country NFTs with LUSDT',
  description:
    'Mint LUST country meme NFTs with LUSDT. Each country has 501 collectibles, rarity by serial number, country reward tokens, and an initial mint allocation for liquidity.',
}

export default function CollectiblesPage() {
  return (
    <LustShell>
      <LustCollectiblesPage />
    </LustShell>
  )
}
