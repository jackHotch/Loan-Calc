'use client'

import { LoanCard } from '@/components/simulations/loan-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLoans } from '@/lib/api/loans'

function Create() {
  const { data: loans } = useLoans()
  return (
    <div className='grid g-0 grid-cols-[1fr_380px] h-min-[calc(100vh - 40px)'>
      <div className='p-8 flex flex-col border-r gap-12'>
        <header className='flex flex-col gap-4'>
          <p className='text-label'>New Simulation</p>
          <h1 className='font-display text-5xl font-light'>
            Build your
            <br /> payoff strategy
          </h1>
          <p className='text-description'>
            Select which loans to include, choose a repayment strategy,
            <br /> and see exactly how much time and money you could save.
          </p>
        </header>

        <div className='flex flex-col gap-8'>
          <div className='flex flex-col gap-2'>
            <Label className='text-label text-xs'>Simulation Name</Label>
            <Input placeholder='e.g. Salary Raise 2025' />
          </div>
          <div>
            <div className='flex flex-col gap-2'>
              <Label className='text-label text-xs'>Description</Label>
              <Textarea className='resize-y' placeholder='Notes about the simulation...' />
            </div>
          </div>
        </div>

        <hr className='h-px bg-zinc-600/10' />

        <div>
          <h2 className='font-display text-2xl'>Select loans to include</h2>

          {loans?.map((loan, key) => {
            return <LoanCard key={key} loan={loan} />
          })}
        </div>
      </div>

      <div className='p-8 flex flex-col'>totals</div>
    </div>
  )
}

export default Create
