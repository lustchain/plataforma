import { LustShell } from '@/components/lust-site-shell'
import { LustLiquidityCampaignClient } from '@/components/lust-liquidity-campaign-client'

export const metadata = {
  title: 'Liquidity Campaign | LUST Chain',
  description: 'Protected LUSDT / LUST liquidity seeding campaign for LUSTSwap.',
}

export default function Page() {
  return (
    <LustShell>
      <LustLiquidityCampaignClient />
    </LustShell>
  )
}
