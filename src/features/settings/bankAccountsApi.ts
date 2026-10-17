import { http } from '@/core/api/httpClient'
import type {
  BankAccount,
  BankAccountPayload,
  OpeningBalancePayload,
} from '@/features/settings/settingsTypes'
import { createCatalogApi } from '@/shared/hooks/useCatalogList'

export const BANK_ACCOUNTS_KEY = 'bank-accounts'

export const bankAccountsApi = {
  ...createCatalogApi<BankAccount, BankAccountPayload>('/bank-accounts'),
  setOpeningBalance: (id: number, payload: OpeningBalancePayload) =>
    http.put<BankAccount>(`/bank-accounts/${id}/opening-balance`, payload),
}
