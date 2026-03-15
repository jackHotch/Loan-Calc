import { CreateSimulation } from '@/components/simulations/create-simulation'
import { Suspense } from 'react'

function Create() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <CreateSimulation />
    </Suspense>
  )
}

export default Create
