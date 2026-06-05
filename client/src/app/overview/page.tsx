'use client'

import { useEffect, useMemo } from 'react'
import { Summary } from '@/components/overview/summary'
import { LoanProgressChart } from '@/components/loan-progress-chart'
import { PaymentBreakdown } from '@/components/overview/payment-breakdown'
import { useLoanSchedules, useLoans } from '@/lib/api/loans'
import {
  useActiveSimulation,
  useAllSimulationSummaries,
  useSimulation,
  useSyncActiveSimulation,
} from '@/lib/api/simulations'

function Overview() {
  const { data: loans } = useLoans()
  const { data: loanSchedules } = useLoanSchedules()
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
    <div className='flex flex-col gap-4 p-4 lg:overflow-hidden lg:p-6 lg:h-[calc(100svh-var(--header-height))]'>
      <Summary activeSim={activeSummary} />
      <div className='flex flex-col gap-4 lg:flex-row lg:min-h-0 lg:flex-1'>
        <div className='flex flex-col h-72 lg:h-auto lg:flex-65 lg:min-h-0'>
          <LoanProgressChart
            loans={loans}
            loanSchedules={loanSchedules}
            simulation={activeSimDetail}
            simulationPerLoan={activeSummary?.perLoan}
          />
        </div>
        <div className='flex flex-col lg:flex-35 lg:min-h-0 lg:min-w-0'>
          <PaymentBreakdown loans={loans} />
        </div>
      </div>
    </div>
  )
}

export default Overview
