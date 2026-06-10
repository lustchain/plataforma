import { LustMiningPage } from '@/components/lust-mining-page'
import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata(
  'Mining',
  'Mining entry page for LUST Chain with Windows, Ubuntu and pool routes.',
)

export default function Page() {
  return <LustMiningPage />
}
