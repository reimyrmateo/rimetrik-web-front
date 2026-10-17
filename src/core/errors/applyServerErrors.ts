import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'
import { isApiError } from '@/core/errors/ApiError'

function toFormPath(serverField: string): string {
  return serverField
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .map((segment) => segment.replace(/_([a-z0-9])/g, (_, letter: string) => letter.toUpperCase()))
    .join('.')
}

export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields: readonly FieldPath<T>[],
): string | null {
  if (!isApiError(error)) {
    return null
  }

  const unmatched: string[] = []

  for (const field of error.fields) {
    const path = toFormPath(field.field)
    const message = field.messages[0] ?? error.message

    if ((knownFields as readonly string[]).includes(path)) {
      setError(path as FieldPath<T>, { type: 'server', message }, { shouldFocus: true })
    } else {
      unmatched.push(message)
    }
  }

  if (error.fields.length > 0 && unmatched.length === 0) {
    return null
  }

  return unmatched[0] ?? error.message
}
