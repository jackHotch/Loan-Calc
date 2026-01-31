import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function LoanTableTest() {
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

  return (
    <div className='p-4 pl-2'>
      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>Loan Name</TableHead>
              <TableHead>Current Balance</TableHead>
              <TableHead>Interest Rate</TableHead>
              <TableHead>Lender</TableHead>
              <TableHead>Starting Principal</TableHead>
              <TableHead>Remaining Principal</TableHead>
              <TableHead>Accrued Interest</TableHead>
              <TableHead>Payoff Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((value, key) => {
              return (
                <TableRow>
                  <TableCell>{value.name}</TableCell>
                  <TableCell>{value.current_balance}</TableCell>
                  <TableCell>{value.interest_rate}</TableCell>
                  <TableCell>{value.lender}</TableCell>
                  <TableCell>{value.starting_principal}</TableCell>
                  <TableCell>{value.remaining_principal}</TableCell>
                  <TableCell>{value.accrued_interest}</TableCell>
                  <TableCell>{value.payoff_date}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
