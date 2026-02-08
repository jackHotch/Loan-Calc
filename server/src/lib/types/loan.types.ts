export interface PaymentScheduleInput {
  current_principal: number;
  accrued_interest: number;
  interest_rate: number;
  start_date: Date;
  payoff_date: Date;
  minimum_payment: number;
  extra_payment: number;
  extra_payment_start_date: Date;
}

export interface PaymentScheduleEntry {
  paymentNumber: number;
  paymentDate: Date;
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
