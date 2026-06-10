import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('australia-outback-roo')

export default function Page() {
  return <LustCollectibleCountryPage slug="australia-outback-roo" />
}
