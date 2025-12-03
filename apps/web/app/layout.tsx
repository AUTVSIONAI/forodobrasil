import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { ToastProvider } from '@/components/ui/ToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ForoBrasil',
  description: 'Gestão institucional'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning className={inter.className}>
        <a href="#main" className="skip">Pular para conteúdo</a>
        <ToastProvider>
          <main id="main">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  )
}
