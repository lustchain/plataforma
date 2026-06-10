import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('germany-pretzel-boss')

export default function Page() {
  return <LustCollectibleCountryPage slug="germany-pretzel-boss" />
}
