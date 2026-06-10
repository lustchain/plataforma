import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('singapore-merlion-mode')

export default function Page() {
  return <LustCollectibleCountryPage slug="singapore-merlion-mode" />
}
