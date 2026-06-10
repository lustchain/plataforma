import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('china-dragon-noodles')

export default function Page() {
  return <LustCollectibleCountryPage slug="china-dragon-noodles" />
}
