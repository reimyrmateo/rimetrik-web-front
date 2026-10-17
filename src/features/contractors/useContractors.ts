import { contractorsApi, CONTRACTORS_KEY } from '@/features/contractors/contractorsApi'
import type { WorkerType } from '@/features/contractors/contractorTypes'
import { useCatalogList, useCatalogMutations } from '@/shared/hooks/useCatalogList'

export function useContractors(workerType: WorkerType | '') {
  return useCatalogList(CONTRACTORS_KEY, contractorsApi.list, { worker_type: workerType })
}

export function useContractorMutations() {
  return useCatalogMutations(CONTRACTORS_KEY, contractorsApi)
}
