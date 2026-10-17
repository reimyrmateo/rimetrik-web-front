import type { Client, ClientPayload } from '@/features/clients/clientTypes'
import { createCatalogApi } from '@/shared/hooks/useCatalogList'

export const CLIENTS_KEY = 'customers'

export const clientsApi = createCatalogApi<Client, ClientPayload>('/customers')
