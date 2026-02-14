import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'

export interface ApiError {
  message: string
  status?: number
  errors?: Record<string, string[]>
}

export const createApiClient = (getToken: () => Promise<string | null>): AxiosInstance => {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  })

  client.interceptors.request.use(
    async (config) => {
      const token = await getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    },
  )

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
      const apiError: ApiError = {
        message: error.response?.data?.message || error.message || 'An error occurred',
        status: error.response?.status,
        errors: error.response?.data?.errors,
      }
      return Promise.reject(apiError)
    },
  )

  return client
}
