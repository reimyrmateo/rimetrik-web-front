import { z } from 'zod'
import type { Supplier, SupplierPayload } from '@/features/suppliers/supplierTypes'
import { formatDocument } from '@/shared/utils/format'
import {
  documentPayload,
  documentTypeField,
  nullable,
  optionalEmailField,
  optionalText,
  phoneField,
  refineDocument,
  requiredText,
} from '@/shared/validations/common'

export const supplierSchema = z
  .object({
    name: requiredText('El nombre', 200),
    category: optionalText('La categoría', 60),
    documentType: documentTypeField,
    documentNumber: z.string(),
    email: optionalEmailField(),
    phone: phoneField(),
  })
  .superRefine(refineDocument)

export type SupplierFormValues = z.input<typeof supplierSchema>

export const SUPPLIER_FIELDS = [
  'name',
  'category',
  'documentType',
  'documentNumber',
  'email',
  'phone',
] as const

export function supplierDefaults(supplier?: Supplier): SupplierFormValues {
  return {
    name: supplier?.name ?? '',
    category: supplier?.category ?? '',
    documentType: supplier?.document_type ?? '',
    documentNumber: supplier?.document_number
      ? formatDocument(supplier.document_type, supplier.document_number)
      : '',
    email: supplier?.email ?? '',
    phone: supplier?.phone ?? '',
  }
}

export function toSupplierPayload(values: z.output<typeof supplierSchema>): SupplierPayload {
  return {
    name: values.name,
    category: nullable(values.category),
    ...documentPayload(values.documentType, values.documentNumber),
    email: nullable(values.email),
    phone: nullable(values.phone),
  }
}
