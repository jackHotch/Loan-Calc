import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAxios } from './useAxios'
import { ApiError } from './axios'
import { CreateSimulationInput } from '@/constants/schema'
import { SimulationResult } from '@/constants/types'

export const useCreateSimulation = () => {
  const axios = useAxios()
  const queryClient = useQueryClient()

  return useMutation<SimulationResult, ApiError, CreateSimulationInput>({
    mutationFn: async (data) => {
      const response = await axios.post<SimulationResult>('/simulations', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] })
    },
  })
}
