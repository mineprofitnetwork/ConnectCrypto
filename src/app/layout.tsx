import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SupabaseAuthProvider } from '@/lib/supabase-auth-provider';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { GalaxyBackground } from '@/components/ui/galaxy-background';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://connectcrypto.com'),
  title: {
    default: 'ConnectCrypto | Best P2P Platform to Buy & Sell Crypto in India',
    template: '%s | ConnectCrypto'
  },
  description: 'ConnectCrypto is the best P2P platform in India for USDT trading. Buy and sell crypto with high commissions. Remote WFH agent jobs available. Gaming stock funds and secure institutional node.',
  keywords: [
    'best p2p platform',
    'buy sell crypto',
    'usdt in india',
    'gaming stock fund',
    'high commission',
    'agent wfh job',
    'remote job',
    'ConnectCrypto',
    'p2p trading india',
    'crypto earning'
  ],
  authors: [{ name: 'ConnectCrypto Team' }],
  creator: 'ConnectCrypto',
  publisher: 'ConnectCrypto',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://connectcrypto.com',
    siteName: 'ConnectCrypto',
    title: 'ConnectCrypto | Best P2P Platform for USDT in India',
    description: 'Join the best P2P platform to buy & sell crypto with high commissions. Remote agent WFH jobs available now.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ConnectCrypto Institutional P2P Node',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ConnectCrypto | Best P2P Platform in India',
    description: 'High commission P2P trading and remote WFH agent jobs. Buy/Sell USDT securely.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ConnectCrypto',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark no-scrollbar ${inter.variable} ${spaceGrotesk.variable} overflow-x-hidden`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FinancialService',
              'name': 'ConnectCrypto',
              'description': 'Best P2P platform in India for buying and selling USDT with high commissions.',
              'url': 'https://connectcrypto.com',
              'logo': 'https://connectcrypto.com/logo.png',
              'address': {
                '@type': 'PostalAddress',
                'addressCountry': 'IN'
              },
              'offers': {
                '@type': 'Offer',
                'description': 'Buy and sell crypto with high commission. Remote WFH agent jobs available.',
                'offeredBy': {
                  '@type': 'Organization',
                  'name': 'ConnectCrypto'
                }
              }
            })
          }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground overflow-hidden selection:bg-primary/30 h-full w-full fixed inset-0">
        <SupabaseAuthProvider>
          <GalaxyBackground />
          <div className="h-full w-full flex flex-col relative z-10 overflow-hidden">
            {children}
          </div>
          <InstallPrompt />
        </SupabaseAuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
