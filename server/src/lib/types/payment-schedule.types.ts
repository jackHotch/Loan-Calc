export interface PaymentScheduleInput {
  current_principal: number;
  accrued_interest: number;
  interest_rate: number;
  start_date: Date;
  payoff_date: Date;
  minimum_payment: number;
  extra_payment: number | null;
  extra_payment_start_date: Date | null;
}

export interface PaymentScheduleEntry {
  payment_number: number;
  payment_date: Date;
  principal_paid: number;
  interest_paid: number;
  total_extra_payment: number;
  remaining_principal: number;
  remaining_interest: number;
}

export interface CalculateScheduleOptions {
  startFromPaymentNumber?: number;
  startingPrincipal?: number;
  startingInterest?: number;
  startDate?: Date | string;
}
