import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('hong-kong-neon-dim-sum')

export default function Page() {
  return <LustCollectibleCountryPage slug="hong-kong-neon-dim-sum" />
}
