'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLoans } from '@/lib/api/loans'
import { formatCurrency } from '@/lib/utils'
import { payoffStrategies } from '@/constants/constants'
import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

function Create() {
  const { data: loans } = useLoans()
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [selectedLoans, setSelectedLoans] = useState<Set<BigInt>>(new Set(loans?.map((l) => l.id)))
  const [strategy, setStrategy] = useState('Avalanche')
  const [extraPayment, setExtraPayment] = useState<number>(100)
  const [cascade, setCascade] = useState<boolean>(false)

  function toggleSelected(id: BigInt) {
    setSelectedLoans((prev) => {
      const currentLoans = new Set(prev)
      currentLoans.has(id) ? currentLoans.delete(id) : currentLoans.add(id)
      return currentLoans
    })
  }

  function addToExtraPayment(num: number) {
    setExtraPayment((prev) => prev + num)
  }

  const selected = loans?.filter((l) => selectedLoans.has(l.id))
  const totalBalance = selected?.reduce((s, l) => s + Number(l.current_principal), 0)
  const totalMinPayment = selected?.reduce((s, l) => s + Number(l.minimum_payment), 0)
  const payoffOrder = strategy.includes('Interest')
    ? strategy.includes('Avalanche')
      ? selected?.sort((a, b) => b.interest_rate - a.interest_rate)
      : selected?.sort((a, b) => a.interest_rate - b.interest_rate)
    : strategy.includes('Avalanche')
      ? selected?.sort((a, b) => b.current_principal - a.current_principal)
      : selected?.sort((a, b) => a.current_principal - b.current_principal)

  return (
    <div className='grid g-0 grid-cols-[1fr_380px] lg:grid-cols-[1fr_400px] h-min-[calc(100vh - 40px)'>
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
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='e.g. Salary Raise 2025' />
          </div>
          <div>
            <div className='flex flex-col gap-2'>
              <Label className='text-label text-xs'>Description (Optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className='resize-y'
                placeholder='Notes about the simulation...'
              />
            </div>
          </div>
        </div>

        <hr className='h-px bg-zinc-600/10' />

        <div className='flex flex-col gap-2'>
          <h2 className='font-display text-2xl mb-4'>Select loans to include</h2>

          {loans?.map((loan, key) => {
            const isSelected = selectedLoans.has(loan.id)
            const containerSelectedStyles = isSelected ? 'border-primary/35 bg-primary/2' : 'hover:bg-secondary/60'
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
            {selectedLoans.size} of {loans?.length} loans selected · {formatCurrency(totalBalance)} total ·{' '}
            {formatCurrency(totalMinPayment)} /mo minimum
          </p>
        </div>

        <hr className='h-px bg-zinc-600/10' />

        <div>
          <h2 className='font-display text-2xl mb-6'>Choose your payoff strategy</h2>

          <div className='grid grid-cols-2 gap-2'>
            {payoffStrategies.map((s, key) => {
              const selectedStyles =
                strategy === s.name ? 'border-2 border-primary/80 bg-primary/4' : 'hover:border-zinc-600'
              return (
                <div
                  key={key}
                  className={`${selectedStyles} card cursor-pointer flex-col items-start h-36`}
                  onClick={() => setStrategy(s.name)}
                >
                  <p className='text-lg mb-4'>{s.icon}</p>
                  <h3 className='mb-1'>{s.name}</h3>
                  <p className='text-description'>{s.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        <hr className='h-px bg-zinc-600/10' />

        <div>
          <h2 className='font-display text-2xl mb-6'>Extra monthly payment</h2>

          <div className='flex flex-col gap-2'>
            <div className='card justify-between items-center'>
              <div className='flex flex-col'>
                <p className='text-sm text-zinc-400'>Additional amount on top of minimum</p>
                <p className='text-description'>Total monthly: {formatCurrency(totalMinPayment + extraPayment)}</p>
              </div>

              <div className='flex gap-6 items-center'>
                <button
                  onClick={() => addToExtraPayment(-25)}
                  className='flex justify-center items-center bg-secondary cursor-pointer rounded-full w-4 h-4 border p-4'
                >
                  -
                </button>
                <div className='text-primary'>{formatCurrency(extraPayment)}</div>
                <button
                  onClick={() => addToExtraPayment(25)}
                  className='flex justify-center items-center bg-secondary cursor-pointer rounded-full w-4 h-4 border p-4'
                >
                  +
                </button>
              </div>
            </div>

            <div
              onClick={() => setCascade((prev) => !prev)}
              className={`${cascade ? 'border-primary/35 bg-primary/2' : 'hover:border-zinc-700'} card cursor-pointer gap-4`}
            >
              <Switch checked={cascade} className='pointer-events-none' />
              <div>
                <p className='text-sm'>Roll over freed payments</p>
                <p className='text-description'>
                  When a loan is payed off, redirect its freed minimum payment as extra payment towards the next loan in
                  your strategy order
                </p>
              </div>
            </div>

            {selected?.length > 0 && (
              <div className='mt-4 flex flex-col'>
                <p className='text-label mb-4'>Extra Payment Order</p>
                <div className='flex flex-col gap-2'>
                  {payoffOrder?.map((loan, key) => {
                    return (
                      <div key={key} className='flex items-center gap-4 border-l-2 px-4 py-2 border-zinc-600'>
                        <div className='flex items-center justify-center bg-secondary text-xs text-primary w-6 h-6 rounded-full'>
                          {key + 1}
                        </div>
                        <div className='flex flex-1 justify-between'>
                          <p className='text-sm text-zinc-400'>{loan.name}</p>
                          {strategy.includes('Interest') ? (
                            <p className='text-sm text-zinc-400'>{loan.interest_rate}% APR</p>
                          ) : (
                            <p className='text-sm text-zinc-400'>{formatCurrency(loan.current_principal)}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <Button disabled={name && description && selected ? false : true} className='w-fit px-8 py-5'>
          <span className='hidden md:inline text-xs tracking-widest uppercase'>Run Simulation</span>
          <ArrowRight />
        </Button>
      </div>

      <div className='p-8 flex flex-col'>totals</div>
    </div>
  )
}

export default Create
