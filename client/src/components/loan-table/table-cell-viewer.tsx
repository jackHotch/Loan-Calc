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
import { ReactNode, useEffect, useRef, useState } from 'react'
import { DatePicker } from './date-picker'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CurrencyInput } from './currency-input'
import { PercentageInput } from './percentage-input'
import { formToDb, tableToForm } from '@/lib/utils'
import {
  useCreateLoan,
  useUpdateLoan,
  useApplyLumpSum,
  useLoanLumpSums,
  useDeleteLumpSum,
  useLoanExtraPayments,
  useSetLoanExtraPayments,
} from '@/lib/api/loans'
import { formatCurrency, formatDate, parseServerDate, toLocalDateString } from '@/lib/utils'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { X } from 'lucide-react'

type ExtraPaymentRow = { amount: number; start_date: Date }

export function TableCellViewer({
  data,
  isNewLoan = false,
  children,
}: {
  data?: LoanTable
  isNewLoan?: boolean
  children: ReactNode
}) {
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [lumpSumAmount, setLumpSumAmount] = useState<number | null>(null)
  const [lumpSumDate, setLumpSumDate] = useState<Date | null>(null)
  const [extraPayments, setExtraPayments] = useState<ExtraPaymentRow[]>([])
  const formKey = useRef(0)
  const createLoan = useCreateLoan()
  const updateLoan = useUpdateLoan()
  const applyLumpSum = useApplyLumpSum()
  const deleteLumpSum = useDeleteLumpSum()
  const lumpSums = useLoanLumpSums(!isNewLoan ? data?.id : undefined)
  const savedExtraPayments = useLoanExtraPayments(!isNewLoan ? data?.id : undefined)
  const setExtraPaymentsMutation = useSetLoanExtraPayments()
  const description = isNewLoan
    ? 'Edit loan details and payment information'
    : 'Enter new loan details and payment information'

  useEffect(() => {
    if (savedExtraPayments.data) {
      setExtraPayments(
        savedExtraPayments.data.map((ep) => ({
          amount: Number(ep.amount),
          start_date: parseServerDate(ep.start_date),
        })),
      )
    }
  }, [savedExtraPayments.data])

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
          extra_payments: [],
        }
      : tableToForm(data),
  })

  const serializeExtraPayments = () =>
    extraPayments
      .filter((ep) => ep.start_date)
      .map((ep) => ({ amount: ep.amount, start_date: toLocalDateString(ep.start_date) }))

  const handleSubmit = async () => {
    try {
      const formatedLoan = formToDb(form.getValues())

      if (isNewLoan) {
        await createLoan.mutateAsync({
          ...formatedLoan,
          extra_payments: serializeExtraPayments(),
        })
        form.reset()
        setExtraPayments([])
        setDrawerOpen(false)
        toast.success('Loan created successfully!')
      } else {
        const id = form.getValues('id')
        await updateLoan.mutateAsync({ id, data: formatedLoan })
        await setExtraPaymentsMutation.mutateAsync({
          loanId: id,
          extra_payments: serializeExtraPayments(),
        })
        form.reset()
        setDrawerOpen(false)
        toast.success('Loan updated successfully!')
      }
    } catch (error: any) {
      toast.error('Unable to save loan')
    }
  }

  const addExtraPayment = (amount: number) =>
    setExtraPayments((prev) => [...prev, { amount, start_date: new Date() }])

  const updateExtraPayment = (index: number, patch: Partial<ExtraPaymentRow>) =>
    setExtraPayments((prev) =>
      prev.map((ep, i) => (i === index ? { ...ep, ...patch } : ep)),
    )

  const removeExtraPayment = (index: number) =>
    setExtraPayments((prev) => prev.filter((_, i) => i !== index))

  const handleDeleteLumpSum = async (lumpSumId: number) => {
    if (!data?.id) return
    try {
      await deleteLumpSum.mutateAsync({ loanId: data.id, lumpSumId })
      toast.success('Lump sum payment removed!')
    } catch {
      toast.error('Unable to remove lump sum payment')
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
      <DrawerContent className={isMobile ? 'flex flex-col max-h-[90vh]' : 'flex flex-col h-screen w-150!'}>
        <DrawerHeader className='gap-1 shrink-0'>
          <DrawerTitle>{isNewLoan ? 'New Loan' : 'Edit Loan'}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className='flex-1 overflow-y-auto flex flex-col gap-4 px-4 text-sm'>
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
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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
                <div className='flex flex-col gap-3'>
                  <Label htmlFor='accrued_interest'>Unpaid Interest</Label>
                  <CurrencyInput
                    defaultValue={form.getValues('accrued_interest') ?? 0}
                    onChange={(val) => form.setValue('accrued_interest', val)}
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

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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
            <div className='flex flex-col gap-3'>
              <Label>Extra Payments</Label>
              <p className='text-xs text-muted-foreground'>
                Each entry sets the recurring monthly extra from its date until the next
                one. Record what you have actually paid — edit an entry to correct it.
              </p>
              {extraPayments.length === 0 && (
                <p className='text-xs text-muted-foreground italic'>
                  No extra payments recorded.
                </p>
              )}
              {extraPayments.map((ep, index) => (
                <div key={index} className='grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end'>
                  <div className='flex flex-col gap-2'>
                    <Label className='text-xs text-muted-foreground'>Amount</Label>
                    <CurrencyInput
                      defaultValue={ep.amount}
                      onChange={(val) => updateExtraPayment(index, { amount: val ?? 0 })}
                    />
                  </div>
                  <div className='flex flex-col gap-2'>
                    <Label className='text-xs text-muted-foreground'>Starting</Label>
                    <DatePicker
                      value={ep.start_date}
                      onChange={(val) => updateExtraPayment(index, { start_date: val })}
                    />
                  </div>
                  <button
                    type='button'
                    aria-label='Remove extra payment'
                    onClick={() => removeExtraPayment(index)}
                    className='h-9 px-2 text-muted-foreground hover:text-destructive transition-colors'
                  >
                    <X className='size-4' />
                  </button>
                </div>
              ))}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <Button type='button' variant='outline' onClick={() => addExtraPayment(100)}>
                  Add an extra payment
                </Button>
                {/* Stopping is just a $0 entry, but that is not obvious, so it gets its own button. */}
                <Button type='button' variant='outline' onClick={() => addExtraPayment(0)}>
                  Stop extra payments
                </Button>
              </div>
            </div>
            {!isNewLoan && (
              <div className='flex flex-col gap-3'>
                <Label>Lump Sum Payment</Label>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='flex flex-col gap-3'>
                    <Label className='text-xs text-muted-foreground'>Amount</Label>
                    <CurrencyInput defaultValue={lumpSumAmount} onChange={setLumpSumAmount} />
                  </div>
                  <div className='flex flex-col gap-3'>
                    <Label className='text-xs text-muted-foreground'>Date</Label>
                    <DatePicker value={lumpSumDate} onChange={setLumpSumDate} maxDate={new Date()} />
                  </div>
                </div>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={handleApplyLumpSum}
                  disabled={!lumpSumAmount || !lumpSumDate}
                >
                  Apply Lump Sum
                </Button>
                {lumpSums.data && lumpSums.data.length > 0 && (
                  <div className='flex flex-col gap-1 border-t pt-3 mt-1'>
                    <p className='text-xs font-medium text-muted-foreground'>Applied</p>
                    {lumpSums.data.map((ls) => (
                      <div key={ls.id} className='flex justify-between items-center text-xs'>
                        <span className='text-muted-foreground'>
                          {formatDate(parseServerDate(ls.date))}
                        </span>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium'>{formatCurrency(ls.amount)}</span>
                          <button
                            type='button'
                            onClick={() => handleDeleteLumpSum(ls.id)}
                            className='text-muted-foreground hover:text-destructive transition-colors'
                            disabled={deleteLumpSum.isPending}
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
        <DrawerFooter className='shrink-0'>
          <Button onClick={handleSubmit}>{isNewLoan ? 'Add Loan' : 'Save Changes'}</Button>
          <DrawerClose asChild>
            <Button variant='outline'>Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
