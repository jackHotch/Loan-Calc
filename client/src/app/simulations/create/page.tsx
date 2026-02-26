'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLoans } from '@/lib/api/loans'
import { formatCurrency } from '@/lib/utils'
import { payoffStrategies } from '@/constants/constants'
import { useState } from 'react'

function Create() {
  const { data: loans } = useLoans()
  const [selectedLoans, setSelectedLoans] = useState<Set<BigInt>>(new Set(loans?.map((l) => l.id)))

  function toggleSelected(id: BigInt) {
    setSelectedLoans((prev) => {
      const currentLoans = new Set(prev)
      currentLoans.has(id) ? currentLoans.delete(id) : currentLoans.add(id)
      return currentLoans
    })
  }

  return (
    <div className='grid g-0 grid-cols-[1fr_380px] lg:grid-cols-[1fr_430px] h-min-[calc(100vh - 40px)'>
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
              <Label className='text-label text-xs'>Description (Optional)</Label>
              <Textarea className='resize-y' placeholder='Notes about the simulation...' />
            </div>
          </div>
        </div>

        <hr className='h-px bg-zinc-600/10' />

        <div className='flex flex-col gap-2'>
          <h2 className='font-display text-2xl mb-4'>Select loans to include</h2>

          {loans?.map((loan, key) => {
            const isSelected = selectedLoans.has(loan.id)
            const containerSelectedStyles = isSelected ? 'border-primary/35 bg-primary/1' : 'hover:bg-secondary/60'
            const checkSelectedStyles = isSelected ? 'bg-primary' : ''
            const interestRateColor =
              loan.interest_rate > 10
                ? 'text-red-500/70'
                : loan.interest_rate > 5
                  ? 'text-amber-500/60'
                  : 'text-green-700/80'
            return (
              <div
                key={key}
                className={`${containerSelectedStyles} card cursor-pointer justify-between gap-4`}
                onClick={() => toggleSelected(loan.id)}
              >
                <div
                  className={`${checkSelectedStyles} text-black border w-5 h-5 flex items-center justify-center text-xs`}
                >
                  {isSelected ? '✓' : null}
                </div>
                <div className='flex justify-between flex-1'>
                  <div className='flex flex-col'>
                    <p className='text-sm'>{loan.name}</p>
                    <p className='text-description'>{loan.lender}</p>
                  </div>
                  <div className='flex flex-col items-end'>
                    <p className='text-sm'>{formatCurrency(loan.current_principal)}</p>
                    <p className={`${interestRateColor} text-xs`}>{loan.interest_rate}% APR</p>
                  </div>
                </div>
              </div>
            )
          })}

          <p className='text-description'>
            {selectedLoans.size} of {loans?.length} loans selected
          </p>
        </div>

        <hr className='h-px bg-zinc-600/10' />

        <div>
          <h2 className='font-display text-2xl mb-6'>Choose your payoff strategy</h2>

          <div className='grid grid-cols-2 gap-2'>
            {payoffStrategies.map((strategy, key) => {
              return (
                <div className='card cursor-pointer flex-col items-start h-36'>
                  <p className='text-lg mb-4'>{strategy.icon}</p>
                  <h3 className='mb-1'>{strategy.name}</h3>
                  <p className='text-description'>{strategy.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        <hr className='h-px bg-zinc-600/10' />
      </div>

      <div className='p-8 flex flex-col'>totals</div>
    </div>
  )
}

export default Create
