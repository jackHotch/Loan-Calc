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
  minimum_payment: z.number(),
  extra_payment: z.number().nullable(),
  start_date: z.date(),
  payoff_date: z.date(),
})

// UI/Table schema - formatted strings for display
export const loanTableSchema = z.object({
  id: z.string(),
  name: z.string(),
  current_balance: z.string(), // "13,053.23"
  interest_rate: z.string(), // "10.5%"
  lender: z.string(),
  starting_principal: z.string(), // "15,000"
  remaining_principal: z.string(), // "12,423.09"
  accrued_interest: z.string(), // "2,287.45"
  minimum_payment: z.string(), // "193.23"
  extra_payment: z.string(), // "200"
  start_date: z.string(), // "12/6/2025"
  payoff_date: z.string(), // "12/6/2035"
})

// Form schema - for creating/editing (raw numbers)
export const loanFormSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Loan name is required'),
  lender: z.string().optional(),
  start_date: z.date(),
  payoff_date: z.date(),
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
