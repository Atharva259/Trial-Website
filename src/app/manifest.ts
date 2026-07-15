import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BiteFlow Restaurant POS & Ordering',
    short_name: 'BiteFlow',
    description: 'Dynamic mobile-first restaurant food ordering, counter POS, kitchen KDS, and auto-stocking systems.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0A',
    theme_color: '#F59E0B',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
