import { Injectable } from '@nestjs/common';
import { CreateSimulationDto, StrategyType } from './dto/create-simulation.dto';
import { UpdateSimulationDto } from './dto/update-simulation.dto';
import { DatabaseService } from 'src/database/database.service';
import { PaymentScheduleService } from 'src/payment-schedule/payment-schedule.service';
import { LoanDb } from 'src/lib/types/loan.types';
import { LoansService } from 'src/loans/loans.service';
import Decimal from 'decimal.js';

@Injectable()
export class SimulationsService {
  constructor(
    private db: DatabaseService,
    private paymentSchedules: PaymentScheduleService,
    private loanService: LoansService,
  ) {}

  async create(userId: BigInt, simulation: CreateSimulationDto) {
    let loans: LoanDb[] = [];

    for (const loanId of simulation.loan_ids) {
      loans.push(await this.loanService.findOne(userId, loanId));
    }

    // run simulation
    const calculateSimulation = this.runSimulation(
      loans,
      simulation.strategy_type,
      simulation.extra_monthly_payment,
      simulation.cascade,
    );

    // add row to simulation table

    // add rows to simulation_loans

    // add rows to simulation payment_schedules

    return loans;
  }

  runSimulation(
    loans: LoanDb[],
    strategy: StrategyType,
    extraPayment: number,
    cascade: boolean,
  ) {
    const loanStates = loans.map((l) => ({
      ...l,
      simulationBalance: new Decimal(l.current_principal),
      payoffOrder: null,
      schedule: [],
    }));

    let extraPaymentPool = extraPayment;
    let month = 0;
    let payoffOrderCounter = 1;

    while (loanStates.some((s) => s.simulationBalance.gt(0)) && month < 600) {
      for (const loan of loanStates) {
        const monthlyRate = new Decimal(loan.interest_rate)
          .div(100)
          .div(12)
          .toDecimalPlaces(3);

        const monthlyInterestPaid = loan.simulationBalance
          .mul(monthlyRate)
          .toDecimalPlaces(2);

        let totalPayment: Decimal = new Decimal(loan.minimum_payment).plus(
          extraPaymentPool,
        );

        let monthlyPrincipalPaid = new Decimal(totalPayment)
          .minus(monthlyInterestPaid)
          .toDecimalPlaces(2);

        if (monthlyPrincipalPaid.gt(remainingPrincipal)) {
          monthlyPrincipalPaid = remainingPrincipal;
          extraPayment = new Decimal(0);
        }

        remainingPrincipal = remainingPrincipal.minus(monthlyPrincipalPaid);
      }
    }
  }

  findAll() {
    return `This action returns all simulations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} simulation`;
  }

  update(id: number, updateSimulationDto: UpdateSimulationDto) {
    return `This action updates a #${id} simulation`;
  }

  remove(id: number) {
    return `This action removes a #${id} simulation`;
  }
}
