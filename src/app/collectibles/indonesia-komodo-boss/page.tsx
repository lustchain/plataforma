import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('indonesia-komodo-boss')

export default function Page() {
  return <LustCollectibleCountryPage slug="indonesia-komodo-boss" />
}
