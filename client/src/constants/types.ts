export type SimulationSummary = {
  total_interest_paid: number
  total_paid: number
  payoff_date: string
  months_until_payoff: number
}

export type SimulationResult = {
  simulation: SimulationSummary
  baseline: SimulationSummary
  savings: {
    interest_saved: number
    months_saved: number
  }
}
