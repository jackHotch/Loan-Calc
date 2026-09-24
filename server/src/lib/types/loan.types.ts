import { z } from 'zod';

export const loanDbSchema = z.object({
  id: z.bigint(),
  user_id: z.bigint(),
  name: z.string(),
  lender: z.string().nullable(),
  starting_principal: z.number(),
  current_principal: z.number(),
  accrued_interest: z.number(),
  current_outstanding_interest: z.number(),
  interest_rate: z.number(),
  minimum_payment: z.number(),
  start_date: z.date(),
  payment_day_of_month: z.number(),
  payoff_date: z.date(),
});

export type LoanDb = z.infer<typeof loanDbSchema>;

// A dated entry setting the recurring monthly extra from start_date forward,
// until a later entry supersedes it. An amount of 0 means "stopped paying
// extra from this date" and must win over earlier entries.
export interface ExtraPaymentEntry {
  amount: number;
  start_date: Date;
}

// A one-off payment applied in the month its date falls in.
export interface LumpSumEntry {
  amount: number;
  date: Date;
}
