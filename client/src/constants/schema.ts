import { z } from 'zod'

export const loanDbSchema = z.object({
  id: z.bigint(),
  user_id: z.bigint(),
  name: z.string(),
  lender: z.string().nullable(),
  starting_principal: z.number(),
  current_principal: z.number(),
  accrued_interest: z.number(),
  interest_rate: z.number(),
  current_balance: z.number(),
  minimum_payment: z.number(),
  extra_payment: z.number().nullable(),
  start_date: z.date(),
  payment_day_of_month: z.number(),
  payoff_date: z.date(),
})

export const loanTableSchema = z.object({
  id: z.string(),
  name: z.string(),
  current_balance: z.string(),
  interest_rate: z.string(),
  lender: z.string(),
  starting_principal: z.string(),
  remaining_principal: z.string(),
  accrued_interest: z.string(),
  minimum_payment: z.string(),
  extra_payment: z.string(),
  start_date: z.string(),
  next_payment_date: z.string(),
  payoff_date: z.string(),
})

export const loanFormSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Loan name is required'),
  lender: z.string().optional(),
  start_date: z.date(),
  payoff_date: z.date(),
  next_payment_date: z.date(),
  starting_principal: z.number().positive(),
  remaining_principal: z.number().nonnegative(),
  accrued_interest: z.number().nonnegative(),
  interest_rate: z.number().min(0).max(100),
  current_balance: z.number().nonnegative(),
  minimum_payment: z.number().positive(),
  extra_payment: z.number().nonnegative().optional(),
})

export type LoanDb = z.infer<typeof loanDbSchema>
export type LoanTable = z.infer<typeof loanTableSchema>
export type LoanForm = z.infer<typeof loanFormSchema>
