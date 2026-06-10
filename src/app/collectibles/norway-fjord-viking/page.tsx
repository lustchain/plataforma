import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('norway-fjord-viking')

export default function Page() {
  return <LustCollectibleCountryPage slug="norway-fjord-viking" />
}
