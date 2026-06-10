import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('vietnam-pho-rider')

export default function Page() {
  return <LustCollectibleCountryPage slug="vietnam-pho-rider" />
}
