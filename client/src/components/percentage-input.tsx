import { useState } from 'react'
import { Input } from './ui/input'

export function PercentageInput({
  defaultValue,
  onChange,
}: {
  defaultValue: number
  onChange: (value: number) => void
}) {
  const [displayValue, setDisplayValue] = useState(defaultValue || '')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const cleaned = input.replace(/[^0-9.]/g, '')

    const parts = cleaned.split('.')
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned

    const num = parseFloat(formatted)
    if (num > 100) return

    setDisplayValue(formatted)
    onChange(num || 0)
  }

  return (
    <div className='relative'>
      <Input
        type='text'
        inputMode='decimal'
        value={displayValue}
        onChange={handleChange}
        className='pr-7'
        placeholder='0.00'
      />
      <span className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground'>%</span>
    </div>
  )
}
