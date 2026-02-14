import { useMemo } from 'react'
import { useAuth } from '@clerk/nextjs'
import { AxiosInstance } from 'axios'
import { createApiClient } from './axios'

export function useAxios(): AxiosInstance {
  const { getToken } = useAuth()

  const client = useMemo(() => {
    return createApiClient(getToken)
  }, [getToken])

  return client
}
