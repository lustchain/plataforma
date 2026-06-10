import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('nigeria-jollof-boss')

export default function Page() {
  return <LustCollectibleCountryPage slug="nigeria-jollof-boss" />
}
