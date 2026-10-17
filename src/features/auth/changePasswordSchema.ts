import { z } from 'zod'
import { newPasswordField, PASSWORD_MAX_LENGTH, passwordContainsEmail } from '@/shared/validations/common'

export function changePasswordSchema(email: string) {
  return z
    .object({
      currentPassword: z
        .string()
        .min(1, 'La contraseña actual es obligatoria.')
        .max(PASSWORD_MAX_LENGTH, 'La contraseña es demasiado larga.'),
      newPassword: newPasswordField().refine((value) => !passwordContainsEmail(value, email), {
        message: 'La contraseña no puede contener su correo.',
      }),
      confirmPassword: z.string().min(1, 'Confirme la contraseña nueva.'),
    })
    .refine((values) => values.newPassword !== values.currentPassword, {
      path: ['newPassword'],
      message: 'La contraseña nueva debe ser distinta de la actual.',
    })
    .refine((values) => values.confirmPassword === values.newPassword, {
      path: ['confirmPassword'],
      message: 'Las contraseñas no coinciden.',
    })
}

export type ChangePasswordValues = z.infer<ReturnType<typeof changePasswordSchema>>
