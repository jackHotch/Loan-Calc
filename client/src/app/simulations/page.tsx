'use client'

import { Button } from '@/components/ui/button'
import { payoffStrategies, strategyColors } from '@/constants/constants'
import { StrategyType } from '@/constants/schema'
import { useAllSimulationSummaries } from '@/lib/api/simulations'
import { formatCurrency } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Simulations() {
  const router = useRouter()
  const { data: simulations } = useAllSimulationSummaries()
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'avalanche', label: StrategyType.AVALANCHE },
    { id: 'snowball', label: StrategyType.SNOWBALL },
    { id: 'avalanche-interest', label: StrategyType.AVALANCHE_INTEREST_FOCUSED },
    { id: 'snowball-interest', label: StrategyType.SNOWBALL_INTEREST_FOCUSED },
  ]

  const [filter, setFilter] = useState('all')

  return (
    <div className='p-8 flex flex-col gap-8'>
      <header className='w-full flex justify-between items-end'>
        <div className='flex flex-col gap-2'>
          <p className='text-label mb-4'>All Simulations</p>
          <h1 className='font-display text-5xl font-light'>Simulations</h1>
          <p className='text-description'>{simulations?.length} saved</p>
        </div>

        <div className='w-max'>
          <Button className='w-fit px-8 py-5' onClick={() => router.push('/simulations/create')}>
            <Plus />
            <span className='hidden md:inline text-xs tracking-widest uppercase'>New Simulation</span>
          </Button>
        </div>
      </header>

      <div className='flex gap-4 border-b border-b-muted-foreground/50 mt-8'>
        {filters.map((f, key) => {
          const styles =
            f.id === filter
              ? 'text-primary border-b-2 border-b-primary hover:text-primary'
              : 'text-muted-foreground/50 hover:text-muted-foreground'
          return (
            <Button
              key={key}
              variant='ghost'
              className={`uppercase tracking-widest text-xs ${styles}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </Button>
          )
        })}
      </div>

      <div className='flex flex-col gap-4'>
        {simulations?.map((sim, key) => {
          return (
            <div key={key}>
              <div className='card flex-col gap-2'>
                <div className='w-full flex justify-between'>
                  <span
                    className={`${strategyColors[sim.simulation.strategy_type]} border flex justify-center items-center gap-2 text-[10px] h-fit py-1 px-2 uppercase tracking-widest`}
                  >
                    {payoffStrategies.find((s) => s.name === sim?.simulation?.strategy_type)?.icon}
                    {sim.simulation.strategy_type}
                  </span>

                  <div>
                    <div>{formatCurrency(sim.savings.interest_saved)}</div>
                    <div className='text-description'>interest saved</div>
                  </div>
                </div>

                <div className='w-full flex justify-between'>
                  <div>
                    <p className='font-display text-2xl'>{sim.simulation.name}</p>
                    <p className='text-description'>{sim.simulation.description}</p>
                  </div>

                  <div className='flex gap-2'>
                    <Button variant='outline' className='uppercase text-xs'>
                      Set Active
                    </Button>
                    <Button variant='outline' className='uppercase text-xs'>
                      Edit
                    </Button>
                    <Button variant='outline' className='uppercase text-xs'>
                      Delete
                    </Button>
                  </div>
                </div>

                <div className='flex gap-2 w-full text-xs mt-4'>
                  {sim.perLoan.map((loan, key) => {
                    return (
                      <span key={key} className='card py-1 px-2 text-muted-foreground'>
                        {loan.name}
                      </span>
                    )
                  })}
                </div>

                <div className='text-description w-full mt-1s'>
                  Created{' '}
                  {new Date(sim.simulation.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>

              <div className='card w-full h-8'>bottom</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
