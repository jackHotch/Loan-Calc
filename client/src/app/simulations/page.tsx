'use client'

import { Button } from '@/components/ui/button'
import { StrategyType } from '@/constants/schema'
import { useAllSimulations } from '@/lib/api/simulations'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Simulations() {
  const router = useRouter()
  const { data: simulations } = useAllSimulations()
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
        {simulations?.map((simulation, key) => {
          return (
            <div>
              <div className='card'>
                <div>
                  <span>{simulation.strategy_type}</span>
                  <div></div>
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
