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
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

function OverviewSkeleton() {
  return (
    <div className='flex flex-col gap-4 p-6 md:overflow-hidden md:h-[calc(100svh-var(--header-height))]'>
      {/* Summary skeleton */}
      <Card className='rounded-none'>
        <CardHeader>
          <Skeleton className='h-5 w-36' />
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-end justify-between'>
            <Skeleton className='h-9 w-40' />
            <Skeleton className='h-7 w-28' />
          </div>
          <Skeleton className='h-2 w-full' />
          <div className='grid grid-cols-2 gap-2 pt-2 md:grid-cols-3'>
            <Skeleton className='h-14 rounded-lg' />
            <Skeleton className='h-14 rounded-lg' />
            <Skeleton className='hidden h-14 rounded-lg md:block' />
          </div>
        </CardContent>
      </Card>

      {/* Chart + breakdown skeleton */}
      <div className='flex flex-col gap-4 md:flex-row md:flex-1 md:min-h-0'>
        <Card className='flex flex-col rounded-none md:flex-65 md:min-h-0'>
          <CardHeader>
            <Skeleton className='h-5 w-52' />
          </CardHeader>
          <CardContent className='flex flex-1 flex-col'>
            <Skeleton className='h-56 w-full md:flex-1' />
          </CardContent>
        </Card>
        <Card className='flex flex-col rounded-none md:flex-35 md:min-h-0'>
          <CardHeader>
            <Skeleton className='h-5 w-44' />
          </CardHeader>
          <CardContent className='flex flex-col gap-6'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='space-y-2'>
                <div className='flex justify-between'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-4 w-16' />
                </div>
                <Skeleton className='h-7 w-28 self-end ml-auto' />
                <Skeleton className='h-2 w-full' />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Overview() {
  const { data: loans, isLoading: loansLoading } = useLoans()
  const { data: loanSchedules, isLoading: schedulesLoading } = useLoanSchedules()
  const { data: activeSimInfo, isLoading: simInfoLoading } = useActiveSimulation()
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

  if (loansLoading || schedulesLoading || simInfoLoading) {
    return <OverviewSkeleton />
  }

  return (
    <div className='flex flex-col gap-4 p-6 md:overflow-hidden md:h-[calc(100svh-var(--header-height))]'>
      <Summary activeSim={activeSummary} simulation={activeSimDetail} />
      <div className='flex flex-col gap-4 md:flex-row md:flex-1 md:min-h-0'>
        <div className='flex flex-col md:flex-65 md:min-h-0 md:min-w-0'>
          <LoanProgressChart
            loans={loans}
            loanSchedules={loanSchedules}
            simulation={activeSimDetail}
            simulationPerLoan={activeSummary?.perLoan}
          />
        </div>
        <div className='flex flex-col md:flex-35 md:min-h-0 md:min-w-0'>
          <PaymentBreakdown loans={loans} simulation={activeSimDetail} />
        </div>
      </div>
    </div>
  )
}

export default Overview
