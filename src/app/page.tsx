import { LustHomepage } from '@/components/lust-homepage'
import { createPageMetadata } from '@/lib/metadata'

export const metadata = createPageMetadata(
  'Home',
  'Official home of LUST Chain with wallet access, explorer, mining, pool, token factory, staking and the active mining championship route.',
)

export default function HomePage() {
  return <LustHomepage />
}
