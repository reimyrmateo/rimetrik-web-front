import type { DocumentType, Versioned } from '@/shared/types/common'

export interface Supplier extends Versioned {
  id: number
  name: string
  document_type: DocumentType | null
  document_number: string | null
  category: string | null
  email: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface SupplierPayload {
  name: string
  document_type: DocumentType | null
  document_number: string | null
  category: string | null
  email: string | null
  phone: string | null
}
