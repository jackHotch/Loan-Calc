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
      simulation.extra_payments,
      simulation.cascade,
    );

    const savedSimulation = await this.saveSimulation(
      userId,
      simulation,
      calculatedSimulation,
    );

    return this.getSimulationComparison(userId, savedSimulation.id);
  }

  getActiveExtraPayment(
    extraPayments: { amount: number; start_date: Date }[],
    date: Date,
  ): Decimal {
    const sorted = [...extraPayments]
      .filter((ep) => new Date(ep.start_date) <= date)
      .sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
      );

    return sorted.length > 0 ? new Decimal(sorted[0].amount) : new Decimal(0);
  }

  async runSimulation(
    loans: LoanDb[],
    strategy: StrategyType,
    extraPayments: { amount: number; start_date: Date }[],
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
        const simulationStartDate = new Date(lastActualPayment.payment_date);

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

    let cascadeBonus = new Decimal(0);
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
      if (target) target.extraPaymentTarget = true;

      for (const loan of loanStates) {
        if (loan.simulationBalance.lte(0)) continue;

        const paymentDate = new Date(loan.simulationStartdate);
        paymentDate.setMonth(paymentDate.getMonth() + monthCount);

        const extraPaymentPool = this.getActiveExtraPayment(
          extraPayments,
          paymentDate,
        ).plus(cascadeBonus);

        let extraPaymentApplied: Decimal =
          loan.extraPaymentTarget === true ? extraPaymentPool : new Decimal(0);

        let remainingPrincipal = new Decimal(loan.simulationBalance);

        const monthlyRate = new Decimal(loan.interest_rate)
          .div(100)
          .div(12)
          .toDecimalPlaces(3);

        const monthlyInterestPaid = loan.simulationBalance
          .mul(monthlyRate)
          .toDecimalPlaces(2);

        let totalPayment = new Decimal(loan.minimum_payment);
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
            cascadeBonus = cascadeBonus.plus(s.minimum_payment);
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
    if (!createdSimulation) {
      [createdSimulation] = await this.db.query(
        `INSERT INTO simulations (user_id, name, description, strategy_type, cascade)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          userId,
          simulation.name,
          simulation.description,
          simulation.strategy_type,
          simulation.cascade,
        ],
      );
    }

    await this.db.query(
      `DELETE FROM simulation_extra_payments WHERE simulation_id = $1`,
      [createdSimulation.id],
    );

    if (simulation.extra_payments?.length) {
      const epValues = simulation.extra_payments
        .map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`)
        .join(', ');

      const epParams = [
        createdSimulation.id,
        ...simulation.extra_payments.flatMap((ep) => [
          ep.amount,
          ep.start_date,
        ]),
      ];

      await this.db.query(
        `INSERT INTO simulation_extra_payments (simulation_id, amount, start_date)
         VALUES ${epValues}`,
        epParams,
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
      `INSERT INTO simulation_loans (simulation_id, loan_id, payoff_order)
       VALUES ${values}
       RETURNING *`,
      params,
    );

    for (const loan of calculatedSimulation) {
      const simulationLoan = createdSimulationLoans.find(
        (l) => l.loan_id == loan.id,
      );

      await this.paymentSchedules.saveSchedule(
        simulationLoan.id,
        'simulation',
        loan.schedule,
      );
    }

    return this.findOne(userId, createdSimulation.id);
  }

  async findOne(userId: BigInt, id: BigInt) {
    const result = await this.db.query(
      `SELECT
        s.*,
        (
          SELECT json_agg(ep.* ORDER BY ep.start_date)
          FROM simulation_extra_payments ep
          WHERE ep.simulation_id = s.id
        ) AS extra_payments,
        json_agg(
          json_build_object(
            'id', sl.id,
            'loan_id', sl.loan_id,
            'payoff_order', sl.payoff_order,
            'payment_schedule', (
              SELECT json_agg(
                json_build_object(
                  'id', ps.id,
                  'payment_number', ps.payment_number,
                  'payment_date', ps.payment_date,
                  'principal_paid', ps.principal_paid,
                  'interest_paid', ps.interest_paid,
                  'extra_payment', ps.extra_payment,
                  'remaining_principal', ps.remaining_principal
                )
                ORDER BY ps.payment_number
              )
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
      GROUP BY s.id`,
      [userId, id],
    );

    return result[0];
  }

  async findAll(userId: BigInt) {
    return await this.db.query(
      `SELECT
        s.*,
        (
          SELECT json_agg(ep.* ORDER BY ep.start_date)
          FROM simulation_extra_payments ep
          WHERE ep.simulation_id = s.id
        ) AS extra_payments,
        json_agg(
          json_build_object(
            'id', sl.id,
            'loan_id', sl.loan_id,
            'payoff_order', sl.payoff_order,
            'payment_schedule', (
              SELECT json_agg(
                json_build_object(
                  'id', ps.id,
                  'payment_number', ps.payment_number,
                  'payment_date', ps.payment_date,
                  'principal_paid', ps.principal_paid,
                  'interest_paid', ps.interest_paid,
                  'extra_payment', ps.extra_payment,
                  'remaining_principal', ps.remaining_principal
                )
                ORDER BY ps.payment_number
              )
              FROM payment_schedules ps
              WHERE ps.simulation_loan_id = sl.id
            )
          )
          ORDER BY sl.payoff_order
        ) AS loans
      FROM simulations s
      JOIN simulation_loans sl ON sl.simulation_id = s.id
      WHERE s.user_id = $1
      GROUP BY s.id`,
      [userId],
    );
  }

  async update(
    userId: BigInt,
    simulationId: BigInt,
    simulation: CreateSimulationDto,
  ) {
    const existing = await this.db.query(
      `SELECT s.*, 
        ARRAY_AGG(sl.loan_id) AS loan_ids,
        (
          SELECT json_agg(ep.* ORDER BY ep.start_date)
          FROM simulation_extra_payments ep
          WHERE ep.simulation_id = s.id
        ) AS extra_payments
      FROM simulations s
      JOIN simulation_loans sl ON sl.simulation_id = s.id
      WHERE s.id = $1 AND s.user_id = $2
      GROUP BY s.id`,
      [simulationId, userId],
    );
    const current = existing[0];

    const needsRecalculation =
      current.strategy_type !== simulation.strategy_type ||
      current.cascade !== simulation.cascade ||
      !this.sameArrays(current.loan_ids, simulation.loan_ids) ||
      !this.sameExtraPayments(
        current.extra_payments,
        simulation.extra_payments,
      );

    await this.db.query(
      `UPDATE simulations
       SET name = $1, description = $2, strategy_type = $3, cascade = $4
       WHERE id = $5 AND user_id = $6`,
      [
        simulation.name,
        simulation.description,
        simulation.strategy_type,
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

      const loans: LoanDb[] = [];
      for (const loanId of simulation.loan_ids) {
        loans.push(await this.loanService.findOne(userId, loanId));
      }

      const calculatedSimulation = await this.runSimulation(
        loans,
        simulation.strategy_type,
        simulation.extra_payments,
        simulation.cascade,
      );

      await this.saveSimulation(userId, simulation, calculatedSimulation, {
        id: current.id,
      });
    } else {
      await this.db.query(
        `DELETE FROM simulation_extra_payments WHERE simulation_id = $1`,
        [simulationId],
      );

      if (simulation.extra_payments?.length) {
        const epValues = simulation.extra_payments
          .map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`)
          .join(', ');

        const epParams = [
          simulationId,
          ...simulation.extra_payments.flatMap((ep) => [
            ep.amount,
            ep.start_date,
          ]),
        ];

        await this.db.query(
          `INSERT INTO simulation_extra_payments (simulation_id, amount, start_date)
           VALUES ${epValues}`,
          epParams,
        );
      }
    }

    return this.getSimulationComparison(userId, current.id);
  }

  sameExtraPayments(
    a: { amount: number; start_date: Date }[],
    b: { amount: number; start_date: Date }[],
  ): boolean {
    if (a.length !== b.length) return false;
    const sort = (arr) =>
      [...arr].sort(
        (x, y) =>
          new Date(x.start_date).getTime() - new Date(y.start_date).getTime(),
      );
    return sort(a).every(
      (ep, i) =>
        Number(ep.amount) === Number(sort(b)[i].amount) &&
        new Date(ep.start_date).getTime() ===
          new Date(sort(b)[i].start_date).getTime(),
    );
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
      `SELECT 
        simulation_loans.loan_id,
        l.name AS loan_name,
        l.lender,
        l.starting_principal,
        l.interest_rate,
        l.minimum_payment
      FROM simulation_loans 
      JOIN simulations s ON simulation_loans.simulation_id = s.id
      JOIN loans l ON simulation_loans.loan_id = l.id
      WHERE simulation_loans.simulation_id = $1 AND s.user_id = $2`,
      [simulationId, userId],
    );

    const simulation = await this.db.query(
      `SELECT id, name, description, strategy_type, created_at, cascade
      FROM simulations
      WHERE id = $1 AND user_id = $2`,
      [simulationId, userId],
    );

    const loanIds = simLoans.map((r) => r.loan_id);
    const loanDetails = Object.fromEntries(
      simLoans.map((r) => [
        r.loan_id,
        {
          name: r.loan_name,
          lender: r.lender,
          starting_principal: r.starting_principal,
          interest_rate: r.interest_rate,
          minimum_payment: r.minimum_payment,
        },
      ]),
    );

    const actualTotals = await this.db.query(
      `SELECT
        l.id AS loan_id,
        COALESCE(SUM(ps.principal_paid), 0) AS principal_paid,
        COALESCE(SUM(ps.interest_paid), 0) AS interest_paid,
        COALESCE(SUM(ps.principal_paid) + SUM(ps.interest_paid), 0) AS total_paid,
        COUNT(*) AS payment_count,
        MAX(ps.payment_date) AS payoff_date
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
        COUNT(*) AS payment_count,
        MAX(ps.payment_date) AS payoff_date
      FROM payment_schedules ps
      JOIN simulation_loans sl ON ps.simulation_loan_id = sl.id
      JOIN simulations s ON sl.simulation_id = s.id
      WHERE sl.simulation_id = $1
        AND s.user_id = $2
      GROUP BY sl.loan_id, sl.payoff_order`,
      [simulationId, userId],
    );

    const baselineTotals = await this.db.query(
      `SELECT
        l.id AS loan_id,
        COALESCE(SUM(ps.interest_paid), 0) AS interest_paid,
        COUNT(*) AS payment_count,
        MAX(ps.payment_date) AS payoff_date
      FROM payment_schedules ps
      JOIN loans l ON ps.loan_id = l.id
      WHERE ps.loan_id = ANY($1)
        AND ps.is_actual = false
        AND l.user_id = $2
      GROUP BY l.id`,
      [loanIds, userId],
    );

    const now = new Date();

    const perLoan = simTotals.map((sim) => {
      const actual = actualTotals.find((a) => a.loan_id === sim.loan_id);
      const baseline = baselineTotals.find((b) => b.loan_id === sim.loan_id);
      const details = loanDetails[sim.loan_id];

      const actualInterest = new Decimal(actual?.interest_paid ?? 0);
      const actualPrincipal = new Decimal(actual?.principal_paid ?? 0);
      const actualTotal = new Decimal(actual?.total_paid ?? 0);
      const actualPaymentCount = Number(actual?.payment_count ?? 0);

      const simInterest = new Decimal(sim.interest_paid);
      const simPrincipal = new Decimal(sim.principal_paid);
      const simTotal = new Decimal(sim.total_paid);
      const simPaymentCount = Number(sim.payment_count ?? 0);

      const baselineInterest = new Decimal(baseline?.interest_paid ?? 0);
      const baselinePaymentCount = Number(baseline?.payment_count ?? 0);
      const baselinePayoffDate = baseline?.payoff_date ?? null;

      const combinedSimPaymentCount = actualPaymentCount + simPaymentCount;
      const combinedBaselinePaymentCount =
        actualPaymentCount + baselinePaymentCount;

      const simPayoffDate = sim.payoff_date ? new Date(sim.payoff_date) : null;
      const baselinePayoffDateObj = baselinePayoffDate
        ? new Date(baselinePayoffDate)
        : null;

      const monthsTilPayoff = simPayoffDate
        ? (simPayoffDate.getFullYear() - now.getFullYear()) * 12 +
          (simPayoffDate.getMonth() - now.getMonth())
        : null;

      const monthsSaved =
        baselinePayoffDateObj && simPayoffDate
          ? (baselinePayoffDateObj.getFullYear() -
              simPayoffDate.getFullYear()) *
              12 +
            (baselinePayoffDateObj.getMonth() - simPayoffDate.getMonth())
          : combinedBaselinePaymentCount - combinedSimPaymentCount;

      const totalSimInterest = actualInterest.plus(simInterest);
      const totalBaselineInterest = actualInterest.plus(baselineInterest);
      const interestSaved = totalBaselineInterest
        .minus(totalSimInterest)
        .toDecimalPlaces(2)
        .toNumber();

      return {
        loan_id: sim.loan_id,
        name: details?.name ?? null,
        lender: details?.lender ?? null,
        starting_principal: details?.starting_principal ?? null,
        interest_rate: details?.interest_rate ?? null,
        minimum_payment: details?.minimum_payment ?? null,
        payoff_order: sim.payoff_order,
        payoff_date: sim.payoff_date,
        months_til_payoff: monthsTilPayoff,
        months_saved: monthsSaved,
        interest_saved: interestSaved,
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
        payoff_date:
          !acc.payoff_date || loan.payoff_date > acc.payoff_date
            ? loan.payoff_date
            : acc.payoff_date,
      }),
      { total_interest_paid: 0, total_paid: 0, payoff_date: null },
    );

    const savings = {
      interest_saved: perLoan
        .reduce(
          (acc, loan) => new Decimal(acc).plus(loan.interest_saved),
          new Decimal(0),
        )
        .toDecimalPlaces(2)
        .toNumber(),
      months_saved:
        perLoan.length > 0
          ? Math.max(...perLoan.map((l) => l.months_saved ?? 0))
          : 0,
    };

    return {
      simulation: simulation[0] ?? null,
      savings,
      totals,
      perLoan,
    };
  }

  async getAllSimulationsSummary(userId: BigInt) {
    const simulations = await this.db.query(
      `SELECT id, name, description, strategy_type, created_at, cascade
      FROM simulations
      WHERE user_id = $1`,
      [userId],
    );

    if (!simulations.length) return [];

    const simulationIds = simulations.map((s) => s.id);

    const simLoans = await this.db.query(
      `SELECT 
        simulation_loans.simulation_id,
        simulation_loans.loan_id,
        l.name AS loan_name,
        l.lender,
        l.starting_principal,
        l.interest_rate,
        l.minimum_payment
      FROM simulation_loans 
      JOIN simulations s ON simulation_loans.simulation_id = s.id
      JOIN loans l ON simulation_loans.loan_id = l.id
      WHERE simulation_loans.simulation_id = ANY($1) AND s.user_id = $2`,
      [simulationIds, userId],
    );

    const allLoanIds = [...new Set(simLoans.map((r) => r.loan_id))];

    const actualTotals = await this.db.query(
      `SELECT
        l.id AS loan_id,
        COALESCE(SUM(ps.principal_paid), 0) AS principal_paid,
        COALESCE(SUM(ps.interest_paid), 0) AS interest_paid,
        COALESCE(SUM(ps.principal_paid) + SUM(ps.interest_paid), 0) AS total_paid,
        COUNT(*) AS payment_count,
        MAX(ps.payment_date) AS payoff_date
      FROM payment_schedules ps
      JOIN loans l ON ps.loan_id = l.id
      WHERE ps.loan_id = ANY($1)
        AND ps.is_actual = true
        AND l.user_id = $2
      GROUP BY l.id`,
      [allLoanIds, userId],
    );

    const simTotals = await this.db.query(
      `SELECT
        sl.simulation_id,
        sl.loan_id,
        sl.payoff_order,
        COALESCE(SUM(ps.principal_paid), 0) AS principal_paid,
        COALESCE(SUM(ps.interest_paid), 0) AS interest_paid,
        COALESCE(SUM(ps.principal_paid) + SUM(ps.interest_paid), 0) AS total_paid,
        COUNT(*) AS payment_count,
        MAX(ps.payment_date) AS payoff_date
      FROM payment_schedules ps
      JOIN simulation_loans sl ON ps.simulation_loan_id = sl.id
      JOIN simulations s ON sl.simulation_id = s.id
      WHERE sl.simulation_id = ANY($1)
        AND s.user_id = $2
      GROUP BY sl.simulation_id, sl.loan_id, sl.payoff_order`,
      [simulationIds, userId],
    );

    const baselineTotals = await this.db.query(
      `SELECT
        l.id AS loan_id,
        COALESCE(SUM(ps.interest_paid), 0) AS interest_paid,
        COUNT(*) AS payment_count,
        MAX(ps.payment_date) AS payoff_date
      FROM payment_schedules ps
      JOIN loans l ON ps.loan_id = l.id
      WHERE ps.loan_id = ANY($1)
        AND ps.is_actual = false
        AND l.user_id = $2
      GROUP BY l.id`,
      [allLoanIds, userId],
    );

    const extraPayments = await this.db.query(
      `SELECT simulation_id, amount, start_date
       FROM simulation_extra_payments
       WHERE simulation_id = ANY($1)`,
      [simulationIds],
    );

    const now = new Date();

    return simulations.map((simulation) => {
      const simLoanRows = simLoans.filter(
        (r) => r.simulation_id === simulation.id,
      );
      const loanDetails = Object.fromEntries(
        simLoanRows.map((r) => [
          r.loan_id,
          {
            name: r.loan_name,
            lender: r.lender,
            starting_principal: r.starting_principal,
            interest_rate: r.interest_rate,
            minimum_payment: r.minimum_payment,
          },
        ]),
      );

      const simTotalsForSim = simTotals.filter(
        (r) => r.simulation_id === simulation.id,
      );

      const simExtraPayments = extraPayments
        .filter((ep) => ep.simulation_id === simulation.id)
        .map((ep) => ({
          amount: new Decimal(ep.amount).toDecimalPlaces(2).toNumber(),
          start_date: ep.start_date,
        }));

      const activeExtraPayment =
        simExtraPayments
          .filter((ep) => new Date(ep.start_date) <= now)
          .sort(
            (a, b) =>
              new Date(b.start_date).getTime() -
              new Date(a.start_date).getTime(),
          )[0] ??
        simExtraPayments.sort(
          (a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
        )[0] ??
        null;

      const perLoan = simTotalsForSim.map((sim) => {
        const actual = actualTotals.find((a) => a.loan_id === sim.loan_id);
        const baseline = baselineTotals.find((b) => b.loan_id === sim.loan_id);
        const details = loanDetails[sim.loan_id];

        const actualInterest = new Decimal(actual?.interest_paid ?? 0);
        const actualPrincipal = new Decimal(actual?.principal_paid ?? 0);
        const actualTotal = new Decimal(actual?.total_paid ?? 0);
        const actualPaymentCount = Number(actual?.payment_count ?? 0);

        const simInterest = new Decimal(sim.interest_paid);
        const simPrincipal = new Decimal(sim.principal_paid);
        const simTotal = new Decimal(sim.total_paid);
        const simPaymentCount = Number(sim.payment_count ?? 0);

        const baselineInterest = new Decimal(baseline?.interest_paid ?? 0);
        const baselinePaymentCount = Number(baseline?.payment_count ?? 0);
        const baselinePayoffDate = baseline?.payoff_date ?? null;

        const combinedSimPaymentCount = actualPaymentCount + simPaymentCount;
        const combinedBaselinePaymentCount =
          actualPaymentCount + baselinePaymentCount;

        const simPayoffDate = sim.payoff_date
          ? new Date(sim.payoff_date)
          : null;
        const baselinePayoffDateObj = baselinePayoffDate
          ? new Date(baselinePayoffDate)
          : null;

        const monthsTilPayoff = simPayoffDate
          ? (simPayoffDate.getFullYear() - now.getFullYear()) * 12 +
            (simPayoffDate.getMonth() - now.getMonth())
          : null;

        const monthsSaved =
          baselinePayoffDateObj && simPayoffDate
            ? (baselinePayoffDateObj.getFullYear() -
                simPayoffDate.getFullYear()) *
                12 +
              (baselinePayoffDateObj.getMonth() - simPayoffDate.getMonth())
            : combinedBaselinePaymentCount - combinedSimPaymentCount;

        const totalSimInterest = actualInterest.plus(simInterest);
        const totalBaselineInterest = actualInterest.plus(baselineInterest);
        const interestSaved = totalBaselineInterest
          .minus(totalSimInterest)
          .toDecimalPlaces(2)
          .toNumber();

        return {
          loan_id: sim.loan_id,
          name: details?.name ?? null,
          lender: details?.lender ?? null,
          starting_principal: details?.starting_principal ?? null,
          interest_rate: details?.interest_rate ?? null,
          minimum_payment: details?.minimum_payment ?? null,
          payoff_order: sim.payoff_order,
          payoff_date: sim.payoff_date,
          months_til_payoff: monthsTilPayoff,
          months_saved: monthsSaved,
          interest_saved: interestSaved,
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
          payoff_date:
            !acc.payoff_date || loan.payoff_date > acc.payoff_date
              ? loan.payoff_date
              : acc.payoff_date,
        }),
        { total_interest_paid: 0, total_paid: 0, payoff_date: null },
      );

      const savings = {
        interest_saved: perLoan
          .reduce(
            (acc, loan) => new Decimal(acc).plus(loan.interest_saved),
            new Decimal(0),
          )
          .toDecimalPlaces(2)
          .toNumber(),
        months_saved:
          perLoan.length > 0
            ? Math.max(...perLoan.map((l) => l.months_saved ?? 0))
            : 0,
      };

      const lastPayoffDate = totals.payoff_date
        ? new Date(totals.payoff_date)
        : null;
      const months_til_payoff = lastPayoffDate
        ? (lastPayoffDate.getFullYear() - now.getFullYear()) * 12 +
          (lastPayoffDate.getMonth() - now.getMonth())
        : null;

      return {
        simulation,
        savings,
        totals: {
          ...totals,
          months_til_payoff,
          extra_payments: simExtraPayments,
          active_extra_payment: activeExtraPayment?.amount ?? null,
        },
        perLoan,
      };
    });
  }

  async getSimulationComparison(userId: BigInt, simulationId: BigInt) {
    const simulation = await this.getSimulationSummary(userId, simulationId);
    const loanIds = simulation.perLoan.map((l) => l.loan_id);
    const baseline = await this.loanService.getBaselineSummary(userId, loanIds);

    return {
      simulation_id: Number(simulationId),
      simulation: {
        ...simulation.totals,
        months_until_payoff: this.monthsUntilPayoff(
          simulation.totals.payoff_date,
        ),
      },
      baseline: {
        ...baseline.totals,
        months_until_payoff: this.monthsUntilPayoff(
          baseline.totals.payoff_date,
        ),
      },
      savings: {
        interest_saved: new Decimal(baseline.totals.total_interest_paid)
          .minus(simulation.totals.total_interest_paid)
          .toDecimalPlaces(2)
          .toNumber(),
        months_saved: this.monthsBetween(
          simulation.totals.payoff_date,
          baseline.totals.payoff_date,
        ),
      },
    };
  }

  monthsBetween(dateA: Date, dateB: Date) {
    const a = new Date(dateA);
    const b = new Date(dateB);
    return (
      (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
    );
  }

  monthsUntilPayoff(payoffDate: Date): number {
    const today = new Date();
    const end = new Date(payoffDate);
    return (
      (end.getFullYear() - today.getFullYear()) * 12 +
      (end.getMonth() - today.getMonth())
    );
  }

  async setAsActive(userId: BigInt, simulationId: BigInt) {
    return await this.db.query(
      `UPDATE users 
      SET active_simulation_id = $1
      WHERE id = $2
      RETURNING *;
      `,
      [simulationId, userId],
    );
  }

  async getActiveSimulationId(userId: BigInt) {
    const result = await this.db.query(
      `SELECT active_simulation_id
      FROM users
      WHERE id = $1;
      `,
      [userId],
    );

    return result[0];
  }

  remove(id: number) {
    return `This action removes a #${id} simulation`;
  }
}
