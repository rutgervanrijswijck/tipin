import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Welkom bij TipIn — Heren van Flatsoen',
  description:
    'Maak je account aan en installeer de TipIn team-app van Heren van Flatsoen op je telefoon.',
  openGraph: {
    title: 'Welkom bij TipIn — Heren van Flatsoen',
    description:
      'Maak je account aan en installeer de TipIn team-app van Heren van Flatsoen op je telefoon.',
    url: '/setup',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Welkom bij TipIn — Heren van Flatsoen',
    description:
      'Maak je account aan en installeer de TipIn team-app van Heren van Flatsoen op je telefoon.',
  },
}

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
