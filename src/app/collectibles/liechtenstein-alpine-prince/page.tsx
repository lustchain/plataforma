import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('liechtenstein-alpine-prince')

export default function Page() {
  return <LustCollectibleCountryPage slug="liechtenstein-alpine-prince" />
}
