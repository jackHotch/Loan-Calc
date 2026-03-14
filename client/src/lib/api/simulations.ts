import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAxios } from './useAxios'
import { ApiError } from './axios'
import { ActiveSimulation, CreateSimulationInput, Simulation, SimulationSummary } from '@/constants/schema'
import { SetActiveSimulationResult, SimulationResult } from '@/constants/types'

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

export const useAllSimulations = () => {
  const axios = useAxios()

  return useQuery<Simulation[], ApiError>({
    queryKey: ['simulations'],
    queryFn: async () => {
      const response = await axios.get<Simulation[]>(`/simulations`)
      return response.data
    },
  })
}

export const useAllSimulationSummaries = () => {
  const axios = useAxios()

  return useQuery<SimulationSummary[], ApiError>({
    queryKey: ['simulations', 'summary'],
    queryFn: async () => {
      const response = await axios.get<SimulationSummary[]>(`/simulations/summary`)
      return response.data
    },
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

export const useActiveSimulation = () => {
  const axios = useAxios()

  return useQuery<ActiveSimulation, ApiError>({
    queryKey: ['simulations', 'active'],
    queryFn: async () => {
      const response = await axios.get<ActiveSimulation>(`/simulations/active`)
      return response.data
    },
  })
}

export const useSetActiveSimulation = () => {
  const axios = useAxios()
  const queryClient = useQueryClient()

  return useMutation<SetActiveSimulationResult, ApiError, string>({
    mutationFn: async (id) => {
      const response = await axios.post<SetActiveSimulationResult>(`/simulations/${id}/active`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations', 'active'] })
    },
  })
}
