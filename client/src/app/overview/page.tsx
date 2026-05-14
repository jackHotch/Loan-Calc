'use client'

import { Summary } from '@/components/overview/summary'
import { LoanProgressChart } from '@/components/overview/loan-progress-chart'
import { PaymentBreakdown } from '@/components/overview/payment-breakdown'
import { useLoans } from '@/lib/api/loans'

function Overview() {
  const { data: loans } = useLoans()

  return (
    <div className='flex flex-col gap-4 overflow-hidden p-6' style={{ height: 'calc(100svh - var(--header-height))' }}>
      <Summary />
      <div className='flex min-h-0 flex-1 gap-4'>
        <div className='flex-65 flex min-h-0 min-w-0 flex-col'>
          <LoanProgressChart loans={loans} />
        </div>
        <div className='flex-35 flex min-h-0 min-w-0 flex-col'>
          <PaymentBreakdown loans={loans} />
        </div>
      </div>
    </div>
  )
}

export default Overview
