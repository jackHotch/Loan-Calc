import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Manrope, Figtree } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/header/header'
import { cn } from '@/lib/utils'
import { ThemeProvider } from '@/providers/theme-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SiteHeader } from '@/components/header/site-header'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/sonner'
import { CircleCheck, CircleX } from 'lucide-react'

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
            <Providers>
              <Header />
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  <SiteHeader />
                  <Toaster
                    icons={{
                      success: <CircleCheck color='green' size={18} />,
                      error: <CircleX color='red' size={18} />,
                    }}
                  />
                  {children}
                </SidebarInset>
              </SidebarProvider>
            </Providers>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
