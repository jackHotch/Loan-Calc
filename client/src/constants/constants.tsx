import { Triangle, Circle } from 'lucide-react'

export const payoffStrategies = [
  {
    name: 'Avalanche',
    description: 'Tackle the biggest debt head-on — frees up the largest monthly minimums once paid off',
    icon: '▼',
    type: 'Interest',
    ascending: false,
  },
  {
    name: 'Snowball',
    description: 'Lowest balance first — builds momentum with quick wins',
    icon: '●',
    type: 'Principal',
    ascending: true,
  },
  {
    name: 'Avalanche - Interest Focused',
    description: 'Highest interest rate first — minimizes total interest paid',
    icon: <Triangle width={12} height={12} rotate={180} />,
    type: 'Interest',
    ascending: true,
  },
  {
    name: 'Snowball - Interest Focused',
    description: 'Clear the cheapest debt first to simplify your payments',
    icon: <Circle width={12} height={12} />,
    type: 'Principal',
    ascending: false,
  },
]
