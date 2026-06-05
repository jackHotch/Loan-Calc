'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { LoanDb, PerLoan, Simulation } from '@/constants/schema'
import { LoanScheduleEntry } from '@/lib/api/loans'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { ToolTip } from './tooltip'
import { LINE_COLORS } from '@/constants/constants'

function buildScheduleSeries(
  entries: LoanScheduleEntry[],
): { date: string; remaining: number }[] {
  return entries.map((e) => ({
    date: format(new Date(e.payment_date), 'yyyy-MM'),
    remaining: Number(e.remaining_principal),
  }))
}

function buildSimulationChartData(
  simulation: Simulation,
  perLoan: PerLoan[],
  loanSchedules?: LoanScheduleEntry[],
): { data: Record<string, number | string>[]; loanNames: string[] } {
  const nameMap = new Map(perLoan.map((pl) => [String(pl.loan_id), pl.name ?? `Loan ${pl.loan_id}`]))
  const dateMap = new Map<string, Record<string, number | string>>()

  // Index actual history from real loan schedules, keyed by loan_id → date → remaining
  const actualByLoan = new Map<string, Map<string, number>>()
  for (const entry of loanSchedules ?? []) {
    if (!entry.is_actual) continue
    const loanKey = String(entry.loan_id)
    if (!actualByLoan.has(loanKey)) actualByLoan.set(loanKey, new Map())
    const dateKey = format(new Date(entry.payment_date), 'yyyy-MM')
    actualByLoan.get(loanKey)!.set(dateKey, Number(entry.remaining_principal))
  }

  for (const simLoan of simulation.loans) {
    const loanName = nameMap.get(String(simLoan.loan_id)) ?? `Loan ${simLoan.loan_id}`
    const actualDates = actualByLoan.get(String(simLoan.loan_id)) ?? new Map<string, number>()

    // Plot actual payment history first
    for (const [dateKey, remaining] of actualDates) {
      if (!dateMap.has(dateKey)) dateMap.set(dateKey, { date: dateKey })
      dateMap.get(dateKey)![loanName] = remaining
    }

    // Plot simulation projected entries, skipping months already covered by actuals
    for (const entry of simLoan.payment_schedule ?? []) {
      const dateKey = format(new Date(entry.payment_date), 'yyyy-MM')
      if (actualDates.has(dateKey)) continue
      if (!dateMap.has(dateKey)) dateMap.set(dateKey, { date: dateKey })
      dateMap.get(dateKey)![loanName] = entry.remaining_principal
    }
  }

  const loanNames = perLoan.map((pl) => pl.name ?? `Loan ${pl.loan_id}`)

  return {
    data: Array.from(dateMap.keys())
      .sort()
      .map((k) => dateMap.get(k)!),
    loanNames,
  }
}

export function LoanProgressChart({
  loans,
  loanSchedules,
  simulation,
  simulationPerLoan,
}: {
  loans: LoanDb[]
  loanSchedules?: LoanScheduleEntry[]
  simulation?: Simulation
  simulationPerLoan?: PerLoan[]
}) {
  const isSimulated = !!(simulation && simulationPerLoan?.length)

  const activeLoans = useMemo(() => loans?.filter((l) => l.current_principal > 0.01) ?? [], [loans])

  const { chartData, chartConfig, tickDates, todayKey } = useMemo(() => {
    let sortedData: Record<string, number | string>[] = []
    let loanNames: string[] = []

    if (isSimulated) {
      const built = buildSimulationChartData(simulation, simulationPerLoan, loanSchedules)
      sortedData = built.data
      loanNames = built.loanNames
    } else {
      const dateMap = new Map<string, Record<string, number | string>>()
      const schedulesByLoanId = new Map<string, LoanScheduleEntry[]>()
      for (const entry of loanSchedules ?? []) {
        const key = String(entry.loan_id)
        if (!schedulesByLoanId.has(key)) schedulesByLoanId.set(key, [])
        schedulesByLoanId.get(key)!.push(entry)
      }
      for (const loan of activeLoans) {
        const entries = schedulesByLoanId.get(String(loan.id)) ?? []
        const series = buildScheduleSeries(entries)
        for (const { date, remaining } of series) {
          if (!dateMap.has(date)) dateMap.set(date, { date })
          dateMap.get(date)![loan.name] = remaining
        }
      }
      sortedData = Array.from(dateMap.keys())
        .sort()
        .map((key) => dateMap.get(key)!)
      loanNames = activeLoans.map((l) => l.name)
    }

    const config = loanNames.reduce<ChartConfig>((acc, name) => {
      acc[name] = { label: name }
      return acc
    }, {})

    const ticks = sortedData.map((d) => d.date as string).filter((_, i) => i % 6 === 0)

    return {
      chartData: sortedData,
      chartConfig: config,
      tickDates: ticks,
      todayKey: format(new Date(), 'yyyy-MM'),
      loanNames,
    }
  }, [isSimulated, simulation, simulationPerLoan, activeLoans, loanSchedules])

  const loanNames = isSimulated
    ? (simulationPerLoan?.map((pl) => pl.name ?? `Loan ${pl.loan_id}`) ?? [])
    : activeLoans.map((l) => l.name)

  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltipActive, setTooltipActive] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTooltipActive(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [])

  if (!loanNames.length) {
    return (
      <Card className='flex flex-1 items-center justify-center'>
        <p className='text-muted-foreground text-sm'>No active loans</p>
      </Card>
    )
  }

  return (
    <Card className='flex flex-1 flex-col rounded-none'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base font-medium'>
          Loan Payoff Projection{isSimulated ? ' (Simulated)' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className='flex min-h-0 flex-1 flex-col p-4 pt-0'>
        <div
          ref={containerRef}
          className='flex min-h-0 flex-1 flex-col'
          onMouseEnter={() => setTooltipActive(undefined)}
          onTouchStart={() => setTooltipActive(undefined)}
        >
          <ChartContainer config={chartConfig} className='aspect-auto h-full w-full'>
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.3} />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                ticks={tickDates}
                tickFormatter={(value) => {
                  const [year, month] = String(value).split('-')
                  const date = new Date(parseInt(year), parseInt(month) - 1)
                  if (isNaN(date.getTime())) return ''
                  return format(date, "MMM ''yy")
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={56}
                tickFormatter={(value: number) => (value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`)}
              />
              <ReferenceLine
                x={todayKey}
                stroke='var(--muted-foreground)'
                strokeDasharray='4 4'
                strokeOpacity={0.6}
                label={{
                  value: 'Today',
                  fill: 'var(--muted-foreground)',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
              <ChartTooltip active={tooltipActive} content={(props) => <ToolTip {...props} />} />
              {loanNames.map((name, i) => (
                <Line
                  key={name}
                  type='monotone'
                  dataKey={name}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ChartContainer>
          <div className='flex flex-wrap gap-x-4 gap-y-1.5 pt-2'>
            {loanNames.map((name, i) => (
              <div key={name} className='flex items-center gap-1.5'>
                <div className='h-2 w-2 shrink-0 rounded-[2px]' style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }} />
                <span className='text-xs text-muted-foreground'>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
