import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
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
        interest_rate, minimum_payment, extra_payment, extra_payment_start_date, start_date, payment_day_of_month)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;`,
      [
        userId,
        loan.name,
        loan.lender,
        loan.starting_principal,
        loan.interest_rate,
        loan.minimum_payment,
        loan.extra_payment,
        loan.extra_payment_start_date,
        loan.start_date,
        loan.payment_day_of_month,
      ],
    );

    const createdLoan = result[0] as LoanDb;

    const createdSchedule =
      await this.paymentSchedules.generateScheduleForNewLoan(createdLoan);

    const finalLoan = await this.findOne(userId, createdLoan.id);

    return {
      loan: finalLoan,
      paymentSchedule: createdSchedule,
    };
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
        l.interest_rate,
        l.minimum_payment,
        l.extra_payment,
        l.payment_day_of_month,
        l.start_date,
        l.extra_payment_start_date,
        COALESCE(SUM(ps.interest_paid), 0) AS total_interest_paid,
        COALESCE(SUM(ps.principal_paid) + SUM(ps.interest_paid), 0) AS total_amount_paid,
        last_actual.remaining_principal AS current_principal,
        last_schedule.payment_date AS payoff_date
      FROM
        loans l
      LEFT JOIN
        payment_schedules ps ON l.id = ps.loan_id
      LEFT JOIN LATERAL (
        SELECT remaining_principal
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
        l.interest_rate,
        l.minimum_payment,
        l.extra_payment,
        l.payment_day_of_month,
        l.start_date,
        l.extra_payment_start_date,
        last_actual.remaining_principal,
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
        l.interest_rate,
        l.minimum_payment,
        l.extra_payment,
        l.payment_day_of_month,
        l.start_date,
        l.extra_payment_start_date,
        COALESCE(SUM(ps.interest_paid), 0) AS total_interest_paid,
        COALESCE(SUM(ps.principal_paid) + SUM(ps.interest_paid), 0) AS total_amount_paid,
        last_actual.remaining_principal AS current_principal,
        last_schedule.payment_date AS payoff_date
      FROM
        loans l
      LEFT JOIN
        payment_schedules ps ON l.id = ps.loan_id
      LEFT JOIN LATERAL (
        SELECT remaining_principal
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
        l.interest_rate,
        l.minimum_payment,
        l.extra_payment,
        l.payment_day_of_month,
        l.start_date,
        l.extra_payment_start_date,
        last_actual.remaining_principal,
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

  async getBaselineSummary(userId: BigInt, loanIds: number[]) {
    const totals = await this.db.query(
      `SELECT
      l.id AS loan_id,
      SUM(ps.principal_paid) AS principal_paid,
      SUM(ps.interest_paid) AS interest_paid,
      SUM(ps.total_payment) AS total_paid,
      MAX(ps.payment_date) AS payoff_date
     FROM payment_schedules ps
     JOIN loans l ON ps.loan_id = l.id
     WHERE ps.loan_id = ANY($1)
       AND ps.simulation_loan_id IS NULL
       AND l.user_id = $2
     GROUP BY l.id`,
      [loanIds, userId],
    );

    const perLoan = totals.map((row) => ({
      loan_id: row.loan_id,
      payoff_date: row.payoff_date,
      total_interest_paid: new Decimal(row.interest_paid)
        .toDecimalPlaces(2)
        .toNumber(),
      total_paid: new Decimal(row.total_paid).toDecimalPlaces(2).toNumber(),
    }));

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
        last_payoff_date:
          !acc.last_payoff_date || loan.payoff_date > acc.last_payoff_date
            ? loan.payoff_date
            : acc.last_payoff_date,
      }),
      { total_interest_paid: 0, total_paid: 0, last_payoff_date: null },
    );

    return { perLoan, totals: totalsRollup };
  }

  async update(userId: BigInt, loanId: BigInt, loan: UpdateLoanDto) {
    const needsRecalculation =
      loan.interest_rate !== undefined ||
      loan.minimum_payment !== undefined ||
      loan.extra_payment !== undefined ||
      loan.extra_payment_start_date !== undefined ||
      loan.payment_day_of_month !== undefined;

    const result = await this.db.query(
      `UPDATE loans SET
        name = COALESCE($1, name),
        lender = COALESCE($2, lender),
        starting_principal = COALESCE($3, starting_principal),
        interest_rate = COALESCE($5, interest_rate),
        minimum_payment = COALESCE($6, minimum_payment),
        extra_payment = COALESCE($7, extra_payment),
        extra_payment_start_date = COALESCE($8, extra_payment_start_date),
        start_date = COALESCE($9, start_date),
        payment_day_of_month = COALESCE($10, payment_day_of_month)
      WHERE id = $11
      AND user_id = $12
      RETURNING *`,
      [
        loan.name,
        loan.lender,
        loan.starting_principal,
        loan.interest_rate,
        loan.minimum_payment,
        loan.extra_payment,
        loan.extra_payment_start_date,
        loan.start_date,
        loan.payment_day_of_month,
        loanId,
        userId,
      ],
    );

    let updatedLoan = result[0] as LoanDb;
    let schedule;

    if (needsRecalculation) {
      schedule =
        await this.paymentSchedules.generateScheduleForExistingLoan(
          updatedLoan,
        );
      updatedLoan = await this.findOne(userId, updatedLoan.id);
    } else {
      schedule = this.paymentSchedules.getSchedules(updatedLoan.id, 'loan');
    }

    return {
      loan: updatedLoan,
      paymentSchedule: schedule,
    };
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
}
