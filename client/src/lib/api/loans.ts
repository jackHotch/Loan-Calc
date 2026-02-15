import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useAxios } from './useAxios'
import { LoanDb, LoanForm } from '@/constants/schema'
import { ApiError } from './axios'

export const useLoans = () => {
  const axios = useAxios()

  return useQuery<LoanDb[], ApiError>({
    queryKey: ['loans'],
    queryFn: async () => {
      const response = await axios.get<LoanDb[]>('/loans')
      return response.data
    },
  })
}

export const useDeleteLoan = () => {
  const axios = useAxios()
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await axios.delete(`/loans/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
    },
  })
}

export const useCreateLoan = () => {
  const axios = useAxios()
  const queryClient = useQueryClient()

  return useMutation<
    LoanDb,
    ApiError,
    Omit<LoanDb, 'id' | 'user_id' | 'current_principal' | 'total_interest_paid' | 'total_amount_paid'>
  >({
    mutationFn: async (data: LoanDb) => {
      const response = await axios.post<LoanDb>('/loans', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
    },
  })
}

export const useUpdateLoan = () => {
  const axios = useAxios()
  const queryClient = useQueryClient()

  return useMutation<
    LoanDb,
    ApiError,
    {
      id: string
      data: Omit<LoanDb, 'id' | 'user_id' | 'current_principal' | 'total_interest_paid' | 'total_amount_paid'>
    }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await axios.patch<LoanDb>(`/loans/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['loans', variables.id] })
    },
  })
}
