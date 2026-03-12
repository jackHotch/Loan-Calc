export type SimulationSummary = {
  total_interest_paid: number
  total_paid: number
  payoff_date: string
  months_until_payoff: number
}

export type SimulationResult = {
  simulation_id: number
  simulation: SimulationSummary
  baseline: SimulationSummary
  savings: {
    interest_saved: number
    months_saved: number
  }
}

export interface ExtraPayment {
  amount: number
  start_date: Date
}
