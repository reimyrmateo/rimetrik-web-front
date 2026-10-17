import { z } from 'zod'
import type { Contractor, ContractorPayload } from '@/features/contractors/contractorTypes'
import { formatDocument } from '@/shared/utils/format'
import {
  documentPayload,
  documentTypeField,
  nullable,
  optionalText,
  phoneField,
  refineDocument,
  requiredText,
} from '@/shared/validations/common'

export const contractorSchema = z
  .object({
    fullName: requiredText('El nombre', 150),
    workerType: z.enum(['', 'EMPLOYEE', 'CONTRACTOR']).refine((value) => value !== '', {
      message: 'Seleccione si es empleado o contratista.',
    }),
    specialty: optionalText('La especialidad', 100),
    documentType: documentTypeField,
    documentNumber: z.string(),
    phone: phoneField(),
  })
  .superRefine(refineDocument)

export type ContractorFormValues = z.input<typeof contractorSchema>

export const CONTRACTOR_FIELDS = [
  'fullName',
  'workerType',
  'specialty',
  'documentType',
  'documentNumber',
  'phone',
] as const

export function contractorDefaults(contractor?: Contractor): ContractorFormValues {
  return {
    fullName: contractor?.full_name ?? '',
    workerType: contractor?.worker_type ?? '',
    specialty: contractor?.specialty ?? '',
    documentType: contractor?.document_type ?? '',
    documentNumber: contractor?.document_number
      ? formatDocument(contractor.document_type, contractor.document_number)
      : '',
    phone: contractor?.phone ?? '',
  }
}

export function toContractorPayload(values: z.output<typeof contractorSchema>): ContractorPayload {
  return {
    full_name: values.fullName,
    worker_type: values.workerType,
    specialty: nullable(values.specialty),
    ...documentPayload(values.documentType, values.documentNumber),
    phone: nullable(values.phone),
  }
}
