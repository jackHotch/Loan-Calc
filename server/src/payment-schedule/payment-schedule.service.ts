import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  CalculateScheduleOptions,
  PaymentScheduleEntry,
  PaymentScheduleInput,
} from '../lib/types/payment-schedule.types';
import {
  ExtraPaymentEntry,
  LoanDb,
  LumpSumEntry,
} from 'src/lib/types/loan.types';
import { DatabaseService } from 'src/database/database.service';
import {
  getNewPaymentDate,
  resolveExtraPayment,
  resolveLumpSumsForMonth,
} from 'src/lib/utils';

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
        : new Decimal(loan.starting_principal);
    const startDate = options.startDate
      ? new Date(options.startDate)
      : new Date(loan.start_date);

    let remainingPrincipal = startingPrincipal;
    let outstandingInterest = new Decimal(
      options.startingOutstandingInterest !== undefined
        ? options.startingOutstandingInterest
        : (loan.accrued_interest ?? 0),
    );
    let paymentDate = getNewPaymentDate(
      new Date(startDate),
      loan.payment_day_of_month,
    );
    const monthlyRate = new Decimal(loan.interest_rate).div(100).div(12);
    let paymentNumber = startingPaymentNumber;

    const maxPayments = 1000;

    while (
      (remainingPrincipal.gt(0.01) || outstandingInterest.gt(0.01)) &&
      paymentNumber < maxPayments
    ) {
      let extraPayment: Decimal = resolveExtraPayment(
        loan.extra_payments,
        paymentDate,
      ).plus(resolveLumpSumsForMonth(loan.lump_sums, paymentDate));

      outstandingInterest = outstandingInterest
        .plus(remainingPrincipal.mul(monthlyRate))
        .toDecimalPlaces(2);

      const totalPayment: Decimal = new Decimal(loan.minimum_payment).plus(
        extraPayment,
      );

      const monthlyInterestPaid = Decimal.min(
        totalPayment,
        outstandingInterest,
      ).toDecimalPlaces(2);
      outstandingInterest = outstandingInterest
        .minus(monthlyInterestPaid)
        .toDecimalPlaces(2);

      let monthlyPrincipalPaid = totalPayment
        .minus(monthlyInterestPaid)
        .toDecimalPlaces(2);

      if (monthlyPrincipalPaid.gt(remainingPrincipal)) {
        monthlyPrincipalPaid = remainingPrincipal;
        // Report the portion of the extra payment actually needed to finish
        // the loan, instead of hard-zeroing it (which hid genuine extra
        // contributions in the loan's final payoff month).
        extraPayment = Decimal.max(
          0,
          monthlyInterestPaid
            .plus(monthlyPrincipalPaid)
            .minus(loan.minimum_payment),
        ).toDecimalPlaces(2);
      }

      remainingPrincipal = remainingPrincipal.minus(monthlyPrincipalPaid);

      schedule.push({
        payment_number: paymentNumber,
        payment_date: new Date(paymentDate),
        principal_paid: monthlyPrincipalPaid.toDecimalPlaces(2).toNumber(),
        interest_paid: monthlyInterestPaid.toDecimalPlaces(2).toNumber(),
        extra_payment: extraPayment.toDecimalPlaces(2).toNumber(),
        remaining_principal: remainingPrincipal.toDecimalPlaces(2).toNumber(),
        remaining_outstanding_interest: outstandingInterest
          .toDecimalPlaces(2)
          .toNumber(),
      });

      paymentDate.setMonth(paymentDate.getMonth() + 1);
      paymentNumber++;
    }

    return schedule;
  }

  async getLastActualPayment(loanId: BigInt): Promise<any> {
    const result = await this.db.query(
      `
      SELECT payment_number, payment_date, remaining_principal, remaining_outstanding_interest
      FROM payment_schedules
      WHERE loan_id = $1
      AND is_actual = TRUE
      ORDER BY payment_number DESC, id DESC
      LIMIT 1
      `,
      [loanId],
    );

    return result[0];
  }

  async getLoanExtraPayments(loanId: BigInt): Promise<ExtraPaymentEntry[]> {
    return this.db.query(
      `SELECT id, amount::float AS amount, start_date
       FROM loan_extra_payments WHERE loan_id = $1 ORDER BY start_date`,
      [loanId],
    ) as Promise<ExtraPaymentEntry[]>;
  }

  async getLoanLumpSums(loanId: BigInt): Promise<LumpSumEntry[]> {
    return this.db.query(
      `SELECT id, amount::float AS amount, date
       FROM loan_lump_sum_payments WHERE loan_id = $1 ORDER BY date`,
      [loanId],
    ) as Promise<LumpSumEntry[]>;
  }

  // The schedule is a pure function of the loan's own recorded inputs, so this
  // rebuilds the whole thing from the loan's start every time. That is only
  // safe because nothing simulation-derived is ever written onto the loan —
  // when it was, this shape retroactively applied a simulation's future extra
  // payment across the entire history and destroyed it.
  async regenerateScheduleForLoan(loanId: BigInt) {
    const [loan] = await this.db.query(
      `SELECT id, starting_principal, accrued_interest, interest_rate,
              minimum_payment, start_date, payment_day_of_month
       FROM loans WHERE id = $1`,
      [loanId],
    );
    if (!loan) return [];

    const [extraPayments, lumpSums] = await Promise.all([
      this.getLoanExtraPayments(loanId),
      this.getLoanLumpSums(loanId),
    ]);

    const schedule = this.calculatePaymentSchedule({
      starting_principal: loan.starting_principal,
      interest_rate: loan.interest_rate,
      start_date: loan.start_date,
      payment_day_of_month: loan.payment_day_of_month,
      minimum_payment: loan.minimum_payment,
      accrued_interest: loan.accrued_interest ?? 0,
      extra_payments: extraPayments,
      lump_sums: lumpSums,
    });

    await this.db.query(`DELETE FROM payment_schedules WHERE loan_id = $1`, [
      loanId,
    ]);

    await this.saveSchedule(loanId, 'loan', schedule);
    await this.processAllPendingPayments(loanId);

    return this.getSchedules(loanId, 'loan');
  }

  async saveSchedule(
    loanId: BigInt,
    type: 'loan' | 'simulation',
    schedule: PaymentScheduleEntry[],
  ) {
    const idColumn = type === 'loan' ? 'loan_id' : 'simulation_loan_id';

    // A paid-off loan produces no payments, which would build a VALUES clause
    // with no rows.
    if (schedule.length === 0) {
      return this.getSchedules(loanId, type);
    }

    const values = schedule
      .map((_, i) => {
        const offset = i * 7 + 2;
        return `($1, $${offset}, $${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
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
        p.remaining_outstanding_interest,
      ]),
    ];

    await this.db.query(
      `
      INSERT INTO payment_schedules (${idColumn}, payment_number, payment_date, principal_paid,
        interest_paid, extra_payment, remaining_principal, remaining_outstanding_interest)
        VALUES ${values}
        `,
      params,
    );

    return this.getSchedules(loanId, type);
  }

  async getSchedules(id: BigInt, type: 'loan' | 'simulation') {
    let idColumn: string;

    if (type === 'loan') {
      idColumn = 'loan_id';
    } else {
      idColumn = 'simulation_loan_id';
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
        remaining_outstanding_interest,
        payment_date,
        is_actual
      FROM payment_schedules
      WHERE ${idColumn} = $1
      ORDER BY payment_number
      `,
      [id],
    );
  }

  // Copies simulation entries whose date has passed onto the loans they affect,
  // so a projection the user has lived through becomes part of their recorded
  // history. Only ever inserts — never edits or deletes a loan's own entries —
  // and the `applied` flag makes it idempotent. The user corrects the promoted
  // amount afterwards if what they actually paid differed.
  //
  // This runs in the daily cron *before* is_actual is set, so a row hardens
  // with the promoted entry already in its inputs. If it ran afterwards, the
  // next regeneration would silently rewrite payments already recorded.
  async promoteDueSimulationEntries(): Promise<number> {
    const activeUsers = await this.db.query(
      `SELECT active_simulation_id
       FROM users WHERE active_simulation_id IS NOT NULL`,
    );

    const touchedLoans = new Set<string>();

    for (const { active_simulation_id } of activeUsers) {
      // The target is the first loan by payoff order that still has a balance,
      // matching how runSimulation directs the extra payment.
      const [target] = await this.db.query(
        `SELECT sl.loan_id
         FROM simulation_loans sl
         JOIN loans l ON l.id = sl.loan_id
         WHERE sl.simulation_id = $1
           AND COALESCE(
                 (SELECT remaining_principal FROM payment_schedules
                  WHERE loan_id = sl.loan_id AND is_actual = TRUE
                  ORDER BY payment_number DESC LIMIT 1),
                 l.starting_principal) > 0.01
         ORDER BY sl.payoff_order ASC
         LIMIT 1`,
        [active_simulation_id],
      );
      if (!target) continue;

      const loanId = target.loan_id;

      const dueExtras = await this.db.query(
        `UPDATE simulation_extra_payments SET applied = TRUE
         WHERE simulation_id = $1 AND applied = FALSE AND start_date <= CURRENT_DATE
         RETURNING amount, start_date`,
        [active_simulation_id],
      );

      for (const ep of dueExtras) {
        await this.db.query(
          `INSERT INTO loan_extra_payments (loan_id, amount, start_date)
           VALUES ($1, $2, $3)
           ON CONFLICT (loan_id, start_date) DO UPDATE SET amount = EXCLUDED.amount`,
          [loanId, ep.amount, ep.start_date],
        );
        touchedLoans.add(String(loanId));
      }

      const dueLumps = await this.db.query(
        `UPDATE simulation_lump_sum_payments SET applied = TRUE
         WHERE simulation_id = $1 AND applied = FALSE AND date <= CURRENT_DATE
         RETURNING amount, date`,
        [active_simulation_id],
      );

      for (const ls of dueLumps) {
        await this.db.query(
          `INSERT INTO loan_lump_sum_payments (loan_id, amount, date) VALUES ($1, $2, $3)`,
          [loanId, ls.amount, ls.date],
        );
        touchedLoans.add(String(loanId));
      }
    }

    for (const loanId of touchedLoans) {
      await this.regenerateScheduleForLoan(BigInt(loanId));
    }

    return touchedLoans.size;
  }

  // Compares against CURRENT_DATE rather than a JS Date: the cron fires at
  // 03:38 UTC, which is the previous evening in the user's timezone, and
  // payment_date is a date — marshalling a timestamp through would let the day
  // boundary shift. Scoped to loan rows so a simulation's projections are
  // never hardened into actuals.
  async processAllPendingPayments(loanId?: BigInt) {
    const loanIdCondition = loanId ? `AND loan_id = $1` : `AND loan_id IS NOT NULL`;

    await this.db.query(
      `
      UPDATE payment_schedules
      SET is_actual = TRUE
      WHERE is_actual = FALSE
      AND payment_date <= CURRENT_DATE
      ${loanIdCondition}
      `,
      loanId ? [loanId] : [],
    );
  }
}
