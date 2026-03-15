'use client'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { payoffStrategies, strategyColors } from '@/constants/constants'
import { StrategyType } from '@/constants/schema'
import {
  useActiveSimulation,
  useAllSimulationSummaries,
  useDeleteSimulation,
  useSetActiveSimulation,
} from '@/lib/api/simulations'
import { cn, formatCurrency } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Simulations() {
  const router = useRouter()
  const { data: simulations } = useAllSimulationSummaries()
  const filters = [
    'All',
    StrategyType.AVALANCHE,
    StrategyType.SNOWBALL,
    StrategyType.AVALANCHE_INTEREST_FOCUSED,
    StrategyType.SNOWBALL_INTEREST_FOCUSED,
  ]
  const { data: activeSimulation } = useActiveSimulation()
  const setActiveSimulation = useSetActiveSimulation()
  const deleteSimulation = useDeleteSimulation()

  const [filter, setFilter] = useState('All')
  const sortedSimulations = simulations
    ?.slice()
    .sort((a, b) => new Date(b.simulation.created_at).getTime() - new Date(a.simulation.created_at).getTime())
  const filteredSimulations =
    filter === 'All' ? sortedSimulations : sortedSimulations.filter((s) => s.simulation.strategy_type === filter)

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
            f === filter
              ? 'text-primary border-b-2 border-b-primary hover:text-primary'
              : 'text-muted-foreground/50 hover:text-muted-foreground'
          return (
            <Button
              key={key}
              variant='ghost'
              className={`uppercase tracking-widest text-xs ${styles}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          )
        })}
      </div>

      <div className='flex flex-col gap-4'>
        {filteredSimulations?.map((sim, key) => {
          const isActiveSimulation = activeSimulation?.active_simulation_id == sim.simulation.id
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

                  <div className='flex gap-8'>
                    <div>
                      <div className='text-primary'>{formatCurrency(sim.savings.interest_saved)}</div>
                      <div className='text-description'>interest saved</div>
                    </div>

                    <div>
                      <div className='text-primary'>{sim.savings.months_saved} mo</div>
                      <div className='text-description'>months saved</div>
                    </div>

                    <div>
                      <div>{sim.totals.months_til_payoff} mo</div>
                      <div className='text-description'>til payoff</div>
                    </div>

                    <div>
                      <div>+{formatCurrency(sim.totals.active_extra_payment, 0)}</div>
                      <div className='text-description'>extra/mo</div>
                    </div>
                  </div>
                </div>

                <div className='w-full flex justify-between items-center'>
                  <div>
                    <p className='font-display text-2xl'>{sim.simulation.name}</p>
                    <p className='text-description'>{sim.simulation.description}</p>
                  </div>

                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      onClick={() => (!isActiveSimulation ? setActiveSimulation.mutateAsync(sim.simulation.id) : null)}
                      className={cn(
                        'uppercase text-xs',
                        isActiveSimulation
                          ? 'border-primary text-primary bg-primary/8 hover:bg-primary/8 hover:border-primary hover:text-primary cursor-default'
                          : ' hover:text-primary',
                      )}
                    >
                      {isActiveSimulation ? 'Active' : 'Set Active'}
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => router.push(`/simulations/create?id=${sim.simulation.id}`)}
                      className='uppercase text-xs hover:text-primary'
                    >
                      Edit
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => deleteSimulation.mutateAsync(sim.simulation.id)}
                      className='uppercase text-xs hover:text-red-500/60 hover:border-red-500/60'
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className='flex gap-2 w-full text-xs mt-4'>
                  {sim.perLoan.map((loan, key) => {
                    return (
                      <span key={key} className='card py-1 px-2 text-muted-foreground/50'>
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

              <div className='card flex-col gap-2'>
                <Progress
                  value={
                    (sim.totals.total_interest_paid / (sim.savings.interest_saved + sim.totals.total_interest_paid)) *
                    100
                  }
                  className='h-1'
                />
                <div className='flex w-full justify-between items-center'>
                  <span className='text-description'>interest reduction</span>
                  <span className='text-description'>
                    {(
                      (sim.totals.total_interest_paid / (sim.savings.interest_saved + sim.totals.total_interest_paid)) *
                      100
                    ).toFixed(1)}
                    % reduction
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
