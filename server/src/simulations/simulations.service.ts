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

    const calculatedSimulation = await this.runSimulation(
      loans,
      simulation.strategy_type,
      simulation.extra_monthly_payment,
      simulation.cascade,
    );

    const savedSimulation = this.saveSimulation(
      userId,
      simulation,
      calculatedSimulation,
    );

    return savedSimulation;
  }

  async runSimulation(
    loans: LoanDb[],
    strategy: StrategyType,
    extraPayment: number,
    cascade: boolean,
  ) {
    const payoffOrder = strategy.includes('Interest')
      ? strategy.includes('Avalanche')
        ? loans?.sort((a, b) => b.interest_rate - a.interest_rate)
        : loans?.sort((a, b) => a.interest_rate - b.interest_rate)
      : strategy.includes('Avalanche')
        ? loans?.sort((a, b) => b.current_principal - a.current_principal)
        : loans?.sort((a, b) => a.current_principal - b.current_principal);

    const loanStates = await Promise.all(
      payoffOrder.map(async (l) => {
        const lastActualPayment: any =
          await this.paymentSchedules.getLastActualPayment(l.id);
        let simulationStartDate = new Date(lastActualPayment.payment_date);

        return {
          ...l,
          simulationBalance: new Decimal(l.current_principal),
          payoffOrder: -1,
          extraPaymentTarget: false,
          simulationStartdate: simulationStartDate,
          lastActualPaymentNumber: lastActualPayment.payment_number,
          schedule: new Array(),
        };
      }),
    );

    let extraPaymentPool = new Decimal(extraPayment);
    let monthCount = 0;
    let payoffOrderCounter = 1;

    while (
      loanStates.some((s) => s.simulationBalance.gt(0)) &&
      monthCount < 600
    ) {
      monthCount++;

      for (const l of loanStates) {
        l.extraPaymentTarget = false;
      }

      const target = loanStates.find((l) => l.simulationBalance.gt(0));

      if (target) {
        target.extraPaymentTarget = true;
      }

      for (const loan of loanStates) {
        if (loan.simulationBalance.lte(0)) continue;

        const paymentDate = new Date(loan.simulationStartdate);
        paymentDate.setMonth(paymentDate.getMonth() + monthCount);

        let extraPayment: Decimal =
          loan.extraPaymentTarget === true
            ? new Decimal(extraPaymentPool)
            : new Decimal(0);
        let remainingPrincipal: Decimal = new Decimal(loan.simulationBalance);

        const monthlyRate = new Decimal(loan.interest_rate)
          .div(100)
          .div(12)
          .toDecimalPlaces(3);

        const monthlyInterestPaid = loan.simulationBalance
          .mul(monthlyRate)
          .toDecimalPlaces(2);

        let totalPayment: Decimal = new Decimal(loan.minimum_payment);

        if (loan.extraPaymentTarget === true) {
          totalPayment = totalPayment.plus(extraPaymentPool);
        }

        let monthlyPrincipalPaid = new Decimal(totalPayment)
          .minus(monthlyInterestPaid)
          .toDecimalPlaces(2);

        if (monthlyPrincipalPaid.gt(remainingPrincipal)) {
          monthlyPrincipalPaid = remainingPrincipal;
          extraPayment = new Decimal(0);
        }

        remainingPrincipal = loan.simulationBalance.minus(monthlyPrincipalPaid);

        loan.schedule.push({
          payment_number:
            loan.lastActualPaymentNumber + loan.schedule.length + 1,
          payment_date: new Date(paymentDate),
          principal_paid: monthlyPrincipalPaid.toDecimalPlaces(2).toNumber(),
          interest_paid: monthlyInterestPaid.toDecimalPlaces(2).toNumber(),
          extra_payment: extraPayment.toDecimalPlaces(2).toNumber(),
          remaining_principal: remainingPrincipal.toDecimalPlaces(2).toNumber(),
        });

        loan.simulationBalance = remainingPrincipal;
      }

      for (const s of loanStates) {
        if (s.simulationBalance.eq(0) && s.payoffOrder === -1) {
          s.payoffOrder = payoffOrderCounter++;
          if (cascade) {
            extraPaymentPool = extraPaymentPool.plus(s.minimum_payment);
          }
        }
      }
    }

    return loanStates;
  }

  async saveSimulation(
    userId: BigInt,
    simulation: CreateSimulationDto,
    calculatedSimulation,
  ) {
    const [createdSimulation]: any = await this.db.query(
      `
      INSERT INTO simulations (user_id, name, description, strategy_type, cascade, extra_payment)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        userId,
        simulation.name,
        simulation.description,
        simulation.strategy_type,
        simulation.cascade,
        simulation.extra_monthly_payment,
      ],
    );

    const values = simulation.loan_ids
      .map((_, i) => {
        const offset = i * 2 + 2;
        return `($1, $${offset}, $${offset + 1})`;
      })
      .join(',');

    const params = [
      createdSimulation.id,
      ...calculatedSimulation.flatMap((s) => [s.id, s.payoffOrder]),
    ];
    console.log(params);

    const createdSimulationLoans = await this.db.query(
      `
      INSERT INTO simulation_loans (simulation_id, loan_id, payoff_order)
      VALUES ${values}
      RETURNING *
      `,
      params,
    );

    // loop through each created simulation loan and save the schedule

    // console.log(calculatedSimulation);

    // const createdSimulationPaymentSchedules =
    //   await this.paymentSchedules.saveSchedule(
    //     createdSimulation.id,
    //     'simulation',
    //     calculatedSimulation.schedule,
    //   );

    return {
      ...createdSimulation,
      loans: [...createdSimulationLoans],
      // paymentSchedule: createdSimulationPaymentSchedules,
    };
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
