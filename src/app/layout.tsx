import type { Metadata } from 'next';
import './globals.css';
import { RestaurantProvider } from '@/context/RestaurantContext';

export const metadata: Metadata = {
  title: 'BiteFlow | Premium Restaurant POS & Ordering',
  description: 'Self-service mobile food ordering, real-time KDS, counter cash management, and auto-stocking analytics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </head>
      <body>
        <RestaurantProvider>
          {children}
        </RestaurantProvider>
      </body>
    </html>
  );
}
