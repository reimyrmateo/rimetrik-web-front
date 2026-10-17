import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useChangePassword } from '@/core/auth/useSession'
import { applyServerErrors } from '@/core/errors/applyServerErrors'
import { changePasswordSchema, type ChangePasswordValues } from '@/features/auth/changePasswordSchema'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { FormField } from '@/shared/components/FormField'
import { Input } from '@/shared/components/Input'
import { PASSWORD_MIN_LENGTH } from '@/shared/validations/common'

const FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'] as const

export function ChangePasswordForm({ email }: { email: string }) {
  const [formError, setFormError] = useState<string | null>(null)
  const changePassword = useChangePassword()
  const schema = useMemo(() => changePasswordSchema(email), [email])
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)

    try {
      await changePassword.mutateAsync({
        current_password: values.currentPassword,
        new_password: values.newPassword,
      })
    } catch (error) {
      setFormError(applyServerErrors(error, setError, FIELDS))
    }
  })

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex max-w-md flex-col gap-4"
      aria-label="Cambiar contraseña"
    >
      {formError && <Alert tone="danger">{formError}</Alert>}
      <FormField label="Contraseña actual" required error={errors.currentPassword?.message}>
        <Input
          type="password"
          autoComplete="current-password"
          maxLength={128}
          {...register('currentPassword')}
        />
      </FormField>
      <FormField
        label="Contraseña nueva"
        required
        error={errors.newPassword?.message}
        hint={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres. No puede contener su correo.`}
      >
        <Input type="password" autoComplete="new-password" maxLength={128} {...register('newPassword')} />
      </FormField>
      <FormField label="Confirmar contraseña nueva" required error={errors.confirmPassword?.message}>
        <Input type="password" autoComplete="new-password" maxLength={128} {...register('confirmPassword')} />
      </FormField>
      <div className="pt-1">
        <Button type="submit" loading={changePassword.isPending}>
          Actualizar contraseña
        </Button>
      </div>
    </form>
  )
}
