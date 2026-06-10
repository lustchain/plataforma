import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('egypt-pharaoh-cat')

export default function Page() {
  return <LustCollectibleCountryPage slug="egypt-pharaoh-cat" />
}
