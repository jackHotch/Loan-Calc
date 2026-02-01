import { formatCurrency } from '@/lib/utils'
import { Input } from './ui/input'
import { useState } from 'react'

export function CurrencyInput({ defaultValue, onChange }: { defaultValue: number; onChange: (value: number) => void }) {
  const [displayValue, setDisplayValue] = useState(defaultValue ? formatCurrency(defaultValue) : '')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const cleaned = input.replace(/[^0-9.]/g, '')

    const parts = cleaned.split('.')
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned

    setDisplayValue(formatted)

    const numValue = parseFloat(formatted) || 0
    onChange(numValue)
  }

  const handleBlur = () => {
    if (displayValue) {
      const num = parseFloat(displayValue)
      if (!isNaN(num)) {
        setDisplayValue(formatCurrency(num))
      }
    }
  }

  const handleFocus = () => {
    const num = parseFloat(displayValue.replace(/,/g, ''))
    if (!isNaN(num)) {
      setDisplayValue(num.toString())
    }
  }

  return (
    <div className='relative'>
      <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>$</span>
      <Input
        type='text'
        inputMode='decimal'
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className='pl-7'
        placeholder='0.00'
      />
    </div>
  )
}
