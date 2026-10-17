import { suppliersApi, SUPPLIERS_KEY } from '@/features/suppliers/suppliersApi'
import { useCatalogList, useCatalogMutations } from '@/shared/hooks/useCatalogList'

export function useSuppliers() {
  return useCatalogList(SUPPLIERS_KEY, suppliersApi.list)
}

export function useSupplierMutations() {
  return useCatalogMutations(SUPPLIERS_KEY, suppliersApi)
}
