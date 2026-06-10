import { LustMiningUbuntuPage } from '@/components/lust-mining-ubuntu-page'
import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata(
  'Mining Ubuntu',
  'Ubuntu mining setup for LUST Chain.',
)

export default function Page() {
  return <LustMiningUbuntuPage />
}
