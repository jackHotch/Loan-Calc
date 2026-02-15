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
import { ReactNode, useState } from 'react'
import { DatePicker } from './date-picker'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CurrencyInput } from './currency-input'
import { PercentageInput } from './percentage-input'
import { formToDb, tableToForm } from '@/lib/utils'
import { useCreateLoan, useUpdateLoan } from '@/lib/api/loans'
import { toast } from 'sonner'

export function TableCellViewer({
  data,
  isNewLoan = false,
  children,
}: {
  data?: LoanTable
  isNewLoan?: boolean
  children: ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const createLoan = useCreateLoan()
  const updateLoan = useUpdateLoan()
  const description = isNewLoan
    ? 'Edit loan details and payment information'
    : 'Enter new loan details and payment information'

  const form = useForm({
    resolver: zodResolver(loanFormSchema),
    defaultValues: isNewLoan
      ? {
          id: '',
          name: '',
          lender: '',
          start_date: null,
          starting_principal: null,
          interest_rate: null,
          minimum_payment: null,
          extra_payment: null,
          extra_payment_start_date: null,
        }
      : tableToForm(data),
  })

  const handleSubmit = async () => {
    const formatedLoan = formToDb(form.getValues())
    if (isNewLoan) {
      try {
        await createLoan.mutateAsync(formatedLoan)
        form.reset()
        setDrawerOpen(false)
        toast.success('Loan created successfully!')
      } catch (error: any) {
        toast.error('Unable to create loan')
      }
    } else {
      try {
        await updateLoan.mutateAsync({ id: form.getValues('id'), data: formatedLoan })
        form.reset()
        setDrawerOpen(false)
        toast.success('Loan updated successfully!')
      } catch (error: any) {
        toast.error('Unable to update loan')
      }
    }
  }

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction='right'>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className='gap-1'>
          <DrawerTitle>{isNewLoan ? 'New Loan' : 'Edit Loan'}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className='flex flex-col gap-4 px-4 text-sm'>
          <form className='flex flex-col gap-4'>
            <div className='flex flex-col gap-3'>
              <Label htmlFor='name'>Loan Name</Label>
              <Input
                id='name'
                defaultValue={form.watch('name')}
                onChange={(val) => form.setValue('name', val.target.value)}
                placeholder='ex: Auto Loan'
              />
            </div>
            <div className='flex flex-col gap-3'>
              <Label htmlFor='lender'>Lender</Label>
              <Input
                id='lender'
                defaultValue={form.watch('lender')}
                onChange={(val) => form.setValue('lender', val.target.value)}
                placeholder='ex: Sallie Mae'
              />
            </div>
            {isNewLoan ? (
              <>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='flex flex-col gap-3'>
                    <Label htmlFor='start_date'>Start Date</Label>
                    <DatePicker value={form.watch('start_date')} onChange={(val) => form.setValue('start_date', val)} />
                  </div>
                  <div className='flex flex-col gap-3'>
                    <Label htmlFor='next_payment_date'>Next Payment Date</Label>
                    <DatePicker
                      value={form.watch('next_payment_date')}
                      onChange={(val) => form.setValue('next_payment_date', val)}
                    />
                  </div>
                </div>
                <div className='flex flex-col gap-3'>
                  <Label htmlFor='starting_principal'>Starting Principal</Label>
                  <CurrencyInput
                    defaultValue={form.getValues('starting_principal')}
                    onChange={(val) => form.setValue('starting_principal', val)}
                  />
                </div>
              </>
            ) : (
              <div className='flex flex-col gap-3'>
                <Label htmlFor='next_payment_date'>Next Payment Date</Label>
                <DatePicker
                  value={form.watch('next_payment_date')}
                  onChange={(val) => form.setValue('next_payment_date', val)}
                />
              </div>
            )}

            <div className='grid grid-cols-2 gap-4'>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='minimum_payment'>Minimum Payment</Label>
                <CurrencyInput
                  defaultValue={form.getValues('minimum_payment')}
                  onChange={(val) => form.setValue('minimum_payment', val)}
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
                <Label htmlFor='extra_payment'>Extra Payment</Label>
                <CurrencyInput
                  defaultValue={form.getValues('extra_payment')}
                  onChange={(val) => form.setValue('extra_payment', val)}
                />
              </div>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='extra_payment_start_date'>Extra Payment Date</Label>
                <DatePicker
                  value={form.watch('extra_payment_start_date')}
                  onChange={(val) => form.setValue('extra_payment_start_date', val)}
                />
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button onClick={handleSubmit}>{isNewLoan ? 'Add Loan' : 'Save Changes'}</Button>
          <DrawerClose asChild>
            <Button variant='outline'>Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
