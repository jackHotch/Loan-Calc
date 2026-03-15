'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLoans } from '@/lib/api/loans'
import { formatCurrency } from '@/lib/utils'
import { payoffStrategies, strategyDisplayNames } from '@/constants/constants'
import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  useActiveSimulation,
  useCreateSimulation,
  useSetActiveSimulation,
  useSimulation,
  useSimulationComparison,
  useUpdateSimulation,
} from '@/lib/api/simulations'
import { ArrowRight, Save, X } from 'lucide-react'
import { StrategyType } from '@/constants/schema'
import { ExtraPayment, SimulationResult } from '@/constants/types'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { DatePicker } from '@/components/loan-table/date-picker'
import { Badge } from '@/components/ui/badge'

export function CreateSimulation() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: loans } = useLoans()
  const createSimulation = useCreateSimulation()
  const updateSimulation = useUpdateSimulation()
  const searchParams = useSearchParams()
  const simulationId = searchParams.get('id')
  const { data: existingSimulation } = useSimulation(simulationId)
  const { data: simulationComparison, isLoading } = useSimulationComparison(simulationId)
  const { data: activeSimulation } = useActiveSimulation()
  const setActiveSimulation = useSetActiveSimulation()

  const [currentSimulationComparison, setCurrentSimulationComparison] = useState<SimulationResult>()
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [selectedLoans, setSelectedLoans] = useState<Set<bigint>>(new Set(loans?.map((l) => l.id)))
  const [strategyType, setStrategyType] = useState<StrategyType>(StrategyType.AVALANCHE)
  const [extraPayments, setExtraPayments] = useState<ExtraPayment[]>([{ amount: 100, start_date: new Date() }])
  const [cascade, setCascade] = useState<boolean>(false)

  useEffect(() => {
    if (loans && existingSimulation && simulationComparison) {
      setSimulationToDefault()
    }
  }, [existingSimulation, simulationComparison, loans])

  const isModified = existingSimulation
    ? name !== existingSimulation.name ||
      description !== existingSimulation.description ||
      strategyType !== existingSimulation.strategy_type ||
      cascade !== existingSimulation.cascade ||
      !sameExtraPayments(extraPayments, existingSimulation.extra_payments) ||
      !sameArrays(
        Array.from(selectedLoans).map(Number),
        existingSimulation.loans.map((l) => l.loan_id),
      )
    : false

  function setSimulationToDefault() {
    setName(existingSimulation.name)
    setDescription(existingSimulation.description)
    setStrategyType(existingSimulation.strategy_type)
    setExtraPayments(
      existingSimulation.extra_payments.map((ep) => ({
        ...ep,
        start_date: new Date(ep.start_date),
      })),
    )
    setCascade(existingSimulation.cascade)
    setSelectedLoans(new Set(existingSimulation.loans.map((l) => BigInt(l.loan_id))))
    setCurrentSimulationComparison(simulationComparison)
  }

  function sameArrays(a: number[], b: number[]) {
    return a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i])
  }

  function sameExtraPayments(a: ExtraPayment[], b: ExtraPayment[]) {
    if (a.length !== b.length) return false
    return a.every(
      (ep, i) => ep.amount === b[i].amount && new Date(ep.start_date).getTime() === new Date(b[i].start_date).getTime(),
    )
  }

  function setSimulationId(id: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', String(id))
    router.replace(`${pathname}?${params.toString()}`)
  }

  function toggleSelected(id: bigint) {
    setSelectedLoans((prev) => {
      const currentLoans = new Set(prev)
      currentLoans.has(id) ? currentLoans.delete(id) : currentLoans.add(id)
      return currentLoans
    })
  }

  function addToExtraPayment(id: number, extraAmount: number) {
    setExtraPayments((prev) => {
      return prev.map((ep, key) => {
        if (key == id) {
          return { ...ep, amount: ep.amount + extraAmount }
        } else {
          return ep
        }
      })
    })
  }

  function addExtraPayment() {
    setExtraPayments((prev) => [...prev, { amount: 100, start_date: new Date() }])
  }

  function handleStartDateChange(id: number, date: Date) {
    setExtraPayments((prev) => {
      return prev.map((ep, key) => {
        if (key == id) {
          return { ...ep, start_date: date }
        } else {
          return ep
        }
      })
    })
  }

  async function handleRunSimulation() {
    let simulation: SimulationResult
    if (simulationId) {
      simulation = await updateSimulation.mutateAsync({
        id: simulationId,
        data: {
          name,
          description,
          strategy_type: strategyType,
          extra_payments: extraPayments,
          cascade,
          loan_ids: Array.from(selectedLoans).map(Number),
        },
      })
    } else {
      simulation = await createSimulation.mutateAsync({
        name,
        description,
        strategy_type: strategyType,
        extra_payments: extraPayments,
        cascade,
        loan_ids: Array.from(selectedLoans).map(Number),
      })
    }

    setCurrentSimulationComparison(simulation)
    setSimulationId(simulation.simulation_id)
  }

  const selected = loans?.filter((l) => selectedLoans.has(BigInt(l.id)))
  const totalBalance = selected?.reduce((s, l) => s + Number(l.current_principal), 0)
  const totalMinPayment = selected?.reduce((s, l) => s + Number(l.minimum_payment), 0)
  const payoffOrder = strategyType.includes('Interest')
    ? strategyType.includes('Avalanche')
      ? selected?.sort((a, b) => b.interest_rate - a.interest_rate)
      : selected?.sort((a, b) => a.interest_rate - b.interest_rate)
    : strategyType.includes('Avalanche')
      ? selected?.sort((a, b) => b.current_principal - a.current_principal)
      : selected?.sort((a, b) => a.current_principal - b.current_principal)

  if (isLoading) {
    return <p>loading...</p>
  }
  return (
    <div className='grid g-0 grid-cols-[1fr_380px] lg:grid-cols-[1fr_400px] h-min-[calc(100vh - 40px) items-start'>
      <div className='p-8 flex flex-col border-r gap-12' style={{ height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
        <header className='flex flex-col gap-4'>
          <p className='text-label'>
            {activeSimulation.active_simulation_id == simulationId && (
              <span>
                <Badge>Active</Badge> -
              </span>
            )}{' '}
            {simulationId ? 'Edit' : 'New'} Simulation
          </p>

          <h1 className='font-display text-5xl font-light'>
            Build your
            <br /> payoff strategy
          </h1>

          <p className='text-description'>
            Select which loans to include, choose a repayment strategy,
            <br /> and see exactly how much time and money you could save.
          </p>
        </header>

        <div className='flex flex-col gap-8'>
          <div className='flex flex-col gap-2'>
            <Label className='text-label text-xs'>Simulation Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='e.g. Salary Raise' />
          </div>
          <div>
            <div className='flex flex-col gap-2'>
              <Label className='text-label text-xs'>Description (Optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className='resize-y'
                placeholder='Notes about the simulation...'
              />
            </div>
          </div>
        </div>

        <hr className='h-px bg-zinc-600/10' />

        <div className='flex flex-col gap-2'>
          <h2 className='font-display text-2xl mb-4'>Select loans to include</h2>

          {loans?.map((loan, key) => {
            const isSelected = selectedLoans.has(BigInt(loan.id))
            const containerSelectedStyles = isSelected ? 'border-primary/35 bg-primary/3' : 'hover:bg-secondary/60'
            const checkSelectedStyles = isSelected ? 'bg-primary' : ''
            const interestRateColor =
              loan.interest_rate > 10
                ? 'text-red-500/70'
                : loan.interest_rate > 5
                  ? 'text-amber-500/60'
                  : 'text-green-700/80'
            return (
              <div
                key={key}
                className={`${containerSelectedStyles} card cursor-pointer justify-between gap-4`}
                onClick={() => toggleSelected(BigInt(loan.id))}
              >
                <div
                  className={`${checkSelectedStyles} text-black border w-5 h-5 flex items-center justify-center text-xs`}
                >
                  {isSelected ? '✓' : null}
                </div>
                <div className='flex justify-between flex-1'>
                  <div className='flex flex-col'>
                    <p className='text-sm'>{loan.name}</p>
                    <p className='text-description'>{loan.lender}</p>
                  </div>
                  <div className='flex flex-col items-end'>
                    <p className='text-sm'>{formatCurrency(loan.current_principal)}</p>
                    <p className={`${interestRateColor} text-xs`}>{loan.interest_rate}% APR</p>
                  </div>
                </div>
              </div>
            )
          })}

          <p className='text-description'>
            {selectedLoans.size} of {loans?.length} loans selected · {formatCurrency(totalBalance)} total ·{' '}
            {formatCurrency(totalMinPayment)} /mo minimum
          </p>
        </div>

        <hr className='h-px bg-zinc-600/10' />

        <div>
          <h2 className='font-display text-2xl mb-6'>Choose your payoff strategy</h2>

          <div className='grid grid-cols-2 gap-2'>
            {payoffStrategies.map((s, key) => {
              const selectedStyles =
                strategyType === s.name ? 'border-2 border-primary/80 bg-primary/4' : 'hover:border-zinc-600'
              return (
                <div
                  key={key}
                  className={`${selectedStyles} card cursor-pointer flex-col items-start h-36`}
                  onClick={() => setStrategyType(s.name)}
                >
                  <p className='text-lg mb-4'>{s.icon}</p>
                  <h3 className='mb-1'>{s.name}</h3>
                  <p className='text-description'>{s.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        <hr className='h-px bg-zinc-600/10' />

        <div>
          <h2 className='font-display text-2xl mb-6'>Extra monthly payment</h2>

          <div className='flex flex-col gap-2'>
            <div
              onClick={() => setCascade((prev) => !prev)}
              className={`${cascade ? 'border-primary/35 bg-primary/2' : 'hover:border-zinc-700'} card cursor-pointer gap-4 justify-start`}
            >
              <Switch checked={cascade} className='pointer-events-none' />
              <div>
                <p className='text-sm'>Roll over freed payments</p>
                <p className='text-description'>
                  When a loan is payed off, redirect its freed minimum payment as extra payment towards the next loan in
                  your strategy order
                </p>
              </div>
            </div>

            {extraPayments.map((ep, key) => {
              return (
                <div key={key} className='card justify-between items-center'>
                  <div className='flex flex-col'>
                    <p className='text-sm text-zinc-400'>Additional amount on top of minimum</p>
                    <p className='text-description'>Total monthly: {formatCurrency(totalMinPayment + ep.amount)}</p>
                  </div>

                  <div className='flex gap-6 items-center'>
                    <button
                      onClick={() => addToExtraPayment(key, -25)}
                      className='flex justify-center items-center bg-secondary cursor-pointer rounded-full w-4 h-4 border p-4'
                    >
                      -
                    </button>
                    <div className='text-primary'>{formatCurrency(ep.amount)}</div>
                    <button
                      onClick={() => addToExtraPayment(key, 25)}
                      className='flex justify-center items-center bg-secondary cursor-pointer rounded-full w-4 h-4 border p-4'
                    >
                      +
                    </button>

                    <DatePicker value={ep.start_date} onChange={(val) => handleStartDateChange(key, val)} />

                    <div
                      onClick={() => setExtraPayments((prev) => prev.filter((_, index) => index != key))}
                      className='flex justify-center items-center border border-red-500/50 p-1 text-xs text-red-500/50 cursor-pointer'
                    >
                      <X />
                    </div>
                  </div>
                </div>
              )
            })}

            <Button variant='outline' className='py-5' onClick={addExtraPayment}>
              Add an extra payment
            </Button>

            {selected?.length > 0 && (
              <div className='mt-4 flex flex-col'>
                <p className='text-label mb-4'>Extra Payment Order</p>
                <div className='flex flex-col gap-2'>
                  {payoffOrder?.map((loan, key) => {
                    return (
                      <div key={key} className='flex items-center gap-4 border-l-2 px-4 py-2 border-zinc-600'>
                        <div className='flex items-center justify-center bg-secondary text-xs text-primary w-6 h-6 rounded-full'>
                          {key + 1}
                        </div>
                        <div className='flex flex-1 justify-between'>
                          <p className='text-sm text-zinc-400'>{loan.name}</p>
                          {strategyType.includes('Interest') ? (
                            <p className='text-sm text-zinc-400'>{loan.interest_rate}% APR</p>
                          ) : (
                            <p className='text-sm text-zinc-400'>{formatCurrency(loan.current_principal)}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='flex gap-2 '>
          <Button
            onClick={handleRunSimulation}
            disabled={name && selected.length > 0 ? false : true}
            className='w-fit px-8 py-5'
            variant={simulationId ? 'outline' : 'default'}
          >
            <span className='hidden md:inline text-xs tracking-widest uppercase'>Run Simulation</span>
            <ArrowRight />
          </Button>
          {simulationId && !isModified && (
            <Button className='w-fit px-8 py-5' onClick={() => router.push('/simulations')}>
              <span className='hidden md:inline text-xs tracking-widest uppercase'>Save Simulation</span>
              <Save />
            </Button>
          )}
        </div>
      </div>

      <div className='p-8 flex flex-col sticky top-0 h-[calc(100vh - var(--header-height))] overflow-y-auto'>
        {createSimulation.isPending || updateSimulation.isPending ? (
          <p>Loading...</p>
        ) : currentSimulationComparison && !isModified ? (
          <div className='flex flex-col gap-4'>
            <div className='card flex-col items-start p-6 bg-primary/3'>
              <p className='text-label text-primary/35 mb-1'>Projected Savings</p>
              <p className='font-display text-3xl font-bold text-primary'>
                {formatCurrency(currentSimulationComparison?.savings?.interest_saved)}
              </p>
              <p className='text-description'>
                in interest over {currentSimulationComparison?.savings?.months_saved} fewer months
              </p>
            </div>

            <div className='card flex-col gap-3 items-start p-6'>
              <p className='text-label mb-2'>Strategy Preview</p>
              <div className='flex justify-between items-center w-full'>
                <p className='text-description'>Strategy</p>
                <p className='text-sm'>{strategyDisplayNames[strategyType]}</p>
              </div>
              <div className='flex justify-between items-center w-full'>
                <p className='text-description'>Rollover Payments</p>
                <p className='text-sm text-primary'>{cascade ? 'True' : 'False'}</p>
              </div>
              <div className='flex justify-between items-center w-full'>
                <p className='text-description'>Payoff in</p>
                <p className='text-sm text-primary'>
                  {currentSimulationComparison.simulation.months_until_payoff} months
                </p>
              </div>
              <div className='flex justify-between items-center w-full'>
                <p className='text-description'>Total Interest</p>
                <p className='text-sm'>{formatCurrency(currentSimulationComparison.simulation.total_interest_paid)}</p>
              </div>
              <div className='flex justify-between items-center w-full'>
                <p className='text-description'>Total Paid</p>
                <p className='text-sm'>{formatCurrency(currentSimulationComparison.simulation.total_paid)}</p>
              </div>
              <div className='flex flex-col gap-2 w-full'>
                <div className='flex justify-between items-center w-full'>
                  <p className='text-description'>Interest Paid</p>
                  <p className='text-description'>vs baseline</p>
                </div>
                <Progress value={100} className='*:bg-zinc-700/80 h-1.5' />
                <Progress
                  value={
                    (currentSimulationComparison.simulation.total_interest_paid /
                      currentSimulationComparison.baseline.total_interest_paid) *
                    100
                  }
                  className='h-1.5'
                />
                <div className='flex justify-between items-center w-full'>
                  <p className='text-description text-[10px]'>
                    Baseline: {formatCurrency(currentSimulationComparison.baseline.total_interest_paid)}
                  </p>
                  <p className='text-description text-[10px]'>
                    This sim: {formatCurrency(currentSimulationComparison.simulation.total_interest_paid)}
                  </p>
                </div>
              </div>
            </div>

            <div className='card flex-col gap-3 items-start p-6'>
              <p className='text-label mb-2'>Baseline</p>
              <div className='flex justify-between items-center w-full'>
                <p className='text-description'>Payoff in</p>
                <p className='text-sm'>{currentSimulationComparison.baseline.months_until_payoff}</p>
              </div>
              <div className='flex justify-between items-center w-full'>
                <p className='text-description'>Total Interest</p>
                <p className='text-sm text-red-400'>
                  {formatCurrency(currentSimulationComparison.baseline.total_interest_paid)}
                </p>
              </div>
              <div className='flex justify-between items-center w-full'>
                <p className='text-description'>Total Paid</p>
                <p className='text-sm'>{formatCurrency(currentSimulationComparison.baseline.total_paid)}</p>
              </div>
            </div>

            {activeSimulation.active_simulation_id != simulationId && (
              <Button
                variant='outline'
                onClick={() => setActiveSimulation.mutateAsync(simulationId)}
                className='border-primary bg-primary/8'
              >
                Set as Active
              </Button>
            )}
          </div>
        ) : (
          <div className='flex flex-col gap-2'>
            <p className='text-description'>Run the simulation to see the results...</p>
            {simulationId ? (
              <Button variant='secondary' onClick={setSimulationToDefault}>
                Discard Current Changes
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
