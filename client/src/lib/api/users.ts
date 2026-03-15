import { useQuery } from '@tanstack/react-query'
import { useAxios } from './useAxios'
import { ApiError } from './axios'
import { User } from '@/constants/schema'

export const useUser = () => {
  const axios = useAxios()

  return useQuery<User, ApiError>({
    queryKey: ['users', 'current'],
    queryFn: async () => {
      const response = await axios.get<User>(`/users`)
      return response.data
    },
  })
}
