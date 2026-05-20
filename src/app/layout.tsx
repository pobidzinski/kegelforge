import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KegelForge',
  description: 'Twój trening Kegla',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        <div className="mx-auto min-h-screen bg-zinc-950 text-white" style={{ maxWidth: 430 }}>
          <main className="pb-20">
            {children}
          </main>
          <BottomNav />
          <ServiceWorkerRegistrar />
        </div>
      </body>
    </html>
  )
}
