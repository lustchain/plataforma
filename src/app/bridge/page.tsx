import { LustShell } from '@/components/lust-site-shell'
import { LustBridgePage } from '@/components/lust-bridge-page'

export const metadata = {
  title: 'LUSDT Bridge | LUST Chain',
  description: 'Bridge USDT on Polygon to LUSDT on LUST Chain, and LUSDT back to USDT.',
}

export default function BridgePage() {
  return (
    <LustShell>
      <LustBridgePage />
    </LustShell>
  )
}
