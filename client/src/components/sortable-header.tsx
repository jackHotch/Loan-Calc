import { Column } from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SortableHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
}

export function SortableHeader<TData, TValue>({ column, title }: SortableHeaderProps<TData, TValue>) {
  return (
    <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className='-ml-4'>
      {title}
      {column.getIsSorted() === 'asc' ? (
        <ArrowUp className='ml-2 h-4 w-4' />
      ) : column.getIsSorted() === 'desc' ? (
        <ArrowDown className='ml-2 h-4 w-4' />
      ) : (
        <ArrowUpDown className='ml-2 h-4 w-4' />
      )}
    </Button>
  )
}
