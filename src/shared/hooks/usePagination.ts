import { useCallback, useState } from 'react'
import { DEFAULT_PAGE_SIZE } from '@/shared/constants/ui'

export function usePagination(initialPageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(initialPageSize)

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setPage(1)
  }, [])

  const reset = useCallback(() => setPage(1), [])

  return { page, pageSize, setPage, setPageSize, reset, query: { page, page_size: pageSize } }
}
