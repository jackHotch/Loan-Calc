'use client'

import { ChevronDown, EllipsisVertical, Columns2, Plus } from 'lucide-react'
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { LoanTable as LoanTableSchema } from '@/constants/schema'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useState } from 'react'
import { TableCellViewer } from './table-cell-viewer'

const columns: ColumnDef<LoanTableSchema>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className='flex items-center justify-center'>
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? 'indeterminate' : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      </div>
    ),
    cell: ({ row }) => {
      const isTotal = row.getValue('name') === 'Totals'

      if (isTotal) {
        return <div className='flex items-center justify-center'></div>
      }

      return (
        <div className='flex items-center justify-center'>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label='Select row'
          />
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Loan Name',
    cell: ({ row }) => {
      return (
        <TableCellViewer data={row.original}>
          <Button variant='link' className='text-foreground w-fit px-0 text-left'>
            {row.original.name}
          </Button>
        </TableCellViewer>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: 'current_balance',
    header: () => <div>Current Balance</div>,
    cell: ({ row }) => <div className='text font-medium'>{row.original.current_balance}</div>,
  },
  {
    accessorKey: 'interest_rate',
    header: () => <div>Interest Rate</div>,
    cell: ({ row }) => <div>{row.original.interest_rate}</div>,
  },
  {
    accessorKey: 'lender',
    header: 'Lender',
    cell: ({ row }) => <div>{row.original.lender}</div>,
  },
  {
    accessorKey: 'starting_principal',
    header: () => <div>Starting Principal</div>,
    cell: ({ row }) => <div>{row.original.starting_principal}</div>,
  },
  {
    accessorKey: 'remaining_principal',
    header: () => <div>Remaining Principal</div>,
    cell: ({ row }) => <div>{row.original.remaining_principal}</div>,
  },
  {
    accessorKey: 'accrued_interest',
    header: () => <div>Accrued Interest</div>,
    cell: ({ row }) => <div>{row.original.accrued_interest}</div>,
  },
  {
    accessorKey: 'minimun_payment',
    header: () => <div>Minimum Payment</div>,
    cell: ({ row }) => <div>{row.original.minimum_payment}</div>,
  },
  {
    accessorKey: 'extra_payment',
    header: () => <div>Extra Payment</div>,
    cell: ({ row }) => <div>{row.original.extra_payment}</div>,
  },
  {
    accessorKey: 'start_date',
    header: 'Start Date',
    cell: ({ row }) => <div>{row.original.start_date}</div>,
  },
  {
    accessorKey: 'payoff_date',
    header: 'Payoff Date',
    cell: ({ row }) => <div>{row.original.payoff_date}</div>,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const isTotal = row.getValue('name') === 'Totals'

      if (isTotal) {
        return <div className='flex items-center justify-center'></div>
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              className='data-[state=open]:bg-muted text-muted-foreground flex size-8'
              size='icon'
            >
              <EllipsisVertical />
              <span className='sr-only'>Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-32'>
            <TableCellViewer data={row.original}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
            </TableCellViewer>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant='destructive'>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableHiding: false,
  },
]

export function LoanTable({ data: initialData }: { data: LoanTableSchema[] }) {
  const [data, setData] = useState(() => initialData)
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    getRowId: (row) => row.name,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className='flex flex-col'>
      <div className='flex items-center justify-between px-4 pb-4 pt-4 lg:px-6'>
        <h2 className='text-2xl font-bold'>
          <span className='text-primary'>My</span> Loans
        </h2>
        <div className='flex items-center gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm'>
                <Columns2 />
                <span className='hidden lg:inline'>Customize Columns</span>
                <span className='lg:hidden'>Columns</span>
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className='capitalize'
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id.replace(/_/g, ' ')}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <TableCellViewer isNewLoan>
            <Button size='sm'>
              <Plus />
              <span className='hidden lg:inline'>Add Loan</span>
            </Button>
          </TableCellViewer>
        </div>
      </div>
      <div className='relative flex flex-col gap-4 px-4 lg:px-6'>
        <div className='overflow-x-hidden rounded-2xl border'>
          <Table>
            <TableHeader className='bg-muted sticky top-0 z-10'>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const isTotal = row.getValue('name') === 'Totals'

                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className={isTotal ? 'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0' : ''}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className='h-24 text-center'>
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className='flex items-center justify-between px-4'>
          <div className='text-muted-foreground hidden flex-1 text-sm lg:flex'>
            {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length - 1} row(s)
            selected.
          </div>
          {table.getFilteredSelectedRowModel().rows.length > 0 && <Button variant='destructive'>Delete Loan(s)</Button>}
        </div>
      </div>
    </div>
  )
}
