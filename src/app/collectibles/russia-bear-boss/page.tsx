import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('russia-bear-boss')

export default function Page() {
  return <LustCollectibleCountryPage slug="russia-bear-boss" />
}
