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
    icon: <Triangle width={12} height={12} rotate={180} />,
    type: 'Interest',
    ascending: true,
  },
  {
    name: StrategyType.SNOWBALL_INTEREST_FOCUSED,
    description: 'Clear the cheapest debt first to simplify your payments',
    icon: <Circle width={12} height={12} />,
    type: 'Principal',
    ascending: false,
  },
]
