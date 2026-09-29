import type { Metadata, Viewport } from 'next';
// Free DIN-style stand-in (OFL), used until real DIN 1451 files are added. See README → Fonts.
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/400-italic.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
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
  viewportFit: 'cover',
  themeColor: '#F3EEE4',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
