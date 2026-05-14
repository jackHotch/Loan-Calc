'use client'

import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Seperator } from '../seperator'
import { useLoanProgress } from '@/lib/api/loans'
import { formatCurrency, formatDate } from '@/lib/utils'

export const Summary = () => {
  const { data: currentLoanProgress } = useLoanProgress()

  const totalDebt = currentLoanProgress?.summary.total_paid + currentLoanProgress?.summary.total_remaining
  const paidOff = currentLoanProgress?.summary.total_paid
  const remaining = currentLoanProgress?.summary.total_remaining
  const percentPaid = (paidOff / totalDebt) * 100
  const percentChange = currentLoanProgress?.summary.monthly_pct_change
  const monthsTilPayoff = currentLoanProgress?.summary.months_to_payoff
  const payoffDate = currentLoanProgress?.summary.payoff_date
  const numberOfLoans = currentLoanProgress?.summary.active_loans
  const nextMonthlyPayment = currentLoanProgress?.summary.next_monthly_payment

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-medium'>Current Progress</CardTitle>
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
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-xs'>{percentPaid?.toFixed(1)}% of total debt paid off</span>
            <span className='text-muted-foreground text-xs'>Payoff on {formatDate(new Date(payoffDate))}</span>
          </div>
        </div>

        <Seperator />

        <div className='pt-3'>
          <div className='grid grid-cols-3 gap-3 text-center'>
            <div className='rounded-lg bg-muted/50 p-2'>
              <p className='text-muted-foreground text-xs'>Active Loans</p>
              <p className='text-xl font-bold'>{numberOfLoans}</p>
            </div>
            <div className='rounded-lg bg-muted/50 p-2'>
              <p className='text-muted-foreground text-xs'>Months til Payoff</p>
              <p className='text-xl font-bold'>{monthsTilPayoff}</p>
            </div>
            <div className='rounded-lg bg-muted/50 p-2'>
              <p className='text-muted-foreground text-xs'>Next Payment</p>
              <p className='text-xl font-bold'>{formatCurrency(nextMonthlyPayment)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
