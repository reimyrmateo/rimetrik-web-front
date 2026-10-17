import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BANK_ACCOUNTS_KEY, bankAccountsApi } from '@/features/settings/bankAccountsApi'
import { categoriesApi, CATEGORIES_KEY, unitsApi, UNITS_KEY } from '@/features/settings/catalogApi'
import type { OpeningBalancePayload } from '@/features/settings/settingsTypes'
import { useCatalogList, useCatalogMutations } from '@/shared/hooks/useCatalogList'

export function useBankAccounts() {
  return useCatalogList(BANK_ACCOUNTS_KEY, bankAccountsApi.list)
}

export function useBankAccountMutations() {
  return useCatalogMutations(BANK_ACCOUNTS_KEY, bankAccountsApi)
}

export function useOpeningBalance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: OpeningBalancePayload }) =>
      bankAccountsApi.setOpeningBalance(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [BANK_ACCOUNTS_KEY] }),
  })
}

export function useUnits() {
  return useCatalogList(UNITS_KEY, unitsApi.list)
}

export function useUnitMutations() {
  return useCatalogMutations(UNITS_KEY, unitsApi)
}

export function useCategories() {
  return useCatalogList(CATEGORIES_KEY, categoriesApi.list)
}

export function useCategoryMutations() {
  return useCatalogMutations(CATEGORIES_KEY, categoriesApi)
}
