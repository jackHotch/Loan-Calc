import { LoanTable } from '@/components/loan-table'
import { LoanDb } from '@/constants/schema'
import { calculateTotals, dbToTable } from '@/lib/utils'

export default function Loans() {
  const data: LoanDb[] = [
    {
      id: BigInt(25325),
      user_id: BigInt(623852450),
      name: 'Loan1',
      lender: 'Sallie Mae',
      starting_principal: 15000,
      current_principal: 12423.09,
      accrued_interest: 2287.45,
      interest_rate: 10.5,
      minimum_payment: 193.23,
      extra_payment: 200,
      start_date: new Date('12/6/2025'),
      payoff_date: new Date('12/6/2035'),
    },
    {
      id: BigInt(324545),
      user_id: BigInt(435661),
      name: 'Loan2',
      lender: 'Sallie Mae',
      starting_principal: 9000,
      current_principal: 6433.09,
      accrued_interest: 2098.45,
      interest_rate: 11.5,
      minimum_payment: 65.72,
      extra_payment: 0,
      start_date: new Date('12/25/2025'),
      payoff_date: new Date('12/6/2037'),
    },
    {
      id: BigInt(3453),
      user_id: BigInt(4325043754),
      name: 'Loan3',
      lender: 'Sallie Mae',
      starting_principal: 12000,
      current_principal: 9773.09,
      accrued_interest: 1386.45,
      interest_rate: 11.75,
      minimum_payment: 198.02,
      extra_payment: 50,
      start_date: new Date('12/6/2025'),
      payoff_date: new Date('12/6/2040'),
    },
  ]

  data.push(calculateTotals(data))
  const tableData = data.map(dbToTable)

  return (
    <>
      <LoanTable data={tableData} />
      totals
    </>
  )
}
