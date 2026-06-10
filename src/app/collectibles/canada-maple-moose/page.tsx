import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('canada-maple-moose')

export default function Page() {
  return <LustCollectibleCountryPage slug="canada-maple-moose" />
}
