import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TipIn — Heren van Flatsoen',
    short_name: 'TipIn',
    description: 'De team-app van Heren van Flatsoen!',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/HvF-Logo.jpg',
        sizes: '597x597',
        type: 'image/jpeg',
      },
    ],
  }
}
