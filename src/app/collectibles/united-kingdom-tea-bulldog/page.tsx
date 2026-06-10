import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('united-kingdom-tea-bulldog')

export default function Page() {
  return <LustCollectibleCountryPage slug="united-kingdom-tea-bulldog" />
}
