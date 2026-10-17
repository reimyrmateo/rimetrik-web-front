import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSession } from '@/core/auth/useSession'
import { PERMISSIONS } from '@/core/constants/permissions'
import { applyServerErrors } from '@/core/errors/applyServerErrors'
import { errorMessage } from '@/core/errors/ApiError'
import { useRoles, useUserMutations } from '@/features/users/useUsers'
import {
  RESET_PASSWORD_FIELDS,
  resetPasswordSchema,
  USER_FIELDS,
  userDefaults,
  userSchema,
  type ResetPasswordValues,
  type UserOutput,
  type UserValues,
} from '@/features/users/userSchema'
import type { UserDetails } from '@/features/users/userTypes'
import { Alert } from '@/shared/components/Alert'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Checkbox } from '@/shared/components/Checkbox'
import { FormField } from '@/shared/components/FormField'
import { Input } from '@/shared/components/Input'
import { Spinner } from '@/shared/components/Spinner'

const PASSWORD_HINT = 'Mínimo 12 caracteres. No puede contener el correo del usuario.'

function sameIds(left: readonly number[], right: readonly number[]): boolean {
  return left.length === right.length && left.every((id) => right.includes(id))
}

export interface UserFormProps {
  user?: UserDetails
  onSaved: (message: string) => void
  onCancel: () => void
}

export function UserForm({ user, onSaved, onCancel }: UserFormProps) {
  const isNew = user === undefined
  const { can } = useSession()
  const canViewRoles = can(PERMISSIONS.roles.view)
  const roles = useRoles(canViewRoles)
  const mutations = useUserMutations()
  const [saved, setSaved] = useState(user)
  const [formError, setFormError] = useState<string | null>(null)
  const schema = useMemo(() => userSchema(isNew), [isNew])
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<UserValues, unknown, UserOutput>({
    resolver: zodResolver(schema),
    defaultValues: userDefaults(user),
  })
  const pending = mutations.create.isPending || mutations.update.isPending || mutations.setRoles.isPending
  const roleIdsDescribedBy = errors.roleIds ? 'user-roles-error' : undefined

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    const roleIds = values.roleIds.map(Number)

    try {
      if (!saved) {
        const result = await mutations.create.mutateAsync({
          full_name: values.fullName,
          email: values.email,
          password: values.password,
          role_ids: roleIds,
        })
        onSaved(result.message)
        return
      }

      let message: string | null = null
      let current = saved

      if (values.fullName !== current.full_name || values.email !== current.email) {
        const result = await mutations.update.mutateAsync({
          id: current.id,
          payload: { full_name: values.fullName, email: values.email, row_version: current.row_version },
        })
        current = result.data
        setSaved(current)
        message = result.message
      }

      if (
        canViewRoles &&
        !sameIds(
          roleIds,
          current.roles.map((role) => role.id),
        )
      ) {
        const result = await mutations.setRoles.mutateAsync({ id: current.id, roleIds })
        setSaved(result.data)
        message = result.message
      }

      onSaved(message ?? 'No había cambios que guardar.')
    } catch (error) {
      setFormError(applyServerErrors(error, setError, USER_FIELDS))
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} aria-label={isNew ? 'Nuevo usuario' : 'Editar usuario'}>
      {formError && (
        <Alert tone="danger" className="mb-4">
          {formError}
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nombre completo"
          required
          error={errors.fullName?.message}
          className="sm:col-span-2"
        >
          <Input autoFocus autoComplete="off" maxLength={150} {...register('fullName')} />
        </FormField>
        <FormField
          label="Correo electrónico"
          required
          hint="Con este correo iniciará sesión."
          error={errors.email?.message}
          className="sm:col-span-2"
        >
          <Input type="email" autoComplete="off" maxLength={256} {...register('email')} />
        </FormField>
        {isNew && (
          <>
            <FormField
              label="Contraseña inicial"
              required
              hint={PASSWORD_HINT}
              error={errors.password?.message}
            >
              <Input type="password" autoComplete="new-password" maxLength={128} {...register('password')} />
            </FormField>
            <FormField label="Confirmar contraseña" required error={errors.confirmPassword?.message}>
              <Input
                type="password"
                autoComplete="new-password"
                maxLength={128}
                {...register('confirmPassword')}
              />
            </FormField>
          </>
        )}
      </div>
      <fieldset className="mt-5" aria-describedby={roleIdsDescribedBy}>
        <legend className="mb-2 text-[13px] font-semibold text-ink">
          Roles
          <span aria-hidden="true" className="ml-0.5 text-danger-600">
            *
          </span>
        </legend>
        {!canViewRoles ? (
          isNew ? (
            <Alert tone="warning">Para asignar roles necesita el permiso de ver roles.</Alert>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {user.roles.map((role) => (
                <Badge key={role.id}>{role.name}</Badge>
              ))}
            </div>
          )
        ) : roles.isPending ? (
          <Spinner label="Cargando roles" />
        ) : roles.isError ? (
          <Alert tone="danger">{errorMessage(roles.error)}</Alert>
        ) : (
          <div className="grid gap-2 rounded-control border border-line p-3 sm:grid-cols-2">
            {roles.data.map((role) => (
              <Checkbox
                key={role.id}
                value={String(role.id)}
                label={role.name}
                {...(role.description ? { description: role.description } : {})}
                {...register('roleIds')}
              />
            ))}
          </div>
        )}
        {errors.roleIds && (
          <p id="user-roles-error" role="alert" className="mt-1.5 text-[13px] text-danger-700">
            {errors.roleIds.message}
          </p>
        )}
        {!isNew && canViewRoles && (
          <p className="mt-1.5 text-[13px] text-ink-muted">
            Los permisos nuevos se aplican en su próxima renovación de sesión.
          </p>
        )}
      </fieldset>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" loading={pending} disabled={(isNew && !canViewRoles) || (!isNew && !isDirty)}>
          {isNew ? 'Crear usuario' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}

export interface ResetPasswordFormProps {
  user: { id: number; full_name: string; email: string }
  onSaved: (message: string) => void
  onCancel: () => void
}

export function ResetPasswordForm({ user, onSaved, onCancel }: ResetPasswordFormProps) {
  const { resetPassword } = useUserMutations()
  const [formError, setFormError] = useState<string | null>(null)
  const schema = useMemo(() => resetPasswordSchema(user.email), [user.email])
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)

    try {
      const result = await resetPassword.mutateAsync({ id: user.id, password: values.newPassword })
      onSaved(result.message)
    } catch (error) {
      setFormError(applyServerErrors(error, setError, RESET_PASSWORD_FIELDS))
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} aria-label="Restablecer contraseña">
      <Alert tone="warning" className="mb-4">
        Se cerrarán todas las sesiones de {user.full_name} y la cuenta quedará desbloqueada. Comuníquele la
        contraseña por un medio seguro.
      </Alert>
      {formError && (
        <Alert tone="danger" className="mb-4">
          {formError}
        </Alert>
      )}
      <div className="grid gap-4">
        <FormField label="Contraseña nueva" required hint={PASSWORD_HINT} error={errors.newPassword?.message}>
          <Input
            autoFocus
            type="password"
            autoComplete="new-password"
            maxLength={128}
            {...register('newPassword')}
          />
        </FormField>
        <FormField label="Confirmar contraseña" required error={errors.confirmPassword?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            maxLength={128}
            {...register('confirmPassword')}
          />
        </FormField>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={resetPassword.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={resetPassword.isPending}>
          Restablecer contraseña
        </Button>
      </div>
    </form>
  )
}
