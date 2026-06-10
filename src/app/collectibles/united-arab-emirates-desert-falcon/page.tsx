import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('united-arab-emirates-desert-falcon')

export default function Page() {
  return <LustCollectibleCountryPage slug="united-arab-emirates-desert-falcon" />
}
