import { Injectable } from '@nestjs/common';
import { CreateSimulationDto, StrategyType } from './dto/create-simulation.dto';
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

  async getSimulationSummary(userId: BigInt, simulationId: BigInt) {
    const simLoans = await this.db.query(
      `SELECT loan_id FROM simulation_loans 
      JOIN simulations s ON simulation_loans.simulation_id = s.id
      WHERE simulation_loans.simulation_id = $1 AND s.user_id = $2`,
      [simulationId, userId],
    );
    const loanIds = simLoans.map((r) => r.loan_id);

    const actualTotals = await this.db.query(
      `SELECT
        l.id AS loan_id,
        COALESCE(SUM(ps.principal_paid), 0) AS principal_paid,
        COALESCE(SUM(ps.interest_paid), 0) AS interest_paid,
        COALESCE(SUM(ps.principal_paid) + SUM(ps.interest_paid), 0) AS total_paid
      FROM payment_schedules ps
      JOIN loans l ON ps.loan_id = l.id
      WHERE ps.loan_id = ANY($1)
        AND ps.is_actual = true
        AND l.user_id = $2
      GROUP BY l.id`,
      [loanIds, userId],
    );

    const simTotals = await this.db.query(
      `SELECT
        sl.loan_id,
        sl.payoff_order,
        COALESCE(SUM(ps.principal_paid), 0) AS principal_paid,
        COALESCE(SUM(ps.interest_paid), 0) AS interest_paid,
        COALESCE(SUM(ps.principal_paid) + SUM(ps.interest_paid), 0) AS total_paid,
        MAX(ps.payment_date) AS payoff_date
      FROM payment_schedules ps
      JOIN simulation_loans sl ON ps.simulation_loan_id = sl.id
      JOIN simulations s ON sl.simulation_id = s.id
      WHERE sl.simulation_id = $1
        AND s.user_id = $2
      GROUP BY sl.loan_id, sl.payoff_order`,
      [simulationId, userId],
    );

    const perLoan = simTotals.map((sim) => {
      const actual = actualTotals.find((a) => a.loan_id === sim.loan_id);

      const actualInterest = new Decimal(actual?.interest_paid ?? 0);
      const actualPrincipal = new Decimal(actual?.principal_paid ?? 0);
      const actualTotal = new Decimal(actual?.total_paid ?? 0);

      const simInterest = new Decimal(sim.interest_paid);
      const simPrincipal = new Decimal(sim.principal_paid);
      const simTotal = new Decimal(sim.total_paid);

      return {
        loan_id: sim.loan_id,
        payoff_order: sim.payoff_order,
        payoff_date: sim.payoff_date,
        total_interest_paid: actualInterest
          .plus(simInterest)
          .toDecimalPlaces(2)
          .toNumber(),
        total_principal_paid: actualPrincipal
          .plus(simPrincipal)
          .toDecimalPlaces(2)
          .toNumber(),
        total_paid: actualTotal.plus(simTotal).toDecimalPlaces(2).toNumber(),
      };
    });

    const totals = perLoan.reduce(
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

    return { perLoan, totals };
  }

  remove(id: number) {
    return `This action removes a #${id} simulation`;
  }
}
