import { ActiveSimulation } from '@/components/active-simulation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function Simulations() {
  return (
    <div>
      <header className='w-full flex justify-between items-end px-8 py-16'>
        <div>
          <h1 className='font-display text-6xl font-light'>Simulations</h1>
          <p className='text-zinc-500 text-xs'>2 saved</p>
        </div>

        <div className='w-max'>
          <Button>
            <Plus />
            <span className='hidden md:inline text-xs tracking-widest'>NEW SIMULATION</span>
          </Button>
        </div>
      </header>
      <ActiveSimulation />
    </div>
  )
}
