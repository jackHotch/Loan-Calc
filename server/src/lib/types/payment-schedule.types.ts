import { ExtraPaymentEntry, LumpSumEntry } from './loan.types';

export interface PaymentScheduleInput {
  starting_principal: number;
  interest_rate: number;
  start_date: Date;
  payment_day_of_month: number;
  minimum_payment: number;
  accrued_interest?: number;
  extra_payments?: ExtraPaymentEntry[];
  lump_sums?: LumpSumEntry[];
}

export interface PaymentScheduleEntry {
  payment_number: number;
  payment_date: Date;
  principal_paid: number;
  interest_paid: number;
  extra_payment: number;
  remaining_principal: number;
  remaining_outstanding_interest: number;
}

export interface CalculateScheduleOptions {
  startFromPaymentNumber?: number;
  startingPrincipal?: number;
  startDate?: Date | string;
  startingOutstandingInterest?: number;
}
