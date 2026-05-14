'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { useLoans } from '@/lib/api/loans'
import { LoanDb } from '@/constants/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Seperator } from '@/components/seperator'

function getNextPaymentDate(loan: LoanDb): Date {
  const today = new Date()
  const candidate = new Date(today.getFullYear(), today.getMonth(), loan.payment_day_of_month)
  if (candidate < today) {
    candidate.setMonth(candidate.getMonth() + 1)
  }
  return candidate
}

function computePaymentBreakdown(loan: LoanDb, nextPaymentDate: Date) {
  const monthlyRate = Number(loan.interest_rate) / 100 / 12
  const interest = Number(loan.current_principal) * monthlyRate
  const extraStartDate = loan.extra_payment_start_date
    ? new Date(loan.extra_payment_start_date as unknown as string)
    : null
  const extraApplies =
    loan.extra_payment != null &&
    Number(loan.extra_payment) > 0 &&
    extraStartDate != null &&
    extraStartDate <= nextPaymentDate
  const extra = extraApplies ? Number(loan.extra_payment) : 0
  const total = Number(loan.minimum_payment) + extra
  const principal = Math.max(0, total - interest)
  return { interest, principal, total, extra }
}

export function PaymentBreakdown({ loans }: { loans: LoanDb[] }) {
  const activeLoans = useMemo(() => {
    const filtered = loans?.filter((l) => l.current_principal > 0.01) ?? []
    return filtered.sort((a, b) => {
      const nextA = getNextPaymentDate(a)
      const nextB = getNextPaymentDate(b)
      const { total: totalA } = computePaymentBreakdown(a, nextA)
      const { total: totalB } = computePaymentBreakdown(b, nextB)
      return totalB - totalA
    })
  }, [loans])

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
        <CardTitle className='text-base font-medium'>Next Payment Breakdown</CardTitle>
      </CardHeader>
      <CardContent className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0'>
        {activeLoans.map((loan, i) => {
          const nextDate = getNextPaymentDate(loan)
          const { interest, principal, total, extra } = computePaymentBreakdown(loan, nextDate)
          const principalPct = (principal / total) * 100
          const interestPct = (interest / total) * 100

          return (
            <div key={String(loan.id)}>
              {i > 0 && (
                <div className='mb-4'>
                  <Seperator />
                </div>
              )}
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <p className='font-medium'>{loan.name}</p>
                  <p className='text-muted-foreground text-xs'>Due {format(nextDate, 'MMM d')}</p>
                </div>

                <div className='flex items-baseline justify-between'>
                  <span className='text-muted-foreground text-xs'>Total payment</span>
                  <span className='font-mono text-lg font-semibold'>
                    ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className='space-y-1.5'>
                  <div className='flex h-2 w-full overflow-hidden rounded-sm'>
                    <div className='bg-primary transition-all' style={{ width: `${principalPct}%` }} />
                    <div className='bg-destructive/70 transition-all' style={{ width: `${interestPct}%` }} />
                  </div>
                  <div className='flex justify-between text-xs'>
                    <div className='flex items-center gap-1.5'>
                      <div className='bg-primary h-2 w-2 shrink-0 rounded-[2px]' />
                      <span className='text-muted-foreground'>Principal</span>
                      <span className='font-mono font-medium tabular-nums'>
                        ${principal.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <div className='bg-destructive/70 h-2 w-2 shrink-0 rounded-[2px]' />
                      <span className='text-muted-foreground'>Interest</span>
                      <span className='font-mono font-medium tabular-nums'>
                        ${interest.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {extra > 0 && (
                  <p className='text-muted-foreground text-xs'>
                    Includes ${extra.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                    extra payment
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
