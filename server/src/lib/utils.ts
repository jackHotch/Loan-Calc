import Decimal from 'decimal.js';
import {
  CalculateScheduleOptions,
  PaymentScheduleEntry,
  PaymentScheduleInput,
} from './types/loan.types';

function calculatePaymentSchedule(
  loan: PaymentScheduleInput,
  options: CalculateScheduleOptions = {},
): PaymentScheduleEntry[] {
  const schedule: PaymentScheduleEntry[] = [];

  const startingPaymentNumber = options.startFromPaymentNumber || 1;
  const startingPrincipal =
    options.startingPrincipal !== undefined
      ? new Decimal(options.startingPrincipal)
      : new Decimal(loan.current_principal);
  const startingInterest =
    options.startingInterest !== undefined
      ? new Decimal(options.startingInterest)
      : new Decimal(loan.accrued_interest);
  const startDate = options.startDate
    ? new Date(options.startDate)
    : new Date(loan.start_date);

  let remainingPrincipal = startingPrincipal;
  let remainingInterest = startingInterest;
  let monthlyRate = new Decimal(loan.interest_rate).div(100).div(12);
  let paymentNumber = startingPaymentNumber;

  const maxPayments = 1000;

  return schedule;
}
