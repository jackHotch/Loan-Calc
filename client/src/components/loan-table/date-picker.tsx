'use client'

import { useState, CSSProperties } from 'react'
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
}: {
  value?: Date
  onChange?: (date: Date | undefined) => void
  className?: CSSProperties
}) {
  console.log('datepicker', externalDate)
  console.log('hhsdhfh', typeof externalDate)
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(externalDate)
  const [month, setMonth] = useState<Date | undefined>(externalDate)
  const [value, setValue] = useState(externalDate ? formatInputDate(externalDate) : '')

  return (
    <Field className={cn('mx-auto', className)}>
      <InputGroup>
        <InputGroupInput
          id='date-required'
          value={value}
          placeholder='mm / dd / yyyy'
          onChange={(e) => {
            const date = new Date(e.target.value)
            setValue(e.target.value)
            if (isValidDate(date)) {
              setDate(date)
              onChange?.(date)
              setMonth(date)
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
              <InputGroupButton id='date-picker' variant='ghost' size='icon-xs' aria-label='Select date'>
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
