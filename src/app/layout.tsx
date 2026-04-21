import type { Metadata } from 'next';
import { Fraunces, Geist } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

// Display font: Fraunces — a chunky variable serif with optical sizes.
// Gives our brand a human, editorial feel that generic sans-serifs lack.
const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '600', '700', '900'],
});

// Body font: Geist — modern, neutral, extremely legible.
const sans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'My Brothers Truck — Someone nearby. A truck. Your stuff moved.',
  description:
    'Peer-to-peer moving help. Post what needs moving, get matched with a neighbor who owns a truck. Fair prices, rated helpers.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'My Brothers Truck',
    description: 'Need a truck? Your brother\'s brother probably has one.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
