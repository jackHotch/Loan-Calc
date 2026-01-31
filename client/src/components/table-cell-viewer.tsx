import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from './ui/drawer'
import { loanTableSchema } from '@/constants/scheme'
import { z } from 'zod'
import { ReactNode, useState } from 'react'

export function TableCellViewer({ data, children }: { data?: z.infer<typeof loanTableSchema>; children: ReactNode }) {
  const description = data
    ? 'Edit loan details and payment information'
    : 'Enter new loan details and payment information'

  const [loanData, SetLoanData] = useState(
    data || {
      name: '',
      current_balance: '',
      interest_rate: '',
      lender: '',
      starting_principal: '',
      remaining_principal: '',
      accrued_interest: '',
      payoff_date: '',
    },
  )

  return (
    <Drawer direction='right'>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className='gap-1'>
          <DrawerTitle>{loanData.name || 'New Loan'}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className='flex flex-col gap-4 overflow-y-auto px-4 text-sm'>
          <form className='flex flex-col gap-4'>
            <div className='flex flex-col gap-3'>
              <Label htmlFor='name'>Loan Name</Label>
              <Input id='name' defaultValue={loanData.name} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='current_balance'>Current Balance</Label>
                <Input id='current_balance' defaultValue={loanData.current_balance} />
              </div>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='interest_rate'>Interest Rate</Label>
                <Input id='interest_rate' defaultValue={loanData.interest_rate} />
              </div>
            </div>
            <div className='flex flex-col gap-3'>
              <Label htmlFor='lender'>Lender</Label>
              <Input id='lender' defaultValue={loanData.lender} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='starting_principal'>Starting Principal</Label>
                <Input id='starting_principal' defaultValue={loanData.starting_principal} />
              </div>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='remaining_principal'>Remaining Principal</Label>
                <Input id='remaining_principal' defaultValue={loanData.remaining_principal} />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='accrued_interest'>Accrued Interest</Label>
                <Input id='accrued_interest' defaultValue={loanData.accrued_interest} />
              </div>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='payoff_date'>Payoff Date</Label>
                <Input id='payoff_date' defaultValue={loanData.payoff_date} />
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>Save Changes</Button>
          <DrawerClose asChild>
            <Button variant='outline'>Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
