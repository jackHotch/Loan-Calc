import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { DatabaseService } from '../database/database.service';
import { PaymentScheduleService } from 'src/payment-schedule/payment-schedule.service';
import { CalculateScheduleOptions } from 'src/lib/types/payment-schedule.types';
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
        interest_rate, minimum_payment, extra_payment, start_date, payment_day_of_month, payoff_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;`,
      [
        userId,
        loan.name,
        loan.lender,
        loan.starting_principal,
        loan.current_principal,
        loan.interest_rate,
        loan.minimum_payment,
        loan.extra_payment,
        loan.start_date,
        loan.payment_day_of_month,
        loan.payoff_date,
      ],
    );

    const createdLoan = result[0] as LoanDb;

    const createdSchedule =
      await this.paymentSchedules.generateScheduleForNewLoan(createdLoan);

    return {
      loan: createdLoan,
      paymentSchedule: createdSchedule,
    };
  }

  async findAll(userId: BigInt) {
    return await this.db.query(
      `
      SELECT id, user_id, name, lender, starting_principal, current_principal, interest_rate,
        minimum_payment, extra_payment, payment_day_of_month, start_date, payoff_date
      FROM loans
      WHERE user_id = $1;
      `,
      [userId],
    );
  }

  async findOne(userId: BigInt, loanId: number): Promise<LoanDb> {
    const results = await this.db.query(
      `
      SELECT id, user_id, name, lender, starting_principal, current_principal, interest_rate,
        minimum_payment, extra_payment, payment_day_of_month, start_date, payoff_date
      FROM loans
      WHERE user_id = $1
      AND id = $2;
      `,
      [userId, loanId],
    );

    const loan = results[0] as LoanDb | undefined;
    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    return loan ?? null;
  }

  async update(userId: number, loanId: number, loan: UpdateLoanDto) {
    const needsRecalculation =
      loan.starting_principal !== undefined ||
      loan.current_principal !== undefined ||
      loan.interest_rate !== undefined ||
      loan.minimum_payment !== undefined ||
      loan.extra_payment !== undefined ||
      loan.extra_payment_start_date !== undefined ||
      loan.start_date !== undefined ||
      loan.payment_day_of_month !== undefined;

    const result = await this.db.query(
      `UPDATE loans SET
        name = COALESCE($1, name),
        lender = COALESCE($2, lender),
        starting_principal = COALESCE($3, starting_principal),
        current_principal = COALESCE($4, current_principal),
        interest_rate = COALESCE($5, interest_rate),
        minimum_payment = COALESCE($6, minimum_payment),
        extra_payment = COALESCE($7, extra_payment),
        extra_payment_start_date = COALESCE($8, extra_payment_start_date),
        start_date = COALESCE($9, start_date),
        payment_day_of_month = COALESCE($10, payment_day_of_month),
        payoff_date = COALESCE($11, payoff_date)
      WHERE id = $12
      AND user_id = $13
      RETURNING *`,
      [
        loan.name,
        loan.lender,
        loan.starting_principal,
        loan.current_principal,
        loan.interest_rate,
        loan.minimum_payment,
        loan.extra_payment,
        loan.extra_payment_start_date,
        loan.start_date,
        loan.payment_day_of_month,
        loan.payoff_date,
        loanId,
        userId,
      ],
    );

    console.log(loan.starting_principal);
  }

  remove(id: number) {
    return `This action removes a #${id} loan`;
  }
}
