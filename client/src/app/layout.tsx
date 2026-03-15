import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Figtree } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/header/header'
import { cn } from '@/lib/utils'
import { ThemeProvider } from '@/providers/theme-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SiteHeader } from '@/components/header/site-header'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/sonner'
import { CircleCheck, CircleX } from 'lucide-react'
import { SidebarInsetWrapper } from '@/components/sidebar/sidebar-inset-wrapper'

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Loan Tracker',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang='en' className={cn(figtree.variable)} suppressHydrationWarning>
        <body>
          <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
            <Providers>
              <Header />
              <SidebarProvider>
                <AppSidebar />
                <SidebarInsetWrapper>
                  <SiteHeader />
                  <Toaster
                    icons={{
                      success: <CircleCheck color='green' size={18} />,
                      error: <CircleX color='red' size={18} />,
                    }}
                  />
                  {children}
                </SidebarInsetWrapper>
              </SidebarProvider>
            </Providers>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
