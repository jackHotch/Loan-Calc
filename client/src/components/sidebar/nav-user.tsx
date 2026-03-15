'use client'

import { EllipsisVertical, LogOut } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { SignOutButton, useClerk } from '@clerk/nextjs'
import { User } from '@/constants/schema'
import { User as UserIcon } from 'lucide-react'

export function NavUser({ user }: { user: User }) {
  const { openUserProfile } = useClerk()
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <UserIcon />
              {user ? (
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>{`${user?.first_name} ${user?.last_name}`}</span>
                  <span className='text-muted-foreground truncate text-xs'>{user?.email}</span>
                </div>
              ) : (
                <p>Loading...</p>
              )}
              <EllipsisVertical className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <UserIcon />
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>{`${user?.first_name} ${user?.last_name}`}</span>
                  <span className='text-muted-foreground truncate text-xs'>{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openUserProfile()} className='cursor-pointer'>
              Manage Account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='cursor-pointer'>
              <SignOutButton>
                <span className='flex items-center gap-2'>
                  <LogOut />
                  Log out
                </span>
              </SignOutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
