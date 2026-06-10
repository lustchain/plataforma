import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('turkiye-kebab-sultan')

export default function Page() {
  return <LustCollectibleCountryPage slug="turkiye-kebab-sultan" />
}
