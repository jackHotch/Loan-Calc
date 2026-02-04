import { TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function DebtProgressCard() {
  const totalDebt = 80250
  const paidOff = 22500
  const remaining = totalDebt - paidOff
  const percentPaid = (paidOff / totalDebt) * 100

  return (
    <Card className='@container h-full'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-medium'>Debt Progress</CardTitle>
          <div className='flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400'>
            <TrendingDown className='size-3' />
            28%
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <div className='flex items-end justify-between'>
            <div>
              <p className='text-muted-foreground text-xs'>Total Paid</p>
              <p className='text-2xl font-bold @[200px]:text-3xl'>${paidOff.toLocaleString()}</p>
            </div>
            <div className='text-right'>
              <p className='text-muted-foreground text-xs'>Remaining</p>
              <p className='text-lg font-semibold @[200px]:text-xl'>${remaining.toLocaleString()}</p>
            </div>
          </div>
          <Progress value={percentPaid} className='h-2' />
          <p className='text-muted-foreground text-xs'>{percentPaid.toFixed(1)}% of total debt paid off</p>
        </div>

        <div className='border-t pt-3'>
          <div className='grid grid-cols-2 gap-3 text-center'>
            <div className='rounded-lg bg-muted/50 p-2'>
              <p className='text-muted-foreground text-xs'>Active Loans</p>
              <p className='text-xl font-bold'>12</p>
            </div>
            <div className='rounded-lg bg-muted/50 p-2'>
              <p className='text-muted-foreground text-xs'>Avg. Interest</p>
              <p className='text-xl font-bold'>11.2%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
