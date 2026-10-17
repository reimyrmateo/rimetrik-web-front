import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { ApiResult, PagedResult, QueryParams } from '@/core/api/apiTypes'
import { http } from '@/core/api/httpClient'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { usePagination } from '@/shared/hooks/usePagination'
import type { StatusFilterValue } from '@/shared/types/common'

export interface CatalogApi<TItem, TCreate, TUpdate> {
  list: (query: QueryParams, signal?: AbortSignal) => Promise<PagedResult<TItem>>
  create: (payload: TCreate) => Promise<ApiResult<TItem>>
  update: (id: number, payload: TUpdate) => Promise<ApiResult<TItem>>
  activate: (id: number) => Promise<ApiResult<TItem>>
  deactivate: (id: number) => Promise<ApiResult<TItem>>
  remove: (id: number) => Promise<ApiResult<null>>
}

export function createCatalogApi<TItem, TCreate, TUpdate = TCreate & { row_version: string }>(
  path: string,
): CatalogApi<TItem, TCreate, TUpdate> {
  return {
    list: async (query, signal) => (await http.get<PagedResult<TItem>>(path, query, signal)).data,
    create: (payload) => http.post<TItem>(path, payload),
    update: (id, payload) => http.put<TItem>(`${path}/${id}`, payload),
    activate: (id) => http.post<TItem>(`${path}/${id}/activate`),
    deactivate: (id) => http.post<TItem>(`${path}/${id}/deactivate`),
    remove: (id) => http.delete<null>(`${path}/${id}`),
  }
}

const statusQuery: Record<StatusFilterValue, boolean | undefined> = {
  all: undefined,
  active: true,
  inactive: false,
}

export function useCatalogList<TItem>(
  key: string,
  list: (query: QueryParams, signal?: AbortSignal) => Promise<PagedResult<TItem>>,
  extraFilters: QueryParams = {},
) {
  const [search, setSearchState] = useState('')
  const [status, setStatusState] = useState<StatusFilterValue>('active')
  const pagination = usePagination()
  const debouncedSearch = useDebouncedValue(search.trim())

  const params: QueryParams = {
    search: debouncedSearch,
    is_active: statusQuery[status],
    ...extraFilters,
    ...pagination.query,
  }

  const query = useQuery({
    queryKey: [key, 'list', params],
    queryFn: ({ signal }) => list(params, signal),
    placeholderData: keepPreviousData,
  })

  return {
    search,
    setSearch: (value: string) => {
      setSearchState(value)
      pagination.reset()
    },
    status,
    setStatus: (value: StatusFilterValue) => {
      setStatusState(value)
      pagination.reset()
    },
    pagination,
    query,
    isFiltered: debouncedSearch !== '' || status !== 'active' || Object.values(extraFilters).some(Boolean),
  }
}

export function useCatalogMutations<TItem, TCreate, TUpdate>(
  key: string,
  api: CatalogApi<TItem, TCreate, TUpdate>,
) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [key] })

  const save = useMutation({
    mutationFn: (input: { id: number | null; create?: TCreate; update?: TUpdate }) =>
      input.id === null ? api.create(input.create as TCreate) : api.update(input.id, input.update as TUpdate),
    onSuccess: invalidate,
  })

  const setActive = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      active ? api.activate(id) : api.deactivate(id),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: invalidate,
  })

  return { save, setActive, remove, invalidate }
}

export interface CatalogEntityLike {
  id: number
  is_active: boolean
}

export interface CatalogConfirmState<TItem> {
  kind: 'delete' | 'deactivate'
  item: TItem
}

export function useCatalogActions<TItem extends CatalogEntityLike, TCreate, TUpdate>(
  mutations: ReturnType<typeof useCatalogMutations<TItem, TCreate, TUpdate>>,
  notify: { success: (message: string) => void; error: (message: string) => void },
  errorMessage: (error: unknown) => string,
) {
  const [editing, setEditing] = useState<TItem | 'new' | null>(null)
  const [confirm, setConfirm] = useState<CatalogConfirmState<TItem> | null>(null)

  const toggle = (item: TItem) => {
    if (item.is_active) {
      setConfirm({ kind: 'deactivate', item })
      return
    }

    mutations.setActive.mutate(
      { id: item.id, active: true },
      {
        onSuccess: (result) => notify.success(result.message),
        onError: (error) => notify.error(errorMessage(error)),
      },
    )
  }

  const runConfirm = () => {
    if (!confirm) {
      return
    }

    const options = {
      onSuccess: (result: ApiResult<unknown>) => {
        notify.success(result.message)
        setConfirm(null)
      },
      onError: (error: unknown) => {
        notify.error(errorMessage(error))
        setConfirm(null)
      },
    }

    if (confirm.kind === 'delete') {
      mutations.remove.mutate(confirm.item.id, options)
    } else {
      mutations.setActive.mutate({ id: confirm.item.id, active: false }, options)
    }
  }

  return {
    editing,
    openCreate: () => setEditing('new'),
    openEdit: (item: TItem) => setEditing(item),
    closeEditor: () => setEditing(null),
    confirm,
    askDelete: (item: TItem) => setConfirm({ kind: 'delete', item }),
    closeConfirm: () => setConfirm(null),
    toggle,
    runConfirm,
    confirming: mutations.remove.isPending || mutations.setActive.isPending,
  }
}
