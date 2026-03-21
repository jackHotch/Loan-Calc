import { X } from 'lucide-react'
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

export const extraPaymentSchema = z.object({
  id: z.number().optional(),
  simulation_id: z.number().optional(),
  amount: z.number().min(0),
  start_date: z.date(),
})

export const createSimulationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  strategy_type: z.enum([
    StrategyType.AVALANCHE,
    StrategyType.SNOWBALL,
    StrategyType.AVALANCHE_INTEREST_FOCUSED,
    StrategyType.SNOWBALL_INTEREST_FOCUSED,
  ]),
  extra_payments: z.array(extraPaymentSchema).default([]),
  cascade: z.boolean(),
  loan_ids: z.array(z.number()).nonempty(),
})

export const paymentScheduleSchema = z.object({
  id: z.number(),
  simulation_loan_id: z.number(),
  payment_number: z.number(),
  principal_paid: z.number(),
  interest_paid: z.number(),
  loan_id: z.number().nullable(),
  extra_payment: z.number(),
  remaining_principal: z.number(),
  payment_date: z.string(),
  is_actual: z.boolean(),
  total_payment: z.number(),
})

export const simulationLoanSchema = z.object({
  id: z.number(),
  loan_id: z.number(),
  payoff_order: z.number(),
  payment_schedule: z.array(paymentScheduleSchema),
})

export const SimulationSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  strategy_type: z.enum([
    StrategyType.AVALANCHE,
    StrategyType.SNOWBALL,
    StrategyType.AVALANCHE_INTEREST_FOCUSED,
    StrategyType.SNOWBALL_INTEREST_FOCUSED,
  ]),
  created_at: z.date(),
  updated_at: z.date(),
  cascade: z.boolean(),
  extra_payments: z.array(extraPaymentSchema),
  loans: z.array(simulationLoanSchema),
})

export const SavingsSchema = z.object({
  interest_saved: z.number(),
  months_saved: z.number(),
})

export const TotalsSchema = z.object({
  total_interest_paid: z.number(),
  total_paid: z.number(),
  payoff_date: z.string().nullable(),
  months_til_payoff: z.number().int().nullable(),
  extra_payments: z.array(
    z.object({
      amount: z.number(),
      start_date: z.string(),
    }),
  ),
  active_extra_payment: z.number().nullable(),
})

export const PerLoanSchema = z.object({
  loan_id: z.string(),
  name: z.string().nullable(),
  lender: z.string().nullable(),
  starting_principal: z.string(),
  interest_rate: z.string(),
  minimum_payment: z.string(),
  payoff_order: z.number().int().nullable(),
  payoff_date: z.string().nullable(),
  months_til_payoff: z.number().int().nullable(),
  months_saved: z.number().int(),
  interest_saved: z.number(),
  total_interest_paid: z.number(),
  total_principal_paid: z.number(),
  total_paid: z.number(),
})

export const SimulationSummarySchema = z.object({
  simulation: SimulationSchema,
  savings: SavingsSchema,
  totals: TotalsSchema,
  perLoan: z.array(PerLoanSchema),
})

export const ActiveSimulationSchema = z.object({
  active_simulation_id: z.string().nullable(),
})

export const DeleteSimulationSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  description: z.string(),
  strategy_type: z.string(),
  created_at: z.string(),
  cascade: z.string(),
})

export const UserSchema = z.object({
  id: z.string(),
  clerk_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
})

export type LoanDb = z.infer<typeof loanDbSchema>
export type LoanTable = z.infer<typeof loanTableSchema>
export type LoanForm = z.infer<typeof loanFormSchema>
export type CreateSimulationInput = z.infer<typeof createSimulationSchema>
export type StrategyType = (typeof StrategyType)[keyof typeof StrategyType]
export type Simulation = z.infer<typeof SimulationSchema>
export type SimulationLoan = z.infer<typeof simulationLoanSchema>
export type PaymentSchedule = z.infer<typeof paymentScheduleSchema>
export type Savings = z.infer<typeof SavingsSchema>
export type Totals = z.infer<typeof TotalsSchema>
export type PerLoan = z.infer<typeof PerLoanSchema>
export type SimulationSummary = z.infer<typeof SimulationSummarySchema>
export type ActiveSimulation = z.infer<typeof ActiveSimulationSchema>
export type DeleteSimulation = z.infer<typeof DeleteSimulationSchema>
export type User = z.infer<typeof UserSchema>
