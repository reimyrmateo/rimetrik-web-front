export interface ApiEnvelope<T> {
  message: string
  data: T | null
}

export interface ApiResult<T> {
  message: string
  data: T
}

export interface ServerFieldError {
  field: string
  messages: string[]
}

export interface PagedResult<T> {
  items: T[]
  page: number
  page_size: number
  total_items: number
  total_pages: number
}

export type QueryValue = string | number | boolean | null | undefined

export type QueryParams = Record<string, QueryValue>
