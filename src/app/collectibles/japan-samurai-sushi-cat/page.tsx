import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('japan-samurai-sushi-cat')

export default function Page() {
  return <LustCollectibleCountryPage slug="japan-samurai-sushi-cat" />
}
