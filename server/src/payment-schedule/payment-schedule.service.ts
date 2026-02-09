import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  CalculateScheduleOptions,
  PaymentScheduleEntry,
  PaymentScheduleInput,
} from '../lib/types/payment-schedule.types';
import { LoanDb } from 'src/lib/types/loan.types';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class PaymentScheduleService {
  constructor(private db: DatabaseService) {}

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
    const startDate = options.startDate
      ? new Date(options.startDate)
      : new Date(loan.start_date);

    let remainingPrincipal = startingPrincipal;
    let paymentDate = new Date(startDate);
    let monthlyRate = new Decimal(loan.interest_rate)
      .div(100)
      .div(12)
      .toDecimalPlaces(2);
    console.log('monthlyrate', monthlyRate);
    let paymentNumber = startingPaymentNumber;

    const maxPayments = 1000;

    while (remainingPrincipal.gt(0.01) && paymentNumber < maxPayments) {
      console.log('another payment started');
      let extraPayment: Decimal =
        loan.extra_payment &&
        (!loan.extra_payment_start_date ||
          paymentDate >= new Date(loan.extra_payment_start_date))
          ? new Decimal(loan.extra_payment)
          : new Decimal(0);

      console.log('int', loan.interest_rate);
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

      if (monthlyPrincipalPaid.gt(remainingPrincipal)) {
        monthlyPrincipalPaid = remainingPrincipal;
        extraPayment = new Decimal(0);
      }

      remainingPrincipal = remainingPrincipal.minus(monthlyPrincipalPaid);

      schedule.push({
        payment_number: paymentNumber,
        payment_date: new Date(paymentDate),
        principal_paid: monthlyPrincipalPaid.toDecimalPlaces(2).toNumber(),
        interest_paid: monthlyInterestPaid.toDecimalPlaces(2).toNumber(),
        extra_payment: extraPayment.toDecimalPlaces(2).toNumber(),
        remaining_principal: remainingPrincipal.toDecimalPlaces(2).toNumber(),
      });

      paymentDate.setMonth(paymentDate.getMonth() + 1);
      paymentNumber++;
    }

    console.log('end of schedule', schedule);
    return schedule;
  }

  generateScheduleForNewLoan(loan: LoanDb) {
    const paymentScheduleInput: PaymentScheduleInput = {
      current_principal: loan.current_principal,
      interest_rate: loan.interest_rate,
      start_date: loan.start_date,
      minimum_payment: loan.minimum_payment,
      extra_payment: loan.extra_payment,
      extra_payment_start_date: loan.extra_payment_start_date,
    };

    const schedule: PaymentScheduleEntry[] =
      this.calculatePaymentSchedule(paymentScheduleInput);

    return this.saveSchedule(loan.id, schedule);
  }

  saveSchedule(loanId: BigInt, schedule: PaymentScheduleEntry[]) {
    const values = schedule
      .map((_, i) => {
        const offset = i * 6 + 2;
        return `($1, $${offset}, $${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
      })
      .join(',');

    const params = [
      loanId,
      ...schedule.flatMap((p) => [
        p.payment_number,
        p.payment_date,
        p.principal_paid,
        p.interest_paid,
        p.extra_payment,
        p.remaining_principal,
      ]),
    ];

    return this.db.query(
      `
      INSERT INTO payment_schedules (loan_id, payment_number, payment_date, principal_paid, 
        interest_paid, extra_payment, remaining_principal)
        VALUES ${values}
        RETURNING *;
        `,
      params,
    );
  }
}
