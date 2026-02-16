'use client'

import { LoanTable } from '@/components/loan-table'
import { LoanDb } from '@/constants/schema'
import { useLoans } from '@/lib/api/loans'
import { calculateTotals, dbToTable } from '@/lib/utils'
import { useEffect, useState } from 'react'

export default function Loans() {
  const { data, isLoading } = useLoans()
  const [tableData, setTableData] = useState<any>()
  const [totals, setTotals] = useState<any>()

  useEffect(() => {
    if (data && data.length > 0) {
      setTotals(calculateTotals(data))
      setTableData(data.map(dbToTable))
    }
  }, [data])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return <LoanTable data={tableData} totals={totals} />
}
