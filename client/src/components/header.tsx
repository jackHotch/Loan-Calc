'use client'

import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Calculator } from 'lucide-react'
import { ModeToggle } from './mode-toggle'
import { Button } from './ui/button'
import { usePathname } from 'next/navigation'

export const Header = () => {
  const pathname = usePathname()

  if (pathname != '/') return null

  return (
    <>
      <header className='flex justify-between items-center p-6 gap-4 h-16'>
        <div className='flex items-center gap-2'>
          <Calculator className='text-primary-500' size={32} />
        </div>
        <div className='flex items-center justify-center gap-3'>
          <ModeToggle />
          <SignedOut>
            <SignInButton>
              <Button variant='secondary'>Sign in</Button>
            </SignInButton>
            <SignUpButton>
              <Button>Sign Up</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>
      <hr className='text-primary-500' />
    </>
  )
}
