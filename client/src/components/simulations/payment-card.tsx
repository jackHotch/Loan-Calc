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
    <div className='card justify-between items-center'>
      <div className='flex flex-col'>
        <p className='text-sm text-zinc-400'>{title}</p>
        <p className='text-description'>{subtitle}</p>
      </div>

      <div className='flex gap-6 items-center'>
        <button
          onClick={decreaseButtonAction}
          className='flex justify-center items-center bg-secondary cursor-pointer rounded-full w-4 h-4 border p-4'
        >
          -
        </button>
        <div className='text-primary'>{formatCurrency(amount)}</div>
        <button
          onClick={increaseButtonAction}
          className='flex justify-center items-center bg-secondary cursor-pointer rounded-full w-4 h-4 border p-4'
        >
          +
        </button>

        <DatePicker value={date} onChange={onDateChange} />

        <div
          onClick={onPaymentDelete}
          className='flex justify-center items-center border border-red-500/50 p-1 text-xs text-red-500/50 cursor-pointer'
        >
          <X />
        </div>
      </div>
    </div>
  )
}
