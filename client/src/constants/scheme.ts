import { z } from 'zod'

export const loanTableSchema = z.object({
  name: z.string(),
  current_balance: z.string(),
  interest_rate: z.string(),
  lender: z.string(),
  starting_principal: z.string(),
  remaining_principal: z.string(),
  accrued_interest: z.string(),
  payoff_date: z.string(),
})
