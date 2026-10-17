import { z } from 'zod'
import { emailField, PASSWORD_MAX_LENGTH } from '@/shared/validations/common'

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria.')
    .max(PASSWORD_MAX_LENGTH, 'La contraseña es demasiado larga.'),
})

export type LoginValues = z.infer<typeof loginSchema>
