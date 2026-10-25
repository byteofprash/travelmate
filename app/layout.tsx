import type { Metadata, Viewport } from 'next';
// Pixel Operator (CC0) is loaded from public/fonts via app/globals.css.
import './globals.css';

export const metadata: Metadata = {
  title: 'Travel Companion',
  description: 'Where you’re going today, how you’re getting there and where you’re sleeping tonight.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Travel', statusBarStyle: 'default' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#29366f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
