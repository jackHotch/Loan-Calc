import { z } from 'zod'

export const loanDbSchema = z.object({
  id: z.bigint(),
  user_id: z.bigint(),
  name: z.string(),
  lender: z.string().nullable(),
  starting_principal: z.number(),
  current_principal: z.number(),
  interest_rate: z.number(),
  minimum_payment: z.number(),
  extra_payment: z.number().nullable(),
  extra_payment_start_date: z.date().nullable(),
  start_date: z.date(),
  payment_day_of_month: z.number(),
  payoff_date: z.date(),
  total_interest_paid: z.number().nonnegative(),
  total_amount_paid: z.number().nonnegative(),
})

export const loanTableSchema = z.object({
  id: z.string(),
  name: z.string(),
  interest_rate: z.string(),
  lender: z.string(),
  starting_principal: z.string(),
  current_principal: z.string(),
  minimum_payment: z.string(),
  extra_payment: z.string(),
  extra_payment_start_date: z.string(),
  start_date: z.string(),
  next_payment_date: z.string(),
  payoff_date: z.string(),
  total_interest_paid: z.string(),
  total_amount_paid: z.string(),
})

export const loanFormSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Loan name is required'),
  lender: z.string().optional(),
  start_date: z.date(),
  payoff_date: z.date(),
  next_payment_date: z.date(),
  starting_principal: z.number().positive(),
  interest_rate: z.number().min(0).max(100),
  minimum_payment: z.number().positive(),
  extra_payment: z.number().nonnegative().optional(),
  extra_payment_start_date: z.date(),
})

export const StrategyType = {
  AVALANCHE: 'Avalanche',
  SNOWBALL: 'Snowball',
  AVALANCHE_INTEREST_FOCUSED: 'Avalanche - Interest Focused',
  SNOWBALL_INTEREST_FOCUSED: 'Snowball - Interest Focused',
} as const

export const createSimulationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  strategy_type: z.enum([
    StrategyType.AVALANCHE,
    StrategyType.SNOWBALL,
    StrategyType.AVALANCHE_INTEREST_FOCUSED,
    StrategyType.SNOWBALL_INTEREST_FOCUSED,
  ]),
  extra_payment: z.number().min(0),
  cascade: z.boolean(),
  loan_ids: z.array(z.number()).nonempty(),
})

export type LoanDb = z.infer<typeof loanDbSchema>
export type LoanTable = z.infer<typeof loanTableSchema>
export type LoanForm = z.infer<typeof loanFormSchema>
export type CreateSimulationInput = z.infer<typeof createSimulationSchema>
export type StrategyType = (typeof StrategyType)[keyof typeof StrategyType]
