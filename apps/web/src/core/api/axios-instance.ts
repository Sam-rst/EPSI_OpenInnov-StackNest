import axios, { type AxiosInstance } from 'axios'

interface CreateApiClientOptions {
  baseUrl: string
  timeoutMs?: number
}

export function createApiClient({
  baseUrl,
  timeoutMs = 10_000,
}: CreateApiClientOptions): AxiosInstance {
  const instance = axios.create({
    baseURL: baseUrl,
    timeout: timeoutMs,
    headers: { 'Content-Type': 'application/json' },
  })

  instance.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error),
  )

  return instance
}
