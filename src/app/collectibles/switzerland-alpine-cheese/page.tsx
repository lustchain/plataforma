import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('switzerland-alpine-cheese')

export default function Page() {
  return <LustCollectibleCountryPage slug="switzerland-alpine-cheese" />
}
