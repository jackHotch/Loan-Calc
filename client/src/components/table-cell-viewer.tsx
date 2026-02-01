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
import { loanFormSchema, LoanTable } from '@/constants/schema'
import { z } from 'zod'
import { ReactNode } from 'react'
import { DatePicker } from './date-picker'
import { useAuth } from '@clerk/nextjs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CurrencyInput } from './currency-input'
import { PercentageInput } from './percentage-input'
import { tableToForm } from '@/lib/utils'

export function TableCellViewer({
  data,
  isNewLoan = false,
  children,
}: {
  data?: LoanTable
  isNewLoan?: boolean
  children: ReactNode
}) {
  const { userId } = useAuth()

  const form = useForm({
    resolver: zodResolver(loanFormSchema),
    defaultValues: isNewLoan
      ? {
          name: '',
          lender: '',
          start_date: null,
          payoff_date: null,
          starting_principal: null,
          remaining_principal: null,
          accrued_interest: null,
          interest_rate: null,
          minimum_payment: null,
          extra_payment: null,
        }
      : tableToForm(data),
  })

  const description = isNewLoan
    ? 'Edit loan details and payment information'
    : 'Enter new loan details and payment information'

  return (
    <Drawer direction='right'>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className='gap-1'>
          <DrawerTitle>{form.getValues('name') || 'New Loan'}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className='flex flex-col gap-4 overflow-y-auto px-4 text-sm'>
          <form className='flex flex-col gap-4'>
            <div className='flex flex-col gap-3'>
              <Label htmlFor='name'>Loan Name</Label>
              <Input id='name' defaultValue={form.watch('name')} placeholder='ex: Auto Loan' />
            </div>
            <div className='flex flex-col gap-3'>
              <Label htmlFor='lender'>Lender</Label>
              <Input id='lender' defaultValue={form.watch('lender')} placeholder='ex: Sallie Mae' />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='start_date'>Start Date</Label>
                <DatePicker value={form.watch('start_date')} onChange={(val) => form.setValue('start_date', val)} />
              </div>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='payoff_date'>Payoff Date</Label>
                <DatePicker value={form.watch('payoff_date')} onChange={(val) => form.setValue('payoff_date', val)} />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='starting_principal'>Starting Principal</Label>
                <CurrencyInput
                  defaultValue={form.getValues('starting_principal')}
                  onChange={(val) => form.setValue('starting_principal', val)}
                />
              </div>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='remaining_principal'>Remaining Principal</Label>
                <CurrencyInput
                  defaultValue={form.getValues('remaining_principal')}
                  onChange={(val) => form.setValue('remaining_principal', val)}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='accrued_interest'>Accrued Interest</Label>
                <CurrencyInput
                  defaultValue={form.getValues('accrued_interest')}
                  onChange={(val) => form.setValue('accrued_interest', val)}
                />
              </div>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='interest_rate'>Interest Rate</Label>
                <PercentageInput
                  defaultValue={form.getValues('interest_rate')}
                  onChange={(val) => form.setValue('interest_rate', val)}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='minimum_payment'>Minimum Payment</Label>
                <CurrencyInput
                  defaultValue={form.getValues('minimum_payment')}
                  onChange={(val) => form.setValue('minimum_payment', val)}
                />
              </div>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='extra_payment'>Extra Payment</Label>
                <CurrencyInput
                  defaultValue={form.getValues('extra_payment')}
                  onChange={(val) => form.setValue('extra_payment', val)}
                />
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>{isNewLoan ? 'Add Loan' : 'Save Changes'}</Button>
          <DrawerClose asChild>
            <Button variant='outline'>Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
