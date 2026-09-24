import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { ApplyLumpSumDto } from './dto/apply-lump-sum.dto';
import { RecalibrateLoanDto } from './dto/recalibrate-loan.dto';
import { DatabaseService } from '../database/database.service';
import { PaymentScheduleService } from 'src/payment-schedule/payment-schedule.service';
import { LoanDb } from 'src/lib/types/loan.types';
import Decimal from 'decimal.js';

@Injectable()
export class LoansService {
  constructor(
    private db: DatabaseService,
    private paymentSchedules: PaymentScheduleService,
  ) {}

  async create(userId: BigInt, loan: CreateLoanDto) {
    const result = await this.db.query(
      `
      INSERT INTO loans (user_id, name, lender, starting_principal,
        interest_rate, minimum_payment, start_date, payment_day_of_month, accrued_interest)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;`,
      [
        userId,
        loan.name,
        loan.lender,
        loan.starting_principal,
        loan.interest_rate,
        loan.minimum_payment,
        loan.start_date,
        loan.payment_day_of_month,
        loan.accrued_interest ?? 0,
      ],
    );

    const createdLoan = result[0] as LoanDb;

    if (loan.extra_payments?.length) {
      await this.replaceExtraPayments(createdLoan.id, loan.extra_payments);
    }

    const createdSchedule =
      await this.paymentSchedules.regenerateScheduleForLoan(createdLoan.id);

    const finalLoan = await this.findOne(userId, createdLoan.id);

    return {
      loan: finalLoan,
      paymentSchedule: createdSchedule,
    };
  }

