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
      simulation.extra_payment,
      simulation.cascade,
    );

    return await this.saveSimulation(userId, simulation, calculatedSimulation);
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

        let extraPaymentApplied: Decimal =
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
          extraPaymentApplied = new Decimal(0);
        }

        remainingPrincipal = loan.simulationBalance.minus(monthlyPrincipalPaid);

        loan.schedule.push({
          payment_number:
            loan.lastActualPaymentNumber + loan.schedule.length + 1,
          payment_date: new Date(paymentDate),
          principal_paid: monthlyPrincipalPaid.toDecimalPlaces(2).toNumber(),
          interest_paid: monthlyInterestPaid.toDecimalPlaces(2).toNumber(),
          extra_payment: extraPaymentApplied.toDecimalPlaces(2).toNumber(),
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
    createdSimulation?,
  ) {
    console.log(simulation);
    if (!createdSimulation) {
      [createdSimulation] = await this.db.query(
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
          simulation.extra_payment,
        ],
      );
    }

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

    const createdSimulationLoans = await this.db.query(
      `
      INSERT INTO simulation_loans (simulation_id, loan_id, payoff_order)
      VALUES ${values}
      RETURNING *
      `,
      params,
    );

    const createdSimulationPaymentSchedules: any = [];
    // console.log(calculatedSimulation[0]);

    for (const loan of calculatedSimulation) {
      const simulationLoan = createdSimulationLoans.find(
        (l) => l.loan_id == loan.id,
      );

      createdSimulationPaymentSchedules.push(
        await this.paymentSchedules.saveSchedule(
          simulationLoan.id,
          'simulation',
          loan.schedule,
        ),
      );
    }

    return this.findOne(userId, createdSimulation.id);
  }

  findAll() {
    return `This action returns all simulations`;
  }

  async findOne(userId: BigInt, id: BigInt) {
    const result = await this.db.query(
      `
      SELECT
        s.*,
        json_agg(
          json_build_object(
            'id', sl.id,
            'loan_id', sl.loan_id,
            'payoff_order', sl.payoff_order,
            'payment_schedule', (
              SELECT json_agg(ps.* ORDER BY ps.payment_number)
              FROM payment_schedules ps
              WHERE ps.simulation_loan_id = sl.id
            )
          )
          ORDER BY sl.payoff_order
        ) AS loans
      FROM simulations s
      JOIN simulation_loans sl ON sl.simulation_id = s.id
      WHERE s.user_id = $1
      AND s.id = $2
      GROUP BY s.id;`,
      [userId, id],
    );

    return result[0];
  }

  async update(
    userId: BigInt,
    simulationId: BigInt,
    simulation: CreateSimulationDto,
  ) {
    const existing = await this.db.query(
      `SELECT s.*, ARRAY_AGG(sl.loan_id) AS loan_ids 
      FROM simulations s
      JOIN simulation_loans sl ON sl.simulation_id = s.id
      WHERE s.id = $1 AND s.user_id = $2
      GROUP BY s.id`,
      [simulationId, userId],
    );
    const current = existing[0];

    const needsRecalculation =
      current.strategy_type !== simulation.strategy_type ||
      parseFloat(current.extra_payment) !== simulation.extra_payment ||
      current.cascade !== simulation.cascade ||
      !this.sameArrays(current.loan_ids, simulation.loan_ids);

    await this.db.query(
      `UPDATE simulations 
      SET name = $1, description = $2, strategy_type = $3, extra_payment = $4, cascade = $5
      WHERE id = $6 AND user_id = $7`,
      [
        simulation.name,
        simulation.description,
        simulation.strategy_type,
        simulation.extra_payment,
        simulation.cascade,
        simulationId,
        userId,
      ],
    );

    if (needsRecalculation) {
      await this.db.query(
        `DELETE FROM simulation_loans WHERE simulation_id = $1`,
        [simulationId],
      );

      let loans: LoanDb[] = [];

      for (const loanId of simulation.loan_ids) {
        loans.push(await this.loanService.findOne(userId, loanId));
      }

      const calculatedSimulation = await this.runSimulation(
        loans,
        simulation.strategy_type,
        simulation.extra_payment,
        simulation.cascade,
      );

      await this.saveSimulation(userId, simulation, calculatedSimulation, {
        id: current.id,
      });
    }

    return this.findOne(userId, simulationId);
  }

  sameArrays(a: number[] | BigInt[], b: number[] | BigInt[]) {
    const normA = [...a].map(Number).sort();
    const normB = [...b].map(Number).sort();
    return (
      normA.length === normB.length && normA.every((v, i) => v === normB[i])
    );
  }

  remove(id: number) {
    return `This action removes a #${id} simulation`;
  }
}
