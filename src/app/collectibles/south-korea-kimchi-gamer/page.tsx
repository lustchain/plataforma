import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('south-korea-kimchi-gamer')

export default function Page() {
  return <LustCollectibleCountryPage slug="south-korea-kimchi-gamer" />
}
