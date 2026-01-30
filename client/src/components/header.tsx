import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Calculator } from 'lucide-react'

export const Header = () => {
  return (
    <>
      <header className='flex justify-between items-center p-6 gap-4 h-16'>
        <div className='flex items-center gap-2'>
          <Calculator className='text-primary-500' size={32} />
        </div>
        <div className='flex gap-8'>
          <SignedOut>
            <SignInButton>
              <button className='cursor-pointer bg-transparent dark:text-white'>Sign in</button>
            </SignInButton>
            <SignUpButton>
              <button className='bg-primary-500 text-white rounded font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer'>
                Sign Up
              </button>
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
