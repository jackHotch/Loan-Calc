'use client'

import { usePathname } from 'next/navigation'
import { SidebarInset } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export function SidebarInsetWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isSimulation = pathname?.includes('/simulation')

  return <SidebarInset className={cn(isSimulation && 'overflow-visible')}>{children}</SidebarInset>
}
