import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('brazil-samba-capy')

export default function Page() {
  return <LustCollectibleCountryPage slug="brazil-samba-capy" />
}
