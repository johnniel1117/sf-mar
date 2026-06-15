import type { Metadata } from 'next'
import { Geist, Geist_Mono, Bricolage_Grotesque } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/ThemeContext'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

// Import Bricolage Grotesque font with black weight
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: '600',
  variable: '--font-bricolage',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SF ONE',
  icons: {
    icon: '/sf-express.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={bricolage.variable}>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}