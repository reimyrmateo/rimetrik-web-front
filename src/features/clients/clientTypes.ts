import type { DocumentType, Versioned } from '@/shared/types/common'

export interface Client extends Versioned {
  id: number
  name: string
  document_type: DocumentType | null
  document_number: string | null
  email: string | null
  phone: string | null
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface ClientPayload {
  name: string
  document_type: DocumentType | null
  document_number: string | null
  email: string
  phone: string | null
  address: string | null
}
