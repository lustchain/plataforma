import type { Metadata } from 'next'
import { LustMiningChampionshipPage } from '@/components/lust-mining-championship-page'

export const metadata: Metadata = {
  title: 'Mining Championship',
  description:
    'Official LUST Chain independent mining championship page with block window, live-style ranking, address search and reward overview.',
}

export default function MiningChampionshipRoute() {
  return <LustMiningChampionshipPage />
}
