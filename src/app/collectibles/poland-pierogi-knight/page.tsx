import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('poland-pierogi-knight')

export default function Page() {
  return <LustCollectibleCountryPage slug="poland-pierogi-knight" />
}
