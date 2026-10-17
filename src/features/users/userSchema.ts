import { z } from 'zod'
import type { UserDetails } from '@/features/users/userTypes'
import {
  emailField,
  newPasswordField,
  passwordContainsEmail,
  requiredText,
} from '@/shared/validations/common'

const EMAIL_IN_PASSWORD = 'La contraseña no puede contener el correo del usuario.'

const profileFields = {
  fullName: requiredText('El nombre', 150),
  email: emailField,
  roleIds: z.array(z.string()).min(1, 'Asigne al menos un rol.'),
}

export function userSchema(isNew: boolean) {
  return z
    .object({
      ...profileFields,
      password: isNew ? newPasswordField() : z.string(),
      confirmPassword: isNew ? z.string().min(1, 'Confirme la contraseña.') : z.string(),
    })
    .superRefine((values, context) => {
      if (!isNew) {
        return
      }

      if (passwordContainsEmail(values.password, values.email)) {
        context.addIssue({ code: 'custom', path: ['password'], message: EMAIL_IN_PASSWORD })
      }

      if (values.confirmPassword !== '' && values.confirmPassword !== values.password) {
        context.addIssue({
          code: 'custom',
          path: ['confirmPassword'],
          message: 'Las contraseñas no coinciden.',
        })
      }
    })
}

export type UserValues = z.input<ReturnType<typeof userSchema>>
export type UserOutput = z.output<ReturnType<typeof userSchema>>

export const USER_FIELDS = ['fullName', 'email', 'password', 'confirmPassword', 'roleIds'] as const

export function userDefaults(user?: UserDetails): UserValues {
  return {
    fullName: user?.full_name ?? '',
    email: user?.email ?? '',
    roleIds: user?.roles.map((role) => String(role.id)) ?? [],
    password: '',
    confirmPassword: '',
  }
}

export function resetPasswordSchema(email: string) {
  return z
    .object({
      newPassword: newPasswordField().refine((value) => !passwordContainsEmail(value, email), {
        message: EMAIL_IN_PASSWORD,
      }),
      confirmPassword: z.string().min(1, 'Confirme la contraseña.'),
    })
    .refine((values) => values.confirmPassword === values.newPassword, {
      path: ['confirmPassword'],
      message: 'Las contraseñas no coinciden.',
    })
}

export type ResetPasswordValues = z.input<ReturnType<typeof resetPasswordSchema>>

export const RESET_PASSWORD_FIELDS = ['newPassword', 'confirmPassword'] as const
