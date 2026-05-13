import { TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Seperator } from '../seperator'

export const Summary = () => {
  const totalDebt = 80250
  const paidOff = 22500
  const remaining = totalDebt - paidOff
  const percentPaid = (paidOff / totalDebt) * 100

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-medium'>Debt Progress</CardTitle>
          <Badge>
            <TrendingDown data-icon='inline-start' />
            9%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-1'>
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

        <Seperator />

        <div className='pt-3'>
          <div className='grid grid-cols-2 gap-3 text-center'>
            <div className='rounded-lg bg-muted/50 p-2'>
              <p className='text-muted-foreground text-xs'>Active Loans</p>
              <p className='text-xl font-bold'>12</p>
            </div>
            <div className='rounded-lg bg-muted/50 p-2'>
              <p className='text-muted-foreground text-xs'>Months til Payoff</p>
              <p className='text-xl font-bold'>20</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
