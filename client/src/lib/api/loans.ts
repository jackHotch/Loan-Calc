import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAxios } from './useAxios'
import { LoanDb, LoanProgress } from '@/constants/schema'
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
    Omit<LoanDb, 'id' | 'user_id' | 'current_principal' | 'current_outstanding_interest' | 'total_interest_paid' | 'total_amount_paid'>
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
      data: Omit<LoanDb, 'id' | 'user_id' | 'current_principal' | 'current_outstanding_interest' | 'total_interest_paid' | 'total_amount_paid'>
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

export const useApplyLumpSum = () => {
  const axios = useAxios()
  const queryClient = useQueryClient()

  return useMutation<LoanDb, ApiError, { id: string; amount: number; date: string }>({
    mutationFn: async ({ id, amount, date }) => {
      const response = await axios.patch<LoanDb>(`/loans/${id}/lump-sum`, { amount, date })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['loans', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['loans', 'schedules'] })
      queryClient.invalidateQueries({ queryKey: ['loans', variables.id, 'lump-sums'] })
    },
  })
}

export type LoanLumpSum = {
  id: number
  amount: number
  date: string
}

export const useDeleteLumpSum = () => {
  const axios = useAxios()
  const queryClient = useQueryClient()

  return useMutation<LoanDb, ApiError, { loanId: string; lumpSumId: number }>({
    mutationFn: async ({ loanId, lumpSumId }) => {
      const response = await axios.delete<LoanDb>(`/loans/${loanId}/lump-sums/${lumpSumId}`)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['loans', variables.loanId] })
      queryClient.invalidateQueries({ queryKey: ['loans', 'schedules'] })
      queryClient.invalidateQueries({ queryKey: ['loans', variables.loanId, 'lump-sums'] })
    },
  })
}

export const useLoanLumpSums = (loanId: string | undefined) => {
  const axios = useAxios()

  return useQuery<LoanLumpSum[], ApiError>({
    queryKey: ['loans', loanId, 'lump-sums'],
    queryFn: async () => {
      const response = await axios.get<LoanLumpSum[]>(`/loans/${loanId}/lump-sums`)
      return response.data
    },
    enabled: !!loanId,
  })
}

export type LoanScheduleEntry = {
  loan_id: number
  name: string
  payment_number: number
  payment_date: string
  remaining_principal: number
  is_actual: boolean
}

export const useLoanSchedules = () => {
  const axios = useAxios()

  return useQuery<LoanScheduleEntry[], ApiError>({
    queryKey: ['loans', 'schedules'],
    queryFn: async () => {
      const response = await axios.get<LoanScheduleEntry[]>('/loans/schedules')
      return response.data
    },
  })
}

export const useLoanProgress = (params?: { loan_ids?: number[] }) => {
  const axios = useAxios()

  return useQuery<LoanProgress, ApiError>({
    queryKey: ['loans', 'progress', params],
    queryFn: async () => {
      const response = await axios.get<LoanProgress>('/loans/progress', { params })
      return response.data
    },
  })
}
