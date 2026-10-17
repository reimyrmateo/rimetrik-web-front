export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'

export interface SelectOption<T extends string | number = string> {
  value: T
  label: string
  disabled?: boolean
}

export type Size = 'sm' | 'md'

export type DocumentType = 'CEDULA' | 'RNC' | 'PASSPORT' | 'OTHER'

export type StatusFilterValue = 'all' | 'active' | 'inactive'

export interface Versioned {
  row_version: string
}
