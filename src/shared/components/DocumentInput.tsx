import type { FocusEvent, Ref } from 'react'
import { Input, type InputProps } from '@/shared/components/Input'
import type { DocumentType, SelectOption } from '@/shared/types/common'
import { formatDocument } from '@/shared/utils/format'
import { DOCUMENT_MAX_LENGTH, onlyDigits } from '@/shared/validations/common'

export const DOCUMENT_TYPE_OPTIONS: readonly SelectOption<DocumentType>[] = [
  { value: 'CEDULA', label: 'Cédula' },
  { value: 'RNC', label: 'RNC' },
  { value: 'PASSPORT', label: 'Pasaporte' },
  { value: 'OTHER', label: 'Otro' },
]

const placeholders: Record<DocumentType | '', string> = {
  CEDULA: '000-0000000-0',
  RNC: '0-00-00000-0',
  PASSPORT: 'Número de pasaporte',
  OTHER: 'Número del documento',
  '': 'Seleccione primero el tipo',
}

export interface DocumentInputProps extends Omit<InputProps, 'value' | 'onChange'> {
  documentType: DocumentType | ''
  value: string
  onValueChange: (value: string) => void
  ref?: Ref<HTMLInputElement>
}

export function DocumentInput({ documentType, value, onValueChange, onBlur, ...props }: DocumentInputProps) {
  const numeric = documentType === 'CEDULA' || documentType === 'RNC'

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (numeric) {
      const formatted = formatDocument(documentType, onlyDigits(value))
      onValueChange(formatted === '—' ? '' : formatted)
    }

    onBlur?.(event)
  }

  return (
    <Input
      inputMode={numeric ? 'numeric' : 'text'}
      autoComplete="off"
      maxLength={DOCUMENT_MAX_LENGTH}
      placeholder={placeholders[documentType]}
      disabled={documentType === '' && value === ''}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      onBlur={handleBlur}
      {...props}
    />
  )
}
