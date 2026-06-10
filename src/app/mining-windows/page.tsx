import { LustMiningWindowsPage } from '@/components/lust-mining-windows-page'
import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata(
  'Mining Windows',
  'Windows mining setup for LUST Chain.',
)

export default function Page() {
  return <LustMiningWindowsPage />
}
