import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function Create() {
  return (
    <div className='grid g-0 grid-cols-[1fr_380px] h-min-[calc(100vh - 40px)'>
      <div className='p-8 flex flex-col border-r'>
        <header className='flex flex-col'>
          <p className='text-label'>New Simulation</p>
          <h1 className='font-display text-5xl font-light mt-4'>
            Build your
            <br /> payoff strategy
          </h1>
          <p className='text-description mt-3'>
            Select which loans to include, choose a repayment strategy,
            <br /> and see exactly how much time and money you could save.
          </p>
        </header>

        <div className='flex flex-col gap-2'>
          <Label className='text-label'>Simulation Name</Label>
          <Input
            className='placeholder:text-zinc-600 focus:outline-none focus:border-primary focus:border'
            placeholder='e.g. Salary Raise 2025'
          />
        </div>
      </div>

      <div className='p-8 flex flex-col'>totals</div>
    </div>
  )
}

export default Create
