import { format } from 'date-fns'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ToolTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  const [year, month] = String(label).split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  const title = isNaN(date.getTime()) ? String(label) : format(date, 'MMMM yyyy')

  const sorted = [...payload].sort((a: { value?: number }, b: { value?: number }) => (b.value ?? 0) - (a.value ?? 0))

  return (
    <div className='grid min-w-40 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl'>
      <p className='font-medium'>{title}</p>
      {sorted.map((item: { name?: string; value?: number; color?: string }) => (
        <div key={item.name} className='flex items-center gap-2'>
          <div className='h-2.5 w-2.5 shrink-0 rounded-[2px]' style={{ backgroundColor: item.color }} />
          <div className='flex flex-1 justify-between gap-4'>
            <span className='text-muted-foreground'>{item.name}</span>
            <span className='font-mono font-medium tabular-nums'>
              ${(item.value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
