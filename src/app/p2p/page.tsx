import { LustP2PPage } from '@/components/lust-p2p-page'
import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata(
  'P2P',
  'Peer-to-peer market route for LUST Chain.',
)

export default function Page() {
  return <LustP2PPage />
}
