'use client'

import { useEffect, useMemo } from 'react'
import { Summary } from '@/components/overview/summary'
import { LoanProgressChart } from '@/components/loan-progress-chart'
import { PaymentBreakdown } from '@/components/overview/payment-breakdown'
import { useLoans } from '@/lib/api/loans'
import {
  useActiveSimulation,
  useAllSimulationSummaries,
  useSimulation,
  useSyncActiveSimulation,
} from '@/lib/api/simulations'

function Overview() {
  const { data: loans } = useLoans()
  const { data: activeSimInfo } = useActiveSimulation()
  const { data: summaries } = useAllSimulationSummaries()
  const syncSimulation = useSyncActiveSimulation()

  const activeSimId = activeSimInfo?.active_simulation_id ?? null

  const activeSummary = useMemo(
    () => summaries?.find((s) => s.simulation.id === activeSimId) ?? null,
    [summaries, activeSimId],
  )

  const { data: activeSimDetail } = useSimulation(activeSimId)

  useEffect(() => {
    if (activeSimId) {
      syncSimulation.mutate()
    }
    // Only run on mount or when the active sim changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSimId])

  return (
    <div className='flex flex-col gap-4 overflow-hidden p-6' style={{ height: 'calc(100svh - var(--header-height))' }}>
      <Summary activeSim={activeSummary} />
      <div className='flex min-h-0 flex-1 gap-4'>
        <div className='flex-65 flex min-h-0 min-w-0 flex-col'>
          <LoanProgressChart
            loans={loans}
            simulation={activeSimDetail}
            simulationPerLoan={activeSummary?.perLoan}
          />
        </div>
        <div className='flex-35 flex min-h-0 min-w-0 flex-col'>
          <PaymentBreakdown loans={loans} />
        </div>
      </div>
    </div>
  )
}

export default Overview
