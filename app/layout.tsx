// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Providers } from '@/components/Providers'
import WhatsAppButton from '@/components/WhatsAppButton'
import ScrollToTopButton from '@/components/ScrollToTopButton'
import { Toaster } from 'react-hot-toast';

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

// ✅ VIEWPORT SEPARADO
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  title: {
    default: 'Henrique Bilro Cabeleireiros - Salão de Beleza em Natal/RN',
    template: '%s | Henrique Bilro Cabeleireiros',
  },

  description:
    'Salão de beleza em Natal/RN no bairro Potengi. Especialistas em corte, coloração e tratamentos capilares. Agende online com Rosie Bilro.',

  keywords: [
    'salão de beleza Natal',
    'cabeleireiro Natal RN',
    'Henrique Bilro Cabeleireiros',
    'salão Potengi Natal',
    'corte feminino Natal',
    'corte masculino Natal',
    'coloração capilar Natal',
    'mechas Natal',
  ],

  authors: [{ name: 'Henrique Bilro Cabeleireiros' }],
  creator: 'Henrique Bilro Cabeleireiros',
  publisher: 'Henrique Bilro Cabeleireiros',

  openGraph: {
    title: 'Henrique Bilro Cabeleireiros',
    description:
      'Transforme seu visual no melhor salão de beleza do Potengi. Agende online.',
    url: 'https://salon-henrique-bilro.vercel.app',
    siteName: 'Henrique Bilro Cabeleireiros',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Henrique Bilro Cabeleireiros',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Henrique Bilro Cabeleireiros',
    description: 'Salão de beleza em Natal/RN. Agende online.',
    images: ['/og-image.png'],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: 'https://salon-henrique-bilro.vercel.app',
  },

  verification: {
    google: 'hXeWeGInBZl0q9WLs_RfAKDC61OR0wfqfAMwdomyPeY',
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

        {/* Schema.org - SEO Local */}
        <Script
          id="schema-hairsalon"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'HairSalon',
              name: 'Henrique Bilro Cabeleireiros',
              image: 'https://salon-henrique-bilro.vercel.app/logo.png',
              url: 'https://salon-henrique-bilro.vercel.app',
              telephone: '+5584988814965',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Av. Rio Doce, 3101',
                addressLocality: 'Natal',
                addressRegion: 'RN',
                addressCountry: 'BR',
              },
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: [
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                  ],
                  opens: '09:00',
                  closes: '19:00',
                },
              ],
              sameAs: ['https://instagram.com/rosebilro'],
            }),
          }}
        />

        <ScrollToTopButton />
        <WhatsAppButton />
        <Toaster position="top-right" />
      </body>
    </html>
  )
}