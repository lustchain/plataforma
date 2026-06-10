import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('mexico-taco-mariachi')

export default function Page() {
  return <LustCollectibleCountryPage slug="mexico-taco-mariachi" />
}
