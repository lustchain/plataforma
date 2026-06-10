import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('taiwan-boba-blast')

export default function Page() {
  return <LustCollectibleCountryPage slug="taiwan-boba-blast" />
}
