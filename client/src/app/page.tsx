import { Button } from '@/components/ui/button'
import { SignUpButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <div className='flex flex-col justify-center items-center p-4 sm:p-8'>
      <div className='flex flex-col items-center gap-4 w-fit mt-12 sm:mt-24 text-center'>
        <h1 className='text-4xl sm:text-6xl font-bold'>Loan Calculator</h1>
        <p className='text-zinc-500'>A tool to help you manage your debt and spend less money</p>
        <SignUpButton>
          <Button size='lg'>Start saving money</Button>
        </SignUpButton>
      </div>
    </div>
  )
}
