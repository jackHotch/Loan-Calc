import { formatCurrency } from '@/lib/utils'
import { DatePicker } from '../loan-table/date-picker'
import { X } from 'lucide-react'

interface PaymentCardProps {
  title: string
  subtitle?: string
  decreaseButtonAction: () => void
  increaseButtonAction: () => void
  amount: number
  date: Date
  onDateChange: (d: Date) => void
  onPaymentDelete: () => void
}

export const PaymentCard = ({
  title,
  subtitle = '',
  decreaseButtonAction,
  increaseButtonAction,
  amount,
  date,
  onDateChange,
  onPaymentDelete,
}: PaymentCardProps) => {
  return (
    <div className='card flex-col items-start gap-3'>
      <div className='flex flex-col'>
        <p className='text-sm text-zinc-400'>{title}</p>
        <p className='text-description'>{subtitle}</p>
      </div>

      <div className='flex flex-col gap-2 w-full'>
        <div className='flex w-full items-center justify-between'>
          <button
            onClick={decreaseButtonAction}
            className='flex justify-center items-center bg-secondary cursor-pointer rounded-full w-4 h-4 border p-4'
          >
            -
          </button>
          <span className='text-primary text-sm'>{formatCurrency(amount)}</span>
          <button
            onClick={increaseButtonAction}
            className='flex justify-center items-center bg-secondary cursor-pointer rounded-full w-4 h-4 border p-4'
          >
            +
          </button>
        </div>
        <DatePicker value={date} onChange={onDateChange} />
        <div
          onClick={onPaymentDelete}
          className='flex w-full justify-center items-center gap-1.5 border border-red-500/50 px-2 py-1.5 text-xs text-red-500/50 cursor-pointer'
        >
          <X size={12} /> Remove
        </div>
      </div>
    </div>
  )
}
