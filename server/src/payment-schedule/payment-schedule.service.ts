import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  CalculateScheduleOptions,
  PaymentScheduleEntry,
  PaymentScheduleInput,
} from '../lib/types/payment-schedule.types';

@Injectable()
export class PaymentScheduleService {
  calculatePaymentSchedule(
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
    let paymentDate = new Date(startDate);
    let monthlyRate = new Decimal(loan.interest_rate)
      .div(100)
      .div(12)
      .toDecimalPlaces(2);
    let paymentNumber = startingPaymentNumber;

    const maxPayments = 1000;

    while (remainingPrincipal.gt(0.01) && paymentNumber < maxPayments) {
      console.log('another payment started');
      const extraPayment: Decimal =
        loan.extra_payment &&
        (!loan.extra_payment_start_date ||
          paymentDate >= new Date(loan.extra_payment_start_date))
          ? new Decimal(loan.extra_payment)
          : new Decimal(0);

      console.log('extra', extraPayment);

      const monthlyInterestPaid = remainingPrincipal
        .mul(monthlyRate)
        .toDecimalPlaces(2);

      console.log('interest', monthlyInterestPaid);

      let totalPayment: Decimal = new Decimal(loan.minimum_payment).plus(
        extraPayment,
      );

      console.log('totalpayment', totalPayment);

      let monthlyPrincipalPaid = new Decimal(totalPayment)
        .minus(monthlyInterestPaid)
        .toDecimalPlaces(2);

      console.log('princiapl', monthlyPrincipalPaid);

      if (monthlyPrincipalPaid.gt(remainingPrincipal)) {
        monthlyPrincipalPaid = remainingPrincipal;
        totalPayment = monthlyPrincipalPaid.plus(monthlyInterestPaid);
      }

      remainingInterest = remainingInterest.minus(monthlyInterestPaid);
      remainingPrincipal = remainingPrincipal.minus(monthlyPrincipalPaid);

      schedule.push({
        payment_number: paymentNumber,
        payment_date: new Date(paymentDate),
        principal_paid: monthlyPrincipalPaid.toDecimalPlaces(2).toNumber(),
        interest_paid: monthlyInterestPaid.toDecimalPlaces(2).toNumber(),
        total_extra_payment: extraPayment.toDecimalPlaces(2).toNumber(),
        remaining_principal: remainingPrincipal.toDecimalPlaces(2).toNumber(),
        remaining_interest: remainingInterest.toDecimalPlaces(2).toNumber(),
      });

      paymentDate.setMonth(paymentDate.getMonth() + 1);
      paymentNumber++;
    }

    return schedule;
  }
}
