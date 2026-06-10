import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('iceland-lava-puffin')

export default function Page() {
  return <LustCollectibleCountryPage slug="iceland-lava-puffin" />
}
