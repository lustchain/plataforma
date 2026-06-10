import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('france-croissant-pup')

export default function Page() {
  return <LustCollectibleCountryPage slug="france-croissant-pup" />
}
