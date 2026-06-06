import axios, { type AxiosInstance } from 'axios'

interface CreateApiClientOptions {
  baseUrl: string
  timeoutMs?: number
  /** Inclut les cookies cross-site (refresh token httpOnly). Défaut : false. */
  withCredentials?: boolean
}

export function createApiClient({
  baseUrl,
  timeoutMs = 10_000,
  withCredentials = false,
}: CreateApiClientOptions): AxiosInstance {
  const instance = axios.create({
    baseURL: baseUrl,
    timeout: timeoutMs,
    withCredentials,
    headers: { 'Content-Type': 'application/json' },
  })

  instance.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error),
  )

  return instance
}
