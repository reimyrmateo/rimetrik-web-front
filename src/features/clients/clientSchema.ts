import { z } from 'zod'
import type { Client, ClientPayload } from '@/features/clients/clientTypes'
import {
  documentPayload,
  documentTypeField,
  emailField,
  nullable,
  optionalText,
  phoneField,
  refineDocument,
  requiredText,
} from '@/shared/validations/common'
import { formatDocument } from '@/shared/utils/format'

export const clientSchema = z
  .object({
    name: requiredText('El nombre', 200),
    documentType: documentTypeField,
    documentNumber: z.string(),
    email: emailField,
    phone: phoneField(),
    address: optionalText('La dirección', 300),
  })
  .superRefine(refineDocument)

export type ClientFormValues = z.input<typeof clientSchema>

export const CLIENT_FIELDS = ['name', 'documentType', 'documentNumber', 'email', 'phone', 'address'] as const

export function clientDefaults(client?: Client): ClientFormValues {
  return {
    name: client?.name ?? '',
    documentType: client?.document_type ?? '',
    documentNumber: client?.document_number
      ? formatDocument(client.document_type, client.document_number)
      : '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    address: client?.address ?? '',
  }
}

export function toClientPayload(values: z.output<typeof clientSchema>): ClientPayload {
  return {
    name: values.name,
    ...documentPayload(values.documentType, values.documentNumber),
    email: values.email,
    phone: nullable(values.phone),
    address: nullable(values.address),
  }
}
