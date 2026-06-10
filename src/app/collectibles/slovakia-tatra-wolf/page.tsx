import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('slovakia-tatra-wolf')

export default function Page() {
  return <LustCollectibleCountryPage slug="slovakia-tatra-wolf" />
}
