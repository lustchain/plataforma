import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('argentina-gaucho-mate')

export default function Page() {
  return <LustCollectibleCountryPage slug="argentina-gaucho-mate" />
}
