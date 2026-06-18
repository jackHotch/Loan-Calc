'use client'

import { useMemo } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Seperator } from '../seperator'
import { useLoanProgress, useLoans } from '@/lib/api/loans'
import { Simulation, SimulationSummary } from '@/constants/schema'
import { formatCurrency, formatDate } from '@/lib/utils'

export const Summary = ({
  activeSim,
  simulation,
}: {
  activeSim?: SimulationSummary | null
  simulation?: Simulation | null
}) => {
  const { data: currentLoanProgress } = useLoanProgress()
  const { data: loans } = useLoans()

  const totalDebt = currentLoanProgress?.summary.total_paid + currentLoanProgress?.summary.total_remaining
  const paidOff = currentLoanProgress?.summary.total_paid
  const remaining = currentLoanProgress?.summary.total_remaining
  const percentPaid = (paidOff / totalDebt) * 100
  const percentChange = currentLoanProgress?.summary.monthly_pct_change
  const numberOfLoans = currentLoanProgress?.summary.active_loans
  const nextMonthlyPayment = currentLoanProgress?.summary.next_monthly_payment

  // When a simulation is active, use its projected payoff stats
  const monthsTilPayoff = activeSim?.totals.months_til_payoff ?? currentLoanProgress?.summary.months_to_payoff
  const payoffDate = activeSim?.totals.payoff_date ?? currentLoanProgress?.summary.payoff_date

  const simNextPayment = useMemo(() => {
    if (!simulation?.lump_sum_payments?.length || !loans) return nextMonthlyPayment
    const today = new Date()
    const activeLoans = loans.filter((l) => l.current_principal > 0.01)
    const maxNextDate = activeLoans.reduce((max, loan) => {
      const d = new Date(today.getFullYear(), today.getMonth(), loan.payment_day_of_month)
      if (d <= today) d.setMonth(d.getMonth() + 1)
      return d > max ? d : max
    }, today)
    const lumpTotal = simulation.lump_sum_payments
      .filter((lsp) => {
        const d = new Date(lsp.date as unknown as string)
        return d > today && d <= maxNextDate
      })
      .reduce((sum, lsp) => sum + lsp.amount, 0)
    return (nextMonthlyPayment ?? 0) + lumpTotal
  }, [simulation, loans, nextMonthlyPayment])

  const displayNextPayment = simulation ? simNextPayment : nextMonthlyPayment

  return (
    <Card className='rounded-none'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='flex flex-col gap-1'>
            <CardTitle className='text-base font-medium'>Current Progress</CardTitle>
            {activeSim && (
              <div className='flex items-center gap-1.5 text-xs text-primary'>
                <span className='inline-block h-1.5 w-1.5 rounded-full bg-primary' />
                Active Simulation: <span className='font-medium'>{activeSim.simulation.name}</span>
              </div>
            )}
          </div>
          <Badge className={percentChange >= 0 && 'bg-red-500/70'}>
            {percentChange >= 0 ? <TrendingUp data-icon='inline-start' /> : <TrendingDown data-icon='inline-start' />}
            {percentChange}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-1'>
        <div className='space-y-2'>
          <div className='flex items-end justify-between'>
            <div>
              <p className='text-muted-foreground text-xs'>Total Paid</p>
              <p className='text-2xl font-bold @[200px]:text-3xl'>${paidOff?.toLocaleString()}</p>
            </div>
            <div className='text-right'>
              <p className='text-muted-foreground text-xs'>Remaining</p>
              <p className='text-lg font-semibold @[200px]:text-xl'>${remaining?.toLocaleString()}</p>
            </div>
          </div>
          <Progress value={percentPaid} className='h-2' />
          <div className='flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between'>
            <span className='text-muted-foreground text-xs'>{percentPaid?.toFixed(1)}% of total debt paid off</span>
            <span className='text-muted-foreground text-xs'>
              {activeSim ? 'Simulated payoff' : 'Payoff'} on {formatDate(new Date(payoffDate))}
            </span>
          </div>
        </div>

        <Seperator />

        <div className='pt-3'>
          <div className='grid grid-cols-3 gap-2 text-center'>
            <div className='rounded-lg bg-muted/50 p-2'>
              <p className='text-muted-foreground text-[10px] sm:text-xs truncate'>Active Loans</p>
              <p className='text-lg sm:text-xl font-bold'>{numberOfLoans}</p>
            </div>
            <div className='rounded-lg bg-muted/50 p-2'>
              <p className='text-muted-foreground text-[10px] sm:text-xs truncate'>
                {activeSim ? 'Sim Months' : 'Months til Payoff'}
              </p>
              <p className='text-lg sm:text-xl font-bold'>{monthsTilPayoff}</p>
            </div>
            <div className='rounded-lg bg-muted/50 p-2'>
              <p className='text-muted-foreground text-xs'>Next Payment</p>
              <p className='text-xl font-bold'>{formatCurrency(displayNextPayment)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
