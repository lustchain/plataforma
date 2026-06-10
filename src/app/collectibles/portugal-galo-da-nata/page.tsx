import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('portugal-galo-da-nata')

export default function Page() {
  return <LustCollectibleCountryPage slug="portugal-galo-da-nata" />
}
