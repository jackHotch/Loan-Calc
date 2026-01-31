'use client'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useRouter } from 'next/navigation'
import { useSidebar } from '@/components/ui/sidebar'

export function NavList({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: any
  }[]
}) {
  const router = useRouter()
  const { setOpenMobile } = useSidebar()

  const handleNavClick = (redirectUrl: string) => {
    router.push(redirectUrl)
    setOpenMobile(false)
  }
  return (
    <SidebarGroup>
      <SidebarGroupContent className='flex flex-col gap-2'>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} onClick={() => handleNavClick(item.url)}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
