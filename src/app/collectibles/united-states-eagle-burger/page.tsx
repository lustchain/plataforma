import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('united-states-eagle-burger')

export default function Page() {
  return <LustCollectibleCountryPage slug="united-states-eagle-burger" />
}
