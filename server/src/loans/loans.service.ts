import { Injectable } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class LoansService {
  constructor(private db: DatabaseService) {}

  async create(userId: BigInt, loan: CreateLoanDto) {
    return await this.db.query(
      `
      INSERT INTO loans (user_id, name, lender, starting_principal, current_principal, accrued_interest,
        interest_rate, minimum_payment, extra_payment, start_date, payment_day_of_month, payoff_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;`,
      [
        userId,
        loan.name,
        loan.lender,
        loan.starting_principal,
        loan.current_principal,
        loan.accrued_interest,
        loan.interest_rate,
        loan.minimum_payment,
        loan.extra_payment,
        loan.start_date,
        loan.payment_day_of_month,
        loan.payoff_date,
      ],
    );
  }

  async findAll(userId: BigInt) {
    return await this.db.query(
      `
      SELECT id, user_id, name, lender, starting_principal, current_principal, accrued_interest,
        interest_rate, current_balance, minimum_payment, extra_payment, payment_day_of_month, start_date, payoff_date
      FROM loans
      WHERE user_id = $1;
      `,
      [userId],
    );
  }

  async findOne(userId: BigInt, loanId: number) {
    return await this.db.query(
      `
      SELECT id, user_id, name, lender, starting_principal, current_principal, accrued_interest,
        interest_rate, current_balance, minimum_payment, extra_payment, payment_day_of_month, start_date, payoff_date
      FROM loans
      WHERE user_id = $1
      AND id = $2;
      `,
      [userId, loanId],
    );
  }

  update(id: number, updateLoanDto: UpdateLoanDto) {
    return `This action updates a #${id} loan`;
  }

  remove(id: number) {
    return `This action removes a #${id} loan`;
  }
}
