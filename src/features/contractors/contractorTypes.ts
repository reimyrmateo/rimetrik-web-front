import type { DocumentType, SelectOption, Versioned } from '@/shared/types/common'

export type WorkerType = 'EMPLOYEE' | 'CONTRACTOR'

export const WORKER_TYPE_OPTIONS: readonly SelectOption<WorkerType>[] = [
  { value: 'EMPLOYEE', label: 'Empleado' },
  { value: 'CONTRACTOR', label: 'Contratista' },
]

export const WORKER_TYPE_LABELS: Record<WorkerType, string> = {
  EMPLOYEE: 'Empleado',
  CONTRACTOR: 'Contratista',
}

export interface Contractor extends Versioned {
  id: number
  full_name: string
  document_type: DocumentType | null
  document_number: string | null
  specialty: string | null
  worker_type: WorkerType
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface ContractorPayload {
  full_name: string
  document_type: DocumentType | null
  document_number: string | null
  specialty: string | null
  worker_type: WorkerType
  phone: string | null
}
