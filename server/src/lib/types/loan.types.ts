import { z } from 'zod';

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
});

export type LoanDb = z.infer<typeof loanDbSchema>;
