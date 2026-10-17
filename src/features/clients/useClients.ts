import { clientsApi, CLIENTS_KEY } from '@/features/clients/clientsApi'
import { useCatalogList, useCatalogMutations } from '@/shared/hooks/useCatalogList'

export function useClients() {
  return useCatalogList(CLIENTS_KEY, clientsApi.list)
}

export function useClientMutations() {
  return useCatalogMutations(CLIENTS_KEY, clientsApi)
}
