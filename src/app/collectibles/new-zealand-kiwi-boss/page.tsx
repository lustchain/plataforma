import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('new-zealand-kiwi-boss')

export default function Page() {
  return <LustCollectibleCountryPage slug="new-zealand-kiwi-boss" />
}
