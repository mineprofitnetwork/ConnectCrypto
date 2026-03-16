import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/auth/'],
    },
    sitemap: 'https://connectcrypto.com/sitemap.xml',
  }
}
