import type { Contractor, ContractorPayload } from '@/features/contractors/contractorTypes'
import { createCatalogApi } from '@/shared/hooks/useCatalogList'

export const CONTRACTORS_KEY = 'workers'

export const contractorsApi = createCatalogApi<Contractor, ContractorPayload>('/workers')
