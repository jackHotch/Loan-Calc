'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Seperator } from '@/components/seperator'
import { useLoanProgress } from '@/lib/api/loans'
import { parseServerDate } from '@/lib/utils'

// Each loan's row for next month comes from the server — from the active
// simulation's projection when one is active — so it carries everything that
// lands on that loan: extra payments, lump sums, and minimums cascaded from
// paid-off loans. The card used to rebuild these from the loan fields and
// missed anything the simulation moved between loans.
export function PaymentBreakdown() {
  const { data: progress } = useLoanProgress()

  const upcoming = useMemo(
    () =>
      (progress?.per_loan ?? [])
        .filter((l) => l.next_payment)
        .sort((a, b) => b.next_payment!.total_payment - a.next_payment!.total_payment),
    [progress],
  )

  if (!upcoming.length) {
    return (
      <Card className='flex flex-1 items-center justify-center'>
        <p className='text-muted-foreground text-sm'>No active loans</p>
      </Card>
    )
  }

  return (
    <Card className='flex flex-col rounded-none md:flex-1'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base font-medium'>Next Payment Breakdown</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-4 p-4 pt-0 md:min-h-0 md:flex-1 md:overflow-y-auto'>
        {upcoming.map((loan, i) => {
          const { payment_date, principal_paid: principal, interest_paid: interest, extra_payment: extra, total_payment: total } =
            loan.next_payment!
          const principalPct = total > 0 ? (principal / total) * 100 : 0
          const interestPct = total > 0 ? (interest / total) * 100 : 0

          return (
            <div key={String(loan.loan_id)}>
              {i > 0 && (
                <div className='mb-4'>
                  <Seperator />
                </div>
              )}
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <p className='font-medium'>{loan.name}</p>
                  <p className='text-muted-foreground text-xs'>Due {format(parseServerDate(payment_date), 'MMM d')}</p>
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
                    Includes ${extra.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} above
                    the minimum payment
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
