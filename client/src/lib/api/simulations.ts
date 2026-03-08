import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAxios } from './useAxios'
import { ApiError } from './axios'
import { CreateSimulationInput, Simulation } from '@/constants/schema'
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

export const useUpdateSimulation = () => {
  const axios = useAxios()
  const queryClient = useQueryClient()
  return useMutation<SimulationResult, ApiError, { id: string; data: CreateSimulationInput }>({
    mutationFn: async ({ id, data }) => {
      const response = await axios.patch<SimulationResult>(`/simulations/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] })
    },
  })
}

export const useSimulation = (id) => {
  const axios = useAxios()

  return useQuery<Simulation, ApiError>({
    queryKey: ['simulations', id],
    queryFn: async () => {
      const response = await axios.get<Simulation>(`/simulations/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

export const useSimulationComparison = (id) => {
  const axios = useAxios()

  return useQuery<SimulationResult, ApiError>({
    queryKey: ['simulations', 'comparison', id],
    queryFn: async () => {
      const response = await axios.get<SimulationResult>(`/simulations/comparison/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}
