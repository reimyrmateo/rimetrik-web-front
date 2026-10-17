import { z } from 'zod'
import { requiredText } from '@/shared/validations/common'

export const unitSchema = z.object({
  name: requiredText('El nombre', 80),
  symbol: requiredText('El símbolo', 15),
})

export type UnitFormValues = z.input<typeof unitSchema>

export const UNIT_FIELDS = ['name', 'symbol'] as const

export const categorySchema = z.object({
  name: requiredText('El nombre', 80),
  sortOrder: z
    .string()
    .trim()
    .min(1, 'El orden es obligatorio.')
    .refine((value) => /^\d+$/.test(value), { message: 'El orden debe ser un número entero sin signo.' })
    .transform(Number)
    .refine((value) => value <= 10_000, { message: 'El orden debe estar entre 0 y 10000.' }),
})

export type CategoryFormValues = z.input<typeof categorySchema>

export const CATEGORY_FIELDS = ['name', 'sortOrder'] as const
