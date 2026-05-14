'use client'

import { useMemo } from 'react'
import { addMonths, format, startOfMonth } from 'date-fns'
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { LoanDb } from '@/constants/schema'
import { useLoans } from '@/lib/api/loans'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip } from '@/components/ui/chart'
import { ToolTip } from './tooltip'
import { LINE_COLORS } from '@/constants/constants'

function buildAmortizationSeries(loan: LoanDb): { date: string; remaining: number }[] {
  const monthlyRate = Number(loan.interest_rate) / 100 / 12
  const minimumPayment = Number(loan.minimum_payment)
  const points: { date: string; remaining: number }[] = []

  let remaining = Number(loan.starting_principal)
  let current = startOfMonth(new Date(loan.start_date))
  const extraStartDate = loan.extra_payment_start_date
    ? new Date(loan.extra_payment_start_date as unknown as string)
    : null

  let iterations = 0
  while (remaining > 0.01 && iterations < 600) {
    iterations++
    points.push({ date: format(current, 'yyyy-MM'), remaining: Math.round(remaining * 100) / 100 })

    const interest = remaining * monthlyRate
    const extra =
      loan.extra_payment != null && extraStartDate != null && current >= extraStartDate ? Number(loan.extra_payment) : 0
    const principalPaid = minimumPayment + extra - interest

    if (principalPaid <= 0) break
    remaining = Math.max(0, remaining - principalPaid)
    current = addMonths(current, 1)
  }

  return points
}

export function LoanProgressChart({ loans }: { loans: LoanDb[] }) {
  const activeLoans = useMemo(() => loans?.filter((l) => l.current_principal > 0.01) ?? [], [loans])

  const { chartData, chartConfig, tickDates, todayKey } = useMemo(() => {
    const dateMap = new Map<string, Record<string, number | string>>()

    for (const loan of activeLoans) {
      const series = buildAmortizationSeries(loan)
      for (const { date, remaining } of series) {
        if (!dateMap.has(date)) dateMap.set(date, { date })
        dateMap.get(date)![loan.name] = remaining
      }
    }

    const sortedData = Array.from(dateMap.keys())
      .sort()
      .map((key) => dateMap.get(key)!)

    const config = activeLoans.reduce<ChartConfig>((acc, loan) => {
      acc[loan.name] = { label: loan.name }
      return acc
    }, {})

    const ticks = sortedData.map((d) => d.date as string).filter((_, i) => i % 6 === 0)

    return {
      chartData: sortedData,
      chartConfig: config,
      tickDates: ticks,
      todayKey: format(new Date(), 'yyyy-MM'),
    }
  }, [activeLoans])

  if (!activeLoans.length) {
    return (
      <Card className='flex flex-1 items-center justify-center'>
        <p className='text-muted-foreground text-sm'>No active loans</p>
      </Card>
    )
  }

  return (
    <Card className='flex flex-1 flex-col'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base font-medium'>Loan Payoff Projection</CardTitle>
      </CardHeader>
      <CardContent className='flex min-h-0 flex-1 flex-col p-4 pt-0'>
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
            <ChartTooltip content={(props) => <ToolTip {...props} />} />
            {activeLoans.map((loan, i) => (
              <Line
                key={loan.name}
                type='monotone'
                dataKey={loan.name}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
