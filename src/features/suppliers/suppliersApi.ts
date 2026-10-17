import type { Supplier, SupplierPayload } from '@/features/suppliers/supplierTypes'
import { createCatalogApi } from '@/shared/hooks/useCatalogList'

export const SUPPLIERS_KEY = 'suppliers'

export const suppliersApi = createCatalogApi<Supplier, SupplierPayload>('/suppliers')
