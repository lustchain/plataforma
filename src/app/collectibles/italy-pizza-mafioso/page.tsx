import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('italy-pizza-mafioso')

export default function Page() {
  return <LustCollectibleCountryPage slug="italy-pizza-mafioso" />
}
