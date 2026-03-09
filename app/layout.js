'use client'

import { DataProvider } from '@/components/DataProvider'
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <DataProvider>
          <main className="min-h-screen bg-black">
            {children}
          </main>
        </DataProvider>
      </body>
    </html>
  )
}
