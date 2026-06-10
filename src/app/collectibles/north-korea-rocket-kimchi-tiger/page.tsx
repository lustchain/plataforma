import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('north-korea-rocket-kimchi-tiger')

export default function Page() {
  return <LustCollectibleCountryPage slug="north-korea-rocket-kimchi-tiger" />
}
