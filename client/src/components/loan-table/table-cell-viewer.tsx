import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '../ui/drawer'
import { loanFormSchema, LoanTable } from '@/constants/schema'
import { ReactNode, useRef, useState } from 'react'
import { DatePicker } from './date-picker'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CurrencyInput } from './currency-input'
import { PercentageInput } from './percentage-input'
import { formToDb, tableToForm } from '@/lib/utils'
import { useCreateLoan, useUpdateLoan, useApplyLumpSum, useLoanLumpSums } from '@/lib/api/loans'
import { useActiveSimulation, useSimulation } from '@/lib/api/simulations'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'

export function TableCellViewer({
  data,
  isNewLoan = false,
  isSimulationControlled = false,
  children,
}: {
  data?: LoanTable
  isNewLoan?: boolean
  isSimulationControlled?: boolean
  children: ReactNode
}) {
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [lumpSumAmount, setLumpSumAmount] = useState<number | null>(null)
  const [lumpSumDate, setLumpSumDate] = useState<Date | null>(null)
  const formKey = useRef(0)
  const createLoan = useCreateLoan()
  const updateLoan = useUpdateLoan()
  const applyLumpSum = useApplyLumpSum()
  const lumpSums = useLoanLumpSums(!isNewLoan ? data?.id : undefined)
  const activeSimulation = useActiveSimulation()
  const activeSimId = isSimulationControlled ? activeSimulation.data?.active_simulation_id : undefined
  const simulation = useSimulation(activeSimId)
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
    try {
      // When the simulation controls extra payment, always use the original loan values
      // for those fields so they can never be overridden from this form.
      if (isSimulationControlled) {
        const original = tableToForm(data)
        form.setValue('extra_payment', original?.extra_payment ?? null)
        form.setValue('extra_payment_start_date', original?.extra_payment_start_date ?? null)
      }

      const formatedLoan = formToDb(form.getValues())

      if (isNewLoan) {
        await createLoan.mutateAsync(formatedLoan)
        form.reset()
        setDrawerOpen(false)
        toast.success('Loan created successfully!')
      } else {
        await updateLoan.mutateAsync({ id: form.getValues('id'), data: formatedLoan })
        form.reset()
        setDrawerOpen(false)
        toast.success('Loan updated successfully!')
      }
    } catch (error: any) {
      toast.error('Unable to save loan')
    }
  }

  const handleApplyLumpSum = async () => {
    if (!lumpSumAmount || !lumpSumDate || !data?.id) return
    try {
      await applyLumpSum.mutateAsync({
        id: data.id,
        amount: lumpSumAmount,
        date: lumpSumDate.toISOString(),
      })
      setLumpSumAmount(null)
      setLumpSumDate(null)
      toast.success('Lump sum payment applied!')
    } catch {
      toast.error('Unable to apply lump sum payment')
    }
  }

  return (
    <Drawer
      open={drawerOpen}
      onOpenChange={(open) => {
        if (open) {
          formKey.current += 1
          if (!isNewLoan) form.reset(tableToForm(data))
        } else {
          form.reset()
        }
        setDrawerOpen(open)
      }}
      direction={isMobile ? 'bottom' : 'right'}
    >
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className='!w-[600px]'>
        <DrawerHeader className='gap-1'>
          <DrawerTitle>{isNewLoan ? 'New Loan' : 'Edit Loan'}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className='flex flex-col gap-4 px-4 text-sm'>
          <form key={formKey.current} className='flex flex-col gap-4'>
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
            {isSimulationControlled && (
              <p className='text-xs text-amber-500'>Extra payment is managed by the active simulation.</p>
            )}
            <div className='grid grid-cols-2 gap-4'>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='extra_payment'>Extra Payment</Label>
                <CurrencyInput
                  defaultValue={form.getValues('extra_payment')}
                  onChange={(val) => form.setValue('extra_payment', val)}
                  disabled={isSimulationControlled}
                />
              </div>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='extra_payment_start_date'>Extra Payment Date</Label>
                <DatePicker
                  value={form.watch('extra_payment_start_date')}
                  onChange={(val) => form.setValue('extra_payment_start_date', val)}
                  disabled={isSimulationControlled}
                />
              </div>
            </div>
            {!isNewLoan && (
              <div className='flex flex-col gap-3'>
                <Label>Lump Sum Payment</Label>
                {isSimulationControlled && (
                  <p className='text-xs text-amber-500'>Lump sum payments are locked while a simulation is active.</p>
                )}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='flex flex-col gap-3'>
                    <Label className='text-xs text-muted-foreground'>Amount</Label>
                    <CurrencyInput
                      defaultValue={lumpSumAmount}
                      onChange={setLumpSumAmount}
                      disabled={isSimulationControlled}
                    />
                  </div>
                  <div className='flex flex-col gap-3'>
                    <Label className='text-xs text-muted-foreground'>Date</Label>
                    <DatePicker
                      value={lumpSumDate}
                      onChange={setLumpSumDate}
                      disabled={isSimulationControlled}
                      maxDate={new Date()}
                    />
                  </div>
                </div>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={handleApplyLumpSum}
                  disabled={isSimulationControlled || !lumpSumAmount || !lumpSumDate}
                >
                  Apply Lump Sum
                </Button>
                {((lumpSums.data && lumpSums.data.length > 0) ||
                  (isSimulationControlled && (simulation.data?.lump_sum_payments?.length ?? 0) > 0)) && (
                  <div className='flex flex-col gap-2 border-t pt-3 mt-1'>
                    {lumpSums.data && lumpSums.data.length > 0 && (
                      <div className='flex flex-col gap-1'>
                        <p className='text-xs font-medium text-muted-foreground'>Applied</p>
                        {lumpSums.data.map((ls) => (
                          <div key={ls.id} className='flex justify-between text-xs'>
                            <span className='text-muted-foreground'>{formatDate(new Date(ls.date))}</span>
                            <span className='font-medium'>{formatCurrency(ls.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {isSimulationControlled && (simulation.data?.lump_sum_payments?.length ?? 0) > 0 && (
                      <div className='flex flex-col gap-1 mt-1'>
                        <p className='text-xs font-medium text-muted-foreground'>Planned (simulation)</p>
                        {simulation.data!.lump_sum_payments.map((ls) => (
                          <div key={ls.id} className='flex justify-between text-xs'>
                            <span className='text-muted-foreground'>{formatDate(new Date(ls.date))}</span>
                            <span className='font-medium text-blue-500'>{formatCurrency(ls.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
