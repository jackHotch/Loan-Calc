import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  CalculateScheduleOptions,
  PaymentScheduleEntry,
  PaymentScheduleInput,
} from '../lib/types/payment-schedule.types';
import { LoanDb } from 'src/lib/types/loan.types';
import { DatabaseService } from 'src/database/database.service';
import { getNewPaymentDate } from 'src/lib/utils';

@Injectable()
export class PaymentScheduleService {
  constructor(private db: DatabaseService) {}

  async processAllPendingPayments(loanId?: number) {
    const today = new Date();
    let loanIdCondition = ``;
    let values: any[] = [today];

    if (loanId) {
      loanIdCondition = `AND loan_id = $2`;
      values.push(loanId);
    }

    return await this.db.query(
      `
      UPDATE payment_schedules
      SET is_actual = TRUE
      WHERE is_actual = FALSE
      AND payment_date <= $1
      ${loanIdCondition}
      RETURNING *
      `,
      values,
    );
  }

  calculatePaymentSchedule(
    loan: PaymentScheduleInput,
    options: CalculateScheduleOptions = {},
  ): PaymentScheduleEntry[] {
    const schedule: PaymentScheduleEntry[] = [];

    const startingPaymentNumber = options.startFromPaymentNumber || 1;
    const startingPrincipal =
      options.startingPrincipal !== undefined
        ? new Decimal(options.startingPrincipal)
        : new Decimal(loan.starting_principal);
    const startDate = options.startDate
      ? new Date(options.startDate)
      : new Date(loan.start_date);

    let remainingPrincipal = startingPrincipal;
    let paymentDate = getNewPaymentDate(
      new Date(startDate),
      loan.payment_day_of_month,
    );
    let monthlyRate = new Decimal(loan.interest_rate)
      .div(100)
      .div(12)
      .toDecimalPlaces(3);
    let paymentNumber = startingPaymentNumber;

    const maxPayments = 1000;

    while (remainingPrincipal.gt(0.01) && paymentNumber < maxPayments) {
      let extraPayment: Decimal =
        loan.extra_payment &&
        (!loan.extra_payment_start_date ||
          paymentDate >= new Date(loan.extra_payment_start_date))
          ? new Decimal(loan.extra_payment)
          : new Decimal(0);

      const monthlyInterestPaid = remainingPrincipal
        .mul(monthlyRate)
        .toDecimalPlaces(2);

      let totalPayment: Decimal = new Decimal(loan.minimum_payment).plus(
        extraPayment,
      );

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

    return schedule;
  }

  generateScheduleForNewLoan(loan: LoanDb) {
    const paymentScheduleInput: PaymentScheduleInput = {
      starting_principal: loan.starting_principal,
      interest_rate: loan.interest_rate,
      start_date: loan.start_date,
      payment_day_of_month: loan.payment_day_of_month,
      minimum_payment: loan.minimum_payment,
      extra_payment: loan.extra_payment,
      extra_payment_start_date: loan.extra_payment_start_date,
    };

    const schedule: PaymentScheduleEntry[] =
      this.calculatePaymentSchedule(paymentScheduleInput);

    return this.saveSchedule(loan.id, schedule);
  }

  async generateScheduleForExistingLoan(loan: LoanDb) {
    const lastActualPayment = await this.db.query(
      `
      SELECT payment_number, payment_date, remaining_principal
      FROM payment_schedules
      WHERE loan_id = $1
      AND is_actual = TRUE
      ORDER BY payment_date DESC
      LIMIT 1
      `,
      [loan.id],
    );

    const paymentScheduleInput: PaymentScheduleInput = {
      starting_principal: loan.starting_principal,
      interest_rate: loan.interest_rate,
      start_date: loan.start_date,
      payment_day_of_month: loan.payment_day_of_month,
      minimum_payment: loan.minimum_payment,
      extra_payment: loan.extra_payment,
      extra_payment_start_date: loan.extra_payment_start_date,
    };

    let startFromPaymentNumber: number;
    let startingPrincipal: number;
    let startDate: Date;

    if (lastActualPayment.length > 0) {
      const lastPayment = lastActualPayment[0];
      startFromPaymentNumber = lastPayment.payment_number + 1;
      startingPrincipal = lastPayment.remaining_principal;
      startDate = new Date(lastPayment.payment_date);
      startDate.setMonth(startDate.getMonth() + 1);
    } else {
      startFromPaymentNumber = 1;
      startingPrincipal = loan.starting_principal;
      startDate = new Date(loan.start_date);
    }

    const dates: Date[] = [startDate];

    if (loan.extra_payment_start_date) {
      dates.push(new Date(loan.extra_payment_start_date));
    }

    startDate = new Date(Math.min(...dates.map((d) => d.getTime())));

    await this.db.query(
      `
      DELETE FROM payment_schedules
      WHERE loan_id = $1
      AND is_actual = FALSE
      AND payment_number >= $2
      `,
      [loan.id, startFromPaymentNumber],
    );

    const schedules: PaymentScheduleEntry[] = this.calculatePaymentSchedule(
      paymentScheduleInput,
      {
        startFromPaymentNumber,
        startingPrincipal,
        startDate,
      },
    );

    return this.saveSchedule(loan.id, schedules);
  }

  async saveSchedule(loanId: BigInt, schedule: PaymentScheduleEntry[]) {
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

    await this.db.query(
      `
      INSERT INTO payment_schedules (loan_id, payment_number, payment_date, principal_paid, 
        interest_paid, extra_payment, remaining_principal)
        VALUES ${values}
        `,
      params,
    );

    const payoffDate = schedule.at(-1)?.payment_date;

    await this.db.query(
      `
      UPDATE loans 
      SET payoff_date = $1
      WHERE id = $2`,
      [payoffDate, loanId],
    );

    return this.getSchedules(loanId, 'loan');
  }

  async getSchedules(id: BigInt, type: 'loan' | 'simulation') {
    let idColumn: string;

    if (type === 'loan') {
      idColumn = 'loan_id';
    } else {
      idColumn = 'simulation_id';
    }

    return await this.db.query(
      `
      SELECT 
        id,
        ${idColumn}, 
        payment_number, 
        principal_paid,
        interest_paid,
        extra_payment,
        total_payment,
        remaining_principal,
        payment_date,
        is_actual
      FROM payment_schedules
      WHERE ${idColumn} = $1
      ORDER BY payment_number
      `,
      [id],
    );
  }
}
