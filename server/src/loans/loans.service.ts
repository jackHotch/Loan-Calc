import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { DatabaseService } from '../database/database.service';
import { PaymentScheduleService } from 'src/payment-schedule/payment-schedule.service';
import { LoanDb } from 'src/lib/types/loan.types';

@Injectable()
export class LoansService {
  constructor(
    private db: DatabaseService,
    private paymentSchedules: PaymentScheduleService,
  ) {}

  async create(userId: BigInt, loan: CreateLoanDto) {
    const result = await this.db.query(
      `
      INSERT INTO loans (user_id, name, lender, starting_principal, current_principal,
        interest_rate, minimum_payment, extra_payment, extra_payment_start_date, start_date, payment_day_of_month)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;`,
      [
        userId,
        loan.name,
        loan.lender,
        loan.starting_principal,
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
        l.current_principal,
        l.payment_day_of_month,
        l.payoff_date,
        l.start_date,
        l.extra_payment_start_date,
        COALESCE(SUM(ps.interest_paid), 0) AS total_interest_paid,
        COALESCE(SUM(ps.principal_paid) + SUM(ps.interest_paid), 0) AS total_amount_paid
      FROM
        loans l
      LEFT JOIN
        payment_schedules ps ON l.id = ps.loan_id
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
        l.current_principal,
        l.payment_day_of_month,
        l.payoff_date,
        l.start_date,
        l.extra_payment_start_date
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
        l.current_principal,
        l.payment_day_of_month,
        l.payoff_date,
        l.start_date,
        l.extra_payment_start_date,
        COALESCE(SUM(ps.interest_paid), 0) AS total_interest_paid,
        COALESCE(SUM(ps.principal_paid) + SUM(ps.interest_paid), 0) AS total_amount_paid
      FROM
        loans l
      LEFT JOIN
        payment_schedules ps ON l.id = ps.loan_id
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
        l.current_principal,
        l.payment_day_of_month,
        l.payoff_date,
        l.start_date,
        l.extra_payment_start_date
      `,
      [userId, loanId],
    );

    const loan = results[0] as LoanDb | undefined;
    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    return loan ?? null;
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
