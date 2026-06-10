import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('israel-island-of-innovation')

export default function Page() {
  return <LustCollectibleCountryPage slug="israel-island-of-innovation" />
}
