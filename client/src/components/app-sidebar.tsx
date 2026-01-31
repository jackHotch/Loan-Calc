'use client'

import * as React from 'react'
import { DollarSign, Calculator, ChartLine, Layers, ArrowLeftRight } from 'lucide-react'

import { NavList } from '@/components/nav-list'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import Link from 'next/link'

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navList: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: ChartLine,
    },
    {
      title: 'Loans',
      url: '/loans',
      icon: DollarSign,
    },
    {
      title: 'Simulations',
      url: '/simulations',
      icon: Layers,
    },
    {
      title: 'Compare',
      url: '/compare',
      icon: ArrowLeftRight,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible='icon' {...props} variant='floating'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className='data-[slot=sidebar-menu-button]:p-1.5! hover:bg-transparent'>
              <Link href='/dashboard'>
                <Calculator className='size-5!' color='var(--primary)' />
                <span className='text-base font-semibold'>Loan Calculator</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavList items={data.navList} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
