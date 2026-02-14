export interface PaymentScheduleInput {
  current_principal: number;
  interest_rate: number;
  start_date: Date;
  payment_day_of_month: number;
  minimum_payment: number;
  extra_payment: number | null;
  extra_payment_start_date: Date | null;
}

export interface PaymentScheduleEntry {
  payment_number: number;
  payment_date: Date;
  principal_paid: number;
  interest_paid: number;
  extra_payment: number;
  remaining_principal: number;
}

export interface CalculateScheduleOptions {
  startFromPaymentNumber?: number;
  startingPrincipal?: number;
  startDate?: Date | string;
}
