import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TipIn',
    short_name: 'TipIn',
    description: 'De TipIn app door HVF!',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/HvF-Logo.jpg', // You need to put an icon.png in your 'public' folder
        sizes: '597x597',
        type: 'image/jpg',
      },
    ],
  }
}