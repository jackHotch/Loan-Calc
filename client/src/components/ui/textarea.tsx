import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'focus:border-primary/35 placeholder:text-zinc-600 border-input bg-input/30 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 resize-none border px-3 py-3 text-base transition-colors md:text-sm flex field-sizing-content min-h-16 w-full outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
