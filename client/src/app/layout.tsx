import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Manrope } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/header'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  title: 'Student Loan Calc',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang='en' className={manrope.className}>
        <body>
          <Header />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
