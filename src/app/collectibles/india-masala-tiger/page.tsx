import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('india-masala-tiger')

export default function Page() {
  return <LustCollectibleCountryPage slug="india-masala-tiger" />
}
