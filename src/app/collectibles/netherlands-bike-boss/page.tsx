import {
  generateCollectibleCountryMetadata,
  LustCollectibleCountryPage,
} from '@/components/lust-collectible-country-page'

export const metadata = generateCollectibleCountryMetadata('netherlands-bike-boss')

export default function Page() {
  return <LustCollectibleCountryPage slug="netherlands-bike-boss" />
}
