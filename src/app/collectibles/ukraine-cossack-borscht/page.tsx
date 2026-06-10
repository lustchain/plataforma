import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('ukraine-cossack-borscht')

export default function Page() {
  return <LustCollectibleCountryPage slug="ukraine-cossack-borscht" />
}
