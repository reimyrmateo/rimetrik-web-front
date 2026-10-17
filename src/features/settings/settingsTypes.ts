import type { SelectOption, Versioned } from '@/shared/types/common'

export type BankAccountType = 'CHECKING' | 'SAVINGS' | 'CASH_BOX'

export const ACCOUNT_TYPE_OPTIONS: readonly SelectOption<BankAccountType>[] = [
  { value: 'CHECKING', label: 'Cuenta corriente' },
  { value: 'SAVINGS', label: 'Cuenta de ahorro' },
  { value: 'CASH_BOX', label: 'Caja de efectivo' },
]

export const ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
  CHECKING: 'Corriente',
  SAVINGS: 'Ahorro',
  CASH_BOX: 'Caja de efectivo',
}

export interface BankAccount extends Versioned {
  id: number
  name: string
  account_type: BankAccountType
  bank_name: string | null
  account_last4: string | null
  opening_balance: number
  opening_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface BankAccountPayload {
  name: string
  account_type: BankAccountType
  bank_name: string | null
  account_last4: string | null
}

export interface OpeningBalancePayload extends Versioned {
  opening_balance: number
  opening_date: string
}

export interface MeasurementUnit extends Versioned {
  id: number
  name: string
  symbol: string
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface MeasurementUnitPayload {
  name: string
  symbol: string
}

export interface ExpenseCategory extends Versioned {
  id: number
  name: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface ExpenseCategoryPayload {
  name: string
  sort_order: number
}
