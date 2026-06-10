import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('ireland-lucky-leprechaun')

export default function Page() {
  return <LustCollectibleCountryPage slug="ireland-lucky-leprechaun" />
}
