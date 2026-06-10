import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('bangladesh-rickshaw-tiger')

export default function Page() {
  return <LustCollectibleCountryPage slug="bangladesh-rickshaw-tiger" />
}
