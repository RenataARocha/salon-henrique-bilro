// src/app/layout.tsx
import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Henrique Bilro Cabeleireiros',
  description: 'Salão de beleza em Natal/RN com agendamento online. Especialistas em transformar seu visual.',

  keywords: [
    'salão de beleza em Natal',
    'cabeleireiro em Natal RN',
    'Henrique Bilro Cabeleireiros',
    'salão Potengi Natal',
    'corte feminino e masculino Natal',
  ],

  openGraph: {
    title: 'Henrique Bilro Cabeleireiros',
    description: 'Salão de beleza em Natal/RN. Agende seu horário e transforme seu visual.',
    url: 'https://henriquebilro.com',
    siteName: 'Henrique Bilro Cabeleireiros',
    locale: 'pt_BR',
    type: 'website',
  },

  robots: {
    index: true,
    follow: true,
  },

  other: {
    'geo.region': 'BR-RN',
    'geo.placename': 'Natal',
    'geo.position': '-5.7407769;-35.2541181',
    'ICBM': '-5.7407769, -35.2541181',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${inter.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
