import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('philippines-jeepney-star')

export default function Page() {
  return <LustCollectibleCountryPage slug="philippines-jeepney-star" />
}
