import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Henrique Bilro Cabeleireiros',
  description: 'Sistema de agendamento online',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}