import './globals.css'
import { Analytics } from '@vercel/analytics/next'

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        {children}
        <Analytics />
      </body>
    </html>
  )
}