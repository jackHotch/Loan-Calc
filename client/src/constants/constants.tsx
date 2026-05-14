import { Triangle, Circle } from 'lucide-react'
import { StrategyType } from './schema'

export const payoffStrategies = [
  {
    name: StrategyType.AVALANCHE,
    description: 'Tackle the biggest debt head-on — frees up the largest monthly minimums once paid off',
    icon: '▼',
    type: 'Interest',
    ascending: false,
  },
  {
    name: StrategyType.SNOWBALL,
    description: 'Lowest balance first — builds momentum with quick wins',
    icon: '●',
    type: 'Principal',
    ascending: true,
  },
  {
    name: StrategyType.AVALANCHE_INTEREST_FOCUSED,
    description: 'Highest interest rate first — minimizes total interest paid',
    icon: <Triangle width={10} height={10} rotate={180} />,
    type: 'Interest',
    ascending: true,
  },
  {
    name: StrategyType.SNOWBALL_INTEREST_FOCUSED,
    description: 'Clear the cheapest debt first to simplify your payments',
    icon: <Circle width={10} height={10} />,
    type: 'Principal',
    ascending: false,
  },
]

export const strategyDisplayNames: Record<StrategyType, string> = {
  [StrategyType.AVALANCHE]: 'Avalanche',
  [StrategyType.SNOWBALL]: 'Snowball',
  [StrategyType.AVALANCHE_INTEREST_FOCUSED]: 'Avalanche (Interest)',
  [StrategyType.SNOWBALL_INTEREST_FOCUSED]: 'Snowball (Interest)',
}

export const strategyColors: Record<StrategyType, string> = {
  [StrategyType.AVALANCHE]: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  [StrategyType.SNOWBALL]: 'text-green-400 border-green-400/30 bg-green-400/5',
  [StrategyType.AVALANCHE_INTEREST_FOCUSED]: 'text-fuchsia-400 border-fuchsia-400/30 bg-fuchsia-400/5',
  [StrategyType.SNOWBALL_INTEREST_FOCUSED]: 'text-teal-400 border-teal-400/30 bg-teal-400/5',
}

export const breadcrumbs = {
  simulations: 'Simulations',
  create: 'Create',
  loans: 'Loans',
}

export const LINE_COLORS = [
  'hsl(78, 100%, 52%)',
  'hsl(144, 70%, 55%)',
  'hsl(45, 88%, 62%)',
  'hsl(166, 62%, 52%)',
  'hsl(56, 92%, 65%)',
  'hsl(122, 70%, 55%)',
  'hsl(89, 90%, 45%)',
  'hsl(175, 60%, 58%)',
  'hsl(100, 82%, 65%)',
  'hsl(67, 95%, 60%)',
  'hsl(155, 65%, 48%)',
  'hsl(111, 75%, 68%)',
  'hsl(133, 72%, 48%)',
]
