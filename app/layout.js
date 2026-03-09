import './globals.css'

export const metadata = {
  title: 'Phantom-Strike',
  description: 'AI-powered crypto trading dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
