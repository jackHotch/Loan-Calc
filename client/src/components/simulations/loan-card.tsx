import { LoanDb } from '@/constants/schema'

export function LoanCard({ loan }: { loan: LoanDb }) {
  return (
    <div className='border p-4 bg-card flex'>
      <div className='border p-2 w-fit'>X</div>
      <div className='flex justify-between'>
        <div className='flex flex-col'>
          <p className='font-display text-lg'>{loan.name}</p>
          <p className='text-description'>{loan.lender}</p>
        </div>
        <div className='flex flex-col'>
          <p>{loan.current_principal}</p>
          <p>{loan.interest_rate}</p>
        </div>
      </div>
    </div>
  )
}
