import type { Metadata, Viewport } from 'next';
// Nunito Sans (SIL OFL), variable weight.
import '@fontsource-variable/nunito-sans';
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
  themeColor: '#EAF0EE',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
