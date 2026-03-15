import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ConnectCrypto Institutional',
    short_name: 'ConnectCrypto',
    description: 'Elite P2P Crypto Settlement Node',
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#050505',
    icons: [
      {
        src: 'https://picsum.photos/seed/logo/192/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://picsum.photos/seed/logo/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}