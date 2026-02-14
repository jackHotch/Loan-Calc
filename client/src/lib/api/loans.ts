import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useAxios } from './useAxios'
import { LoanDb } from '@/constants/schema'
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
