import { formatCurrency } from '@/lib/utils'
import { DatePicker } from '../loan-table/date-picker'
import { X } from 'lucide-react'
import { useState } from 'react'

// Renders like plain text; clicking it swaps in an input with the same styling
// so the amount can be typed directly. Enter/blur commits, Escape cancels.
function EditableAmount({
  amount,
  onChange,
  className = '',
}: {
  amount: number
  onChange: (amount: number) => void
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  function startEditing() {
    setDraft(formatCurrency(amount))
    setEditing(true)
  }

  function commit() {
    const parsed = parseFloat(draft.replace(/[^0-9.]/g, ''))
    if (!isNaN(parsed)) onChange(Math.round(parsed * 100) / 100)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        inputMode='decimal'
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') setEditing(false)
        }}
        style={{ width: `${Math.max(draft.length, 4) + 1}ch` }}
        className={`${className} bg-transparent p-0 border-0 outline-none text-center`}
      />
    )
  }

  return (
    <span onClick={startEditing} className={`${className} cursor-text`}>
      {formatCurrency(amount)}
    </span>
  )
}

interface PaymentCardProps {
  title: string
  subtitle?: string
  decreaseButtonAction: () => void
  increaseButtonAction: () => void
  amount: number
  onAmountChange: (amount: number) => void
  date: Date
  onDateChange: (d: Date) => void
  onPaymentDelete: () => void
  minDate?: Date
}

export const PaymentCard = ({
  title,
  subtitle = '',
  decreaseButtonAction,
  increaseButtonAction,
  amount,
  onAmountChange,
  date,
  onDateChange,
  onPaymentDelete,
  minDate,
}: PaymentCardProps) => {
  const decreaseBtn = (
    <button onClick={decreaseButtonAction} className='flex justify-center items-center bg-secondary cursor-pointer rounded-full w-4 h-4 border p-4'>
      -
    </button>
  )
  const increaseBtn = (
    <button onClick={increaseButtonAction} className='flex justify-center items-center bg-secondary cursor-pointer rounded-full w-4 h-4 border p-4'>
      +
    </button>
  )

  return (
    <div className='card flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex flex-col'>
        <p className='text-sm text-zinc-400'>{title}</p>
        <p className='text-description'>{subtitle}</p>
      </div>

      {/* Mobile: stacked layout */}
      <div className='flex flex-col w-full gap-2 sm:hidden'>
        <div className='flex w-full items-center justify-between'>
          {decreaseBtn}
          <EditableAmount amount={amount} onChange={onAmountChange} className='text-primary text-sm' />
          {increaseBtn}
        </div>
        <DatePicker value={date} onChange={onDateChange} minDate={minDate} />
        <div
          onClick={onPaymentDelete}
          className='flex w-full justify-center items-center gap-1.5 border border-red-500/50 px-2 py-1.5 text-xs text-red-500/50 cursor-pointer'
        >
          <X size={12} /> Remove
        </div>
      </div>

      {/* Desktop: original single-row layout */}
      <div className='hidden sm:flex gap-6 items-center shrink-0'>
        {decreaseBtn}
        <EditableAmount amount={amount} onChange={onAmountChange} className='text-primary' />
        {increaseBtn}
        <DatePicker value={date} onChange={onDateChange} minDate={minDate} />
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
