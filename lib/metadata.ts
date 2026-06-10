import type { Metadata } from 'next'

const SITE_URL = 'https://lustchain.org'
const DEFAULT_DESCRIPTION =
  'Official LUST Chain website with wallet access, explorer, mining, pool, staking, token factory, P2P routes and whitepaper.'

export function createPageMetadata(
  title: string,
  description: string = DEFAULT_DESCRIPTION,
): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: title === 'Home' ? '/' : undefined,
    },
    openGraph: {
      title: title === 'Home' ? 'LUST Chain' : `${title} | LUST Chain`,
      description,
      url: SITE_URL,
      siteName: 'LUST Chain',
      type: 'website',
      images: ['/lust-logo.svg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: title === 'Home' ? 'LUST Chain' : `${title} | LUST Chain`,
      description,
      images: ['/lust-logo.svg'],
    },
  }
}
