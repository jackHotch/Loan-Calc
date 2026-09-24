'use client'

import { useState, useEffect, CSSProperties } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Field } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { cn, formatInputDate } from '@/lib/utils'

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

export function DatePicker({
  value: externalDate,
  onChange,
  className,
  disabled = false,
  maxDate,
  minDate,
}: {
  value?: Date
  onChange?: (date: Date | undefined) => void
  className?: CSSProperties
  disabled?: boolean
  maxDate?: Date
  minDate?: Date
}) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(externalDate)
  const [month, setMonth] = useState<Date | undefined>(externalDate)
  const [value, setValue] = useState(externalDate ? formatInputDate(externalDate) : '')

  // Rows in a repeatable list are keyed by index, so deleting one re-uses this
  // component instance with a different date. Without this the displayed text
  // would keep showing the removed row's date.
  useEffect(() => {
    setDate(externalDate)
    setMonth(externalDate)
    setValue(externalDate ? formatInputDate(externalDate) : '')
  }, [externalDate])

  const isAfterMax = (d: Date) => !!maxDate && d > maxDate
  const isBeforeMin = (d: Date) => !!minDate && d < minDate
  const isOutOfRange = (d: Date) => isAfterMax(d) || isBeforeMin(d)

  return (
    <Field className={cn('mx-auto', className)}>
      <InputGroup>
        <InputGroupInput
          id='date-required'
          value={value}
          placeholder='mm / dd / yyyy'
          disabled={disabled}
          onChange={(e) => {
            const date = new Date(e.target.value)
            setValue(e.target.value)
            if (isValidDate(date) && !isOutOfRange(date)) {
              setDate(date)
              onChange?.(date)
              setMonth(date)
            } else if (!e.target.value) {
              setDate(undefined)
              onChange?.(undefined)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <InputGroupAddon align='inline-end'>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton id='date-picker' variant='ghost' size='icon-xs' aria-label='Select date' disabled={disabled}>
                <CalendarIcon />
                <span className='sr-only'>Select date</span>
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent className='w-auto overflow-hidden p-0' align='end' alignOffset={-8} sideOffset={10}>
              <Calendar
                mode='single'
                selected={date}
                month={month}
                onMonthChange={setMonth}
                disabled={
                  maxDate || minDate
                    ? { ...(maxDate && { after: maxDate }), ...(minDate && { before: minDate }) }
                    : undefined
                }
                onSelect={(date) => {
                  setDate(date)
                  onChange?.(date)
                  setValue(formatInputDate(date))
                  setOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}
