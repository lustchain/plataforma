import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('spain-fiesta-bull')

export default function Page() {
  return <LustCollectibleCountryPage slug="spain-fiesta-bull" />
}