  private async replaceExtraPayments(
    loanId: BigInt,
    entries: { amount: number; start_date: string | Date }[],
  ) {
    await this.db.query(
      `DELETE FROM loan_extra_payments WHERE loan_id = $1`,
      [loanId],
    );
    if (!entries.length) return;

    const values = entries
      .map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`)
      .join(', ');

    await this.db.query(
      `INSERT INTO loan_extra_payments (loan_id, amount, start_date) VALUES ${values}`,
      [loanId, ...entries.flatMap((e) => [e.amount, e.start_date])],
    );
  }

  async findAll(userId: BigInt) {
    return await this.db.query(
      `
      SELECT
        l.id,
        l.user_id,
        l.name,
        l.lender,
        l.starting_principal,
        l.accrued_interest,
        l.interest_rate,
        l.minimum_payment,
        l.payment_day_of_month,
        l.start_date,
        COALESCE((
          SELECT amount FROM loan_extra_payments
          WHERE loan_id = l.id AND start_date <= CURRENT_DATE
          ORDER BY start_date DESC LIMIT 1
        ), 0) AS current_extra_payment,
        COALESCE(SUM(ps.interest_paid), 0) AS total_interest_paid,
        COALESCE(SUM(ps.principal_paid) + SUM(ps.interest_paid), 0) AS total_amount_paid,
        COALESCE(last_actual.remaining_principal, l.starting_principal) AS current_principal,
        COALESCE(last_actual.remaining_outstanding_interest, l.accrued_interest) AS current_outstanding_interest,
        last_schedule.payment_date AS payoff_date
      FROM
        loans l
      LEFT JOIN
        payment_schedules ps ON l.id = ps.loan_id
      LEFT JOIN LATERAL (
        SELECT remaining_principal, remaining_outstanding_interest
        FROM payment_schedules
        WHERE loan_id = l.id
          AND is_actual = true
        ORDER BY payment_number DESC
        LIMIT 1
      ) last_actual ON true
      LEFT JOIN LATERAL (
        SELECT payment_date
        FROM payment_schedules
        WHERE loan_id = l.id
        ORDER BY payment_number DESC
        LIMIT 1
      ) last_schedule ON true
      WHERE
        l.user_id = $1
      GROUP BY
        l.id,
        l.user_id,
        l.name,
        l.lender,
        l.starting_principal,
        l.accrued_interest,
        l.interest_rate,
        l.minimum_payment,
        l.payment_day_of_month,
        l.start_date,
        last_actual.remaining_principal,
        last_actual.remaining_outstanding_interest,
        last_schedule.payment_date
      `,
      [userId],
    );
  }

  async findOne(userId: BigInt, loanId: BigInt): Promise<LoanDb> {
    const results = await this.db.query(
      `
      SELECT
        l.id,
        l.user_id,
        l.name,
        l.lender,
        l.starting_principal,
        l.accrued_interest,
        l.interest_rate,
        l.minimum_payment,
        l.payment_day_of_month,
        l.start_date,
        COALESCE((
          SELECT amount FROM loan_extra_payments
          WHERE loan_id = l.id AND start_date <= CURRENT_DATE
          ORDER BY start_date DESC LIMIT 1
        ), 0) AS current_extra_payment,
        COALESCE(SUM(ps.interest_paid), 0) AS total_interest_paid,
        COALESCE(SUM(ps.principal_paid) + SUM(ps.interest_paid), 0) AS total_amount_paid,
        COALESCE(last_actual.remaining_principal, l.starting_principal) AS current_principal,
        COALESCE(last_actual.remaining_outstanding_interest, l.accrued_interest) AS current_outstanding_interest,
        last_schedule.payment_date AS payoff_date
      FROM
        loans l
      LEFT JOIN
        payment_schedules ps ON l.id = ps.loan_id
      LEFT JOIN LATERAL (
        SELECT remaining_principal, remaining_outstanding_interest
        FROM payment_schedules
        WHERE loan_id = l.id
          AND is_actual = true
        ORDER BY payment_number DESC
        LIMIT 1
      ) last_actual ON true
      LEFT JOIN LATERAL (
        SELECT payment_date
        FROM payment_schedules
        WHERE loan_id = l.id
        ORDER BY payment_number DESC
        LIMIT 1
      ) last_schedule ON true
      WHERE
        l.user_id = $1
        AND ps.loan_id = $2
      GROUP BY
        l.id,
        l.user_id,
        l.name,
        l.lender,
        l.starting_principal,
        l.accrued_interest,
        l.interest_rate,
        l.minimum_payment,
        l.payment_day_of_month,
        l.start_date,
        last_actual.remaining_principal,
        last_actual.remaining_outstanding_interest,
        last_schedule.payment_date
      `,
      [userId, loanId],
    );

    const loan = results[0] as LoanDb | undefined;
    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    return loan ?? null;
  }

  async getBaselineSummary(userId: BigInt, loanIds?: number[]) {
    const filterByIds = loanIds && loanIds.length > 0;

    const loanDetails = await this.db.query(
      filterByIds
        ? `SELECT
        l.id AS loan_id,
        l.name,
        l.lender,
        l.starting_principal,
        l.interest_rate,
        l.minimum_payment
      FROM loans l
      WHERE l.id = ANY($1)
        AND l.user_id = $2`
        : `SELECT
        l.id AS loan_id,
        l.name,
        l.lender,
        l.starting_principal,
        l.interest_rate,
        l.minimum_payment
      FROM loans l
      WHERE l.user_id = $1`,
      filterByIds ? [loanIds, userId] : [userId],
    );

    const loanDetailsMap = Object.fromEntries(
      loanDetails.map((r) => [
        r.loan_id,
        {
          name: r.name,
          lender: r.lender,
          starting_principal: r.starting_principal,
          interest_rate: r.interest_rate,
          minimum_payment: r.minimum_payment,
        },
      ]),
    );

    const totals = await this.db.query(
      filterByIds
        ? `SELECT
        l.id AS loan_id,
        SUM(ps.principal_paid) AS principal_paid,
        SUM(ps.interest_paid) AS interest_paid,
        SUM(ps.total_payment) AS total_paid,
        COUNT(*) AS payment_count,
        MAX(ps.payment_date) AS payoff_date
      FROM payment_schedules ps
      JOIN loans l ON ps.loan_id = l.id
      WHERE ps.loan_id = ANY($1)
        AND ps.simulation_loan_id IS NULL
        AND l.user_id = $2
      GROUP BY l.id`
        : `SELECT
        l.id AS loan_id,
        SUM(ps.principal_paid) AS principal_paid,
        SUM(ps.interest_paid) AS interest_paid,
        SUM(ps.total_payment) AS total_paid,
        COUNT(*) AS payment_count,
        MAX(ps.payment_date) AS payoff_date
      FROM payment_schedules ps
      JOIN loans l ON ps.loan_id = l.id
      WHERE ps.simulation_loan_id IS NULL
        AND l.user_id = $1
      GROUP BY l.id`,
      filterByIds ? [loanIds, userId] : [userId],
    );

    const now = new Date();

    const perLoan = totals.map((row) => {
      const details = loanDetailsMap[row.loan_id];
      const payoffDate = row.payoff_date ? new Date(row.payoff_date) : null;
      const monthsTilPayoff = payoffDate
        ? (payoffDate.getFullYear() - now.getFullYear()) * 12 +
          (payoffDate.getMonth() - now.getMonth())
        : null;

      return {
        loan_id: row.loan_id,
        name: details?.name ?? null,
        lender: details?.lender ?? null,
        starting_principal: details?.starting_principal ?? null,
        interest_rate: details?.interest_rate ?? null,
        minimum_payment: details?.minimum_payment ?? null,
        payoff_date: row.payoff_date,
        months_til_payoff: monthsTilPayoff,
        total_interest_paid: new Decimal(row.interest_paid)
          .toDecimalPlaces(2)
          .toNumber(),
        total_principal_paid: new Decimal(row.principal_paid)
          .toDecimalPlaces(2)
          .toNumber(),
        total_paid: new Decimal(row.total_paid).toDecimalPlaces(2).toNumber(),
      };
    });

    const totalsRollup = perLoan.reduce(
      (acc, loan) => ({
        total_interest_paid: new Decimal(acc.total_interest_paid)
          .plus(loan.total_interest_paid)
          .toDecimalPlaces(2)
          .toNumber(),
        total_paid: new Decimal(acc.total_paid)
          .plus(loan.total_paid)
          .toDecimalPlaces(2)
          .toNumber(),
        payoff_date:
          !acc.payoff_date || loan.payoff_date > acc.payoff_date
            ? loan.payoff_date
            : acc.payoff_date,
      }),
      { total_interest_paid: 0, total_paid: 0, payoff_date: null },
    );

    return { totals: totalsRollup, perLoan };
  }

  async update(userId: BigInt, loanId: BigInt, loan: UpdateLoanDto) {
    const needsRecalculation =
      loan.interest_rate !== undefined ||
      loan.minimum_payment !== undefined ||
      loan.extra_payments !== undefined ||
      loan.payment_day_of_month !== undefined ||
      loan.starting_principal !== undefined ||
      loan.start_date !== undefined;

    const result = await this.db.query(
      `UPDATE loans SET
        name = COALESCE($1, name),
        lender = COALESCE($2, lender),
        starting_principal = COALESCE($3, starting_principal),
        interest_rate = COALESCE($4, interest_rate),
        minimum_payment = COALESCE($5, minimum_payment),
        start_date = COALESCE($6, start_date),
        payment_day_of_month = COALESCE($7, payment_day_of_month)
      WHERE id = $8
      AND user_id = $9
      RETURNING *`,
      [
        loan.name,
        loan.lender,
        loan.starting_principal,
        loan.interest_rate,
        loan.minimum_payment,
        loan.start_date,
        loan.payment_day_of_month,
        loanId,
        userId,
      ],
    );

    let updatedLoan = result[0] as LoanDb;
    if (!updatedLoan) throw new NotFoundException('Loan not found');

    if (loan.extra_payments !== undefined) {
      await this.replaceExtraPayments(loanId, loan.extra_payments);
    }

    let schedule;
    if (needsRecalculation) {
      schedule =
        await this.paymentSchedules.regenerateScheduleForLoan(loanId);
      updatedLoan = await this.findOne(userId, loanId);
    } else {
      schedule = await this.paymentSchedules.getSchedules(loanId, 'loan');
    }

    return {
      loan: updatedLoan,
      paymentSchedule: schedule,
    };
  }

  async applyLumpSum(userId: BigInt, loanId: BigInt, dto: ApplyLumpSumDto) {
    const loan = await this.db.queryOne(
      `SELECT id FROM loans WHERE id = $1 AND user_id = $2`,
      [loanId, userId],
    );
    if (!loan) throw new NotFoundException('Loan not found');

    await this.db.query(
      `INSERT INTO loan_lump_sum_payments (loan_id, amount, date) VALUES ($1, $2, $3)`,
      [loanId, dto.amount, dto.date],
    );

    await this.paymentSchedules.regenerateScheduleForLoan(loanId);

    return this.findOne(userId, loanId);
  }

  async getLumpSums(userId: BigInt, loanId: BigInt) {
    const loan = await this.db.queryOne(
      `SELECT id FROM loans WHERE id = $1 AND user_id = $2`,
      [loanId, userId],
    );
    if (!loan) throw new NotFoundException('Loan not found');
    return this.db.query(
      `SELECT id, amount::float, date FROM loan_lump_sum_payments WHERE loan_id = $1 ORDER BY date DESC`,
      [loanId],
    );
  }

  async deleteLumpSum(userId: BigInt, loanId: BigInt, lumpSumId: BigInt) {
    const loan = await this.db.queryOne(
      `SELECT id FROM loans WHERE id = $1 AND user_id = $2`,
      [loanId, userId],
    );
    if (!loan) throw new NotFoundException('Loan not found');

    const deleted = await this.db.query(
      `DELETE FROM loan_lump_sum_payments WHERE id = $1 AND loan_id = $2 RETURNING id`,
      [lumpSumId, loanId],
    );
    if (!deleted[0]) throw new NotFoundException('Lump sum payment not found');

    await this.paymentSchedules.regenerateScheduleForLoan(loanId);

    return this.findOne(userId, loanId);
  }

  async getExtraPayments(userId: BigInt, loanId: BigInt) {
    const loan = await this.db.queryOne(
      `SELECT id FROM loans WHERE id = $1 AND user_id = $2`,
      [loanId, userId],
    );
    if (!loan) throw new NotFoundException('Loan not found');
    return this.db.query(
      `SELECT id, amount::float AS amount, start_date
       FROM loan_extra_payments WHERE loan_id = $1 ORDER BY start_date`,
      [loanId],
    );
  }

  async setExtraPayments(
    userId: BigInt,
    loanId: BigInt,
    entries: { amount: number; start_date: Date }[],
  ) {
    const loan = await this.db.queryOne(
      `SELECT id FROM loans WHERE id = $1 AND user_id = $2`,
      [loanId, userId],
    );
    if (!loan) throw new NotFoundException('Loan not found');

    await this.replaceExtraPayments(loanId, entries);
    await this.paymentSchedules.regenerateScheduleForLoan(loanId);

    return this.findOne(userId, loanId);
  }

  // Recalibration restates the loan's opening balance from a real statement and
  // restarts the schedule from today, so any extra payments or lump sums
  // recorded before that point are already baked into the new balance and are
  // cleared rather than replayed.
  async recalibrate(userId: BigInt, loanId: BigInt, dto: RecalibrateLoanDto) {
    const loan = await this.db.queryOne(
      `SELECT id FROM loans WHERE id = $1 AND user_id = $2`,
      [loanId, userId],
    );
    if (!loan) throw new NotFoundException('Loan not found');

    const today = new Date();

    await this.db.query(
      `UPDATE loans
       SET starting_principal = COALESCE($1, starting_principal),
           accrued_interest   = COALESCE($2, accrued_interest),
           start_date         = $3
       WHERE id = $4`,
      [
        dto.current_principal ?? null,
        dto.accrued_interest ?? null,
        today,
        loanId,
      ],
    );

    await this.db.query(
      `DELETE FROM loan_extra_payments WHERE loan_id = $1 AND start_date < $2`,
      [loanId, today],
    );
    await this.db.query(
      `DELETE FROM loan_lump_sum_payments WHERE loan_id = $1 AND date < $2`,
      [loanId, today],
    );

    await this.paymentSchedules.regenerateScheduleForLoan(loanId);
    return this.findOne(userId, loanId);
  }

  remove(userId: BigInt, loanId: BigInt) {
    return this.db.query(
      `
      DELETE FROM loans
      WHERE id = $1
      AND user_id = $2
      `,
      [loanId, userId],
    );
  }

  async getAllSchedules(userId: BigInt) {
    return await this.db.query(
      `SELECT
        ps.loan_id,
        l.name,
        ps.payment_number,
        ps.payment_date,
        ps.remaining_principal,
        ps.is_actual
       FROM payment_schedules ps
       JOIN loans l ON l.id = ps.loan_id
       WHERE l.user_id = $1
         AND ps.loan_id IS NOT NULL
       ORDER BY ps.loan_id, ps.payment_number`,
      [userId],
    );
  }

  async getProgress(userId: BigInt, loanIds?: number[]) {
    const filterByIds = loanIds && loanIds.length > 0;
    const params = filterByIds ? [loanIds, userId] : [userId];
    const userParam = filterByIds ? '$2' : '$1';
    const idFilter = filterByIds ? 'AND l.id = ANY($1)' : '';

    const perLoanRows = await this.db.query(
      `SELECT
        l.id AS loan_id,
        l.name,
        l.starting_principal,
        COALESCE(SUM(ps.principal_paid) FILTER (WHERE ps.is_actual = true), 0) AS total_principal_paid,
        COALESCE(SUM(ps.interest_paid) FILTER (WHERE ps.is_actual = true), 0) AS total_interest_paid,
        COALESCE(SUM(ps.total_payment) FILTER (WHERE ps.is_actual = true), 0) AS total_paid,
        COALESCE(last_actual.remaining_principal, l.starting_principal) AS current_principal,
        last_schedule.payment_date AS payoff_date
      FROM loans l
      LEFT JOIN payment_schedules ps ON l.id = ps.loan_id AND ps.simulation_loan_id IS NULL
      LEFT JOIN LATERAL (
        SELECT remaining_principal
        FROM payment_schedules
        WHERE loan_id = l.id AND is_actual = true AND simulation_loan_id IS NULL
        ORDER BY payment_number DESC LIMIT 1
      ) last_actual ON true
      LEFT JOIN LATERAL (
        SELECT payment_date
        FROM payment_schedules
        WHERE loan_id = l.id AND simulation_loan_id IS NULL
        ORDER BY payment_number DESC LIMIT 1
      ) last_schedule ON true
      WHERE l.user_id = ${userParam} ${idFilter}
      GROUP BY l.id, l.name, l.starting_principal, last_actual.remaining_principal, last_schedule.payment_date`,
      params,
    );

    const monthlyRows = await this.db.query(
      `SELECT
        COALESCE(SUM(curr.remaining_principal), 0) AS current_remaining,
        COALESCE(SUM(prev.remaining_principal), 0) AS prev_month_remaining
      FROM loans l
      LEFT JOIN LATERAL (
        SELECT remaining_principal, payment_date
        FROM payment_schedules
        WHERE loan_id = l.id AND is_actual = true AND simulation_loan_id IS NULL
        ORDER BY payment_number DESC LIMIT 1
      ) curr ON true
      LEFT JOIN LATERAL (
        SELECT remaining_principal
        FROM payment_schedules
        WHERE loan_id = l.id AND is_actual = true AND simulation_loan_id IS NULL
          AND DATE_TRUNC('month', payment_date) = DATE_TRUNC('month', curr.payment_date - INTERVAL '1 month')
        ORDER BY payment_number DESC LIMIT 1
      ) prev ON true
      WHERE l.user_id = ${userParam} ${idFilter}`,
      params,
    );

    const nextPaymentRows = await this.db.query(
      `SELECT COALESCE(SUM(next_payment.total_payment), 0) AS next_monthly_payment
      FROM loans l
      LEFT JOIN LATERAL (
        SELECT total_payment
        FROM payment_schedules
        WHERE loan_id = l.id AND is_actual = false AND simulation_loan_id IS NULL
        ORDER BY payment_number ASC LIMIT 1
      ) next_payment ON true
      WHERE l.user_id = ${userParam} ${idFilter}`,
      params,
    );

    const now = new Date();

    const perLoan = perLoanRows.map((row) => {
      const payoffDate = row.payoff_date ? new Date(row.payoff_date) : null;
      const monthsToPayoff = payoffDate
        ? (payoffDate.getFullYear() - now.getFullYear()) * 12 +
          (payoffDate.getMonth() - now.getMonth())
        : null;

      return {
        loan_id: row.loan_id,
        name: row.name,
        starting_principal: new Decimal(row.starting_principal)
          .toDecimalPlaces(2)
          .toNumber(),
        current_principal: new Decimal(row.current_principal)
          .toDecimalPlaces(2)
          .toNumber(),
        total_principal_paid: new Decimal(row.total_principal_paid)
          .toDecimalPlaces(2)
          .toNumber(),
        total_interest_paid: new Decimal(row.total_interest_paid)
          .toDecimalPlaces(2)
          .toNumber(),
        total_paid: new Decimal(row.total_paid).toDecimalPlaces(2).toNumber(),
        payoff_date: row.payoff_date,
        months_to_payoff: monthsToPayoff,
        is_active: new Decimal(row.current_principal).greaterThan(0.01),
      };
    });

    const totalPaid = perLoan.reduce(
      (sum, l) => new Decimal(sum).plus(l.total_paid).toDecimalPlaces(2).toNumber(),
      0,
    );
    const totalRemaining = perLoan.reduce(
      (sum, l) => new Decimal(sum).plus(l.current_principal).toDecimalPlaces(2).toNumber(),
      0,
    );
    const activeLoans = perLoan.filter((l) => l.is_active).length;
    const latestPayoffDate = perLoan.reduce<Date | null>(
      (latest, l) =>
        !latest || (l.payoff_date && new Date(l.payoff_date) > latest)
          ? l.payoff_date
            ? new Date(l.payoff_date)
            : latest
          : latest,
      null,
    );
    const monthsToPayoff = latestPayoffDate
      ? (latestPayoffDate.getFullYear() - now.getFullYear()) * 12 +
        (latestPayoffDate.getMonth() - now.getMonth())
      : null;

    const monthly = monthlyRows[0] ?? { current_remaining: 0, prev_month_remaining: 0 };
    const prevRemaining = new Decimal(monthly.prev_month_remaining);
    const currRemaining = new Decimal(monthly.current_remaining);
    const monthlyPctChange = prevRemaining.greaterThan(0)
      ? currRemaining.minus(prevRemaining).dividedBy(prevRemaining).times(100).toDecimalPlaces(2).toNumber()
      : null;

    const nextMonthlyPayment = new Decimal(
      nextPaymentRows[0]?.next_monthly_payment ?? 0,
    ).toDecimalPlaces(2).toNumber();

    return {
      summary: {
        total_paid: new Decimal(totalPaid).toDecimalPlaces(2).toNumber(),
        total_remaining: new Decimal(totalRemaining).toDecimalPlaces(2).toNumber(),
        active_loans: activeLoans,
        payoff_date: latestPayoffDate,
        months_to_payoff: monthsToPayoff,
        monthly_pct_change: monthlyPctChange,
        next_monthly_payment: nextMonthlyPayment,
      },
      per_loan: perLoan,
    };
  }
}
