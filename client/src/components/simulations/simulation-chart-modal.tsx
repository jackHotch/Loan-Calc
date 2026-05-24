'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { LineChart as LineChartIcon } from 'lucide-react'
import { Simulation, LoanDb } from '@/constants/schema'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip } from '@/components/ui/chart'
import { ToolTip } from '../tooltip'
import { LINE_COLORS } from '@/constants/constants'

type Props = {
  simulation: Simulation
  loans: LoanDb[]
}

export function SimulationChartModal({ simulation, loans }: Props) {
  const [open, setOpen] = useState(false)

  const { chartData, chartConfig, loanNames, tickDates, todayKey } = useMemo(() => {
    const nameMap = new Map(loans.map((l) => [Number(l.id), l.name]))
    const dateMap = new Map<string, Record<string, number | string>>()
    const names: string[] = []

    for (const simLoan of simulation.loans) {
      const name = nameMap.get(simLoan.loan_id) ?? String(simLoan.loan_id)
      if (!names.includes(name)) names.push(name)

      for (const entry of simLoan.payment_schedule) {
        const date = format(new Date(entry.payment_date), 'yyyy-MM')
        if (!dateMap.has(date)) dateMap.set(date, { date })
        dateMap.get(date)![name] = entry.remaining_principal
      }
    }

    const sortedData = Array.from(dateMap.keys())
      .sort()
      .map((key) => dateMap.get(key)!)

    const config = names.reduce<ChartConfig>((acc, name) => {
      acc[name] = { label: name }
      return acc
    }, {})

    const ticks = sortedData.map((d) => d.date as string).filter((_, i) => i % 6 === 0)

    return {
      chartData: sortedData,
      chartConfig: config,
      loanNames: names,
      tickDates: ticks,
      todayKey: format(new Date(), 'yyyy-MM'),
    }
  }, [simulation, loans])

  return (
    <Drawer open={open} onOpenChange={setOpen} direction='bottom'>
      <DrawerTrigger asChild>
        <Button variant='outline' className='w-full'>
          <LineChartIcon className='mr-2 h-4 w-4' />
          View Chart
        </Button>
      </DrawerTrigger>
      <DrawerContent className='flex flex-col px-4 pb-4' style={{ height: '90vh', maxHeight: '90vh' }}>
        <DrawerHeader className='pb-2 shrink-0'>
          <DrawerTitle>Loan Payoff Projection — {simulation.name}</DrawerTitle>
        </DrawerHeader>
        <div className='flex-1 min-h-0'>
          <ChartContainer config={chartConfig} className='aspect-auto h-full w-full'>
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
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
              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          </ChartContainer>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
