import { LoanTable } from '@/components/loan-table'

export default function Loans() {
  const data = [
    {
      name: 'Loan1',
      current_balance: '13,053.23',
      interest_rate: '10.5%',
      lender: 'Sallie Mae',
      starting_principal: '15,000',
      remaining_principal: '12,423.09',
      accrued_interest: '2,287.45',
      payoff_date: '12/6/2035',
    },
    {
      name: 'Loan2',
      current_balance: '7,723.23',
      interest_rate: '11.5%',
      lender: 'Sallie Mae',
      starting_principal: '9,000',
      remaining_principal: '6,433.09',
      accrued_interest: '2,098.45',
      payoff_date: '12/6/2037',
    },
    {
      name: 'Loan3',
      current_balance: '10,778.98',
      interest_rate: '11.75%',
      lender: 'Sallie Mae',
      starting_principal: '12,000',
      remaining_principal: '9,773.09',
      accrued_interest: '1,386.45',
      payoff_date: '12/6/2040',
    },
  ]
  return <LoanTable data={data} />
}
