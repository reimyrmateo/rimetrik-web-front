import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/core/errors/ApiError'

const MAX_QUERY_RETRIES = 2

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (
            isApiError(error) &&
            error.kind !== 'network' &&
            error.kind !== 'server' &&
            error.kind !== 'unavailable'
          ) {
            return false
          }

          return failureCount < MAX_QUERY_RETRIES
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}
