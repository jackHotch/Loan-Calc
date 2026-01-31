import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Manrope, Figtree } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/header'
import { cn } from '@/lib/utils'
import { ThemeProvider } from '@/providers/theme-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' })

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
      <html lang='en' className={cn(manrope.className, figtree.variable)} suppressHydrationWarning>
        <body>
          <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
            <Header />
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <SiteHeader />
                {children}
              </SidebarInset>
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
