import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
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
  title: 'ConnectCrypto | Institutional P2P Node',
  description: 'Secure P2P cryptocurrency trading platform for global institutional payments.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ConnectCrypto',
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
      </head>
      <body className="font-body antialiased bg-background text-foreground overflow-hidden selection:bg-primary/30 h-full w-full fixed inset-0">
        <FirebaseClientProvider>
          <GalaxyBackground />
          <div className="h-full w-full flex flex-col relative z-10 overflow-hidden">
            {children}
          </div>
          <InstallPrompt />
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
