import { Injectable } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class LoansService {
  constructor(private db: DatabaseService) {}

  create(createLoanDto: CreateLoanDto) {
    return 'This action adds a new loan';
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

  findOne(id: number) {
    return `This action returns a #${id} loan`;
  }

  update(id: number, updateLoanDto: UpdateLoanDto) {
    return `This action updates a #${id} loan`;
  }

  remove(id: number) {
    return `This action removes a #${id} loan`;
  }
}
