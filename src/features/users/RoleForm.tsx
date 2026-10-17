import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { applyServerErrors } from '@/core/errors/applyServerErrors'
import { errorMessage } from '@/core/errors/ApiError'
import { ROLE_FIELDS, roleDefaults, roleSchema, type RoleValues } from '@/features/users/roleSchema'
import { usePermissionCatalog, useRoleMutations } from '@/features/users/useUsers'
import { groupPermissions, type Role } from '@/features/users/userTypes'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { Checkbox } from '@/shared/components/Checkbox'
import { FormField } from '@/shared/components/FormField'
import { Input } from '@/shared/components/Input'
import { Spinner } from '@/shared/components/Spinner'
import { Textarea } from '@/shared/components/Textarea'
import { nullable } from '@/shared/validations/common'

export interface RoleFormProps {
  role?: Role
  readOnly?: boolean
  onSaved: (message: string) => void
  onCancel: () => void
}

export function RoleForm({ role, readOnly = false, onSaved, onCancel }: RoleFormProps) {
  const catalog = usePermissionCatalog()
  const { save } = useRoleMutations()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RoleValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: roleDefaults(role),
    disabled: readOnly,
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    const payload = {
      name: values.name,
      description: nullable(values.description),
      permissions: values.permissions,
    }

    try {
      const result = await save.mutateAsync(
        role
          ? { id: role.id, payload: { ...payload, row_version: role.row_version } }
          : { id: null, payload },
      )
      onSaved(result.message)
    } catch (error) {
      setFormError(applyServerErrors(error, setError, ROLE_FIELDS))
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} aria-label={role ? `Rol ${role.name}` : 'Nuevo rol'}>
      {readOnly && (
        <Alert tone="info" className="mb-4">
          Es el rol de sistema: tiene todos los permisos y no puede modificarse.
        </Alert>
      )}
      {formError && (
        <Alert tone="danger" className="mb-4">
          {formError}
        </Alert>
      )}
      <div className="grid gap-4">
        <FormField label="Nombre del rol" required error={errors.name?.message}>
          <Input autoFocus={!readOnly} maxLength={60} placeholder="Residente de obra" {...register('name')} />
        </FormField>
        <FormField label="Descripción" optionalLabel error={errors.description?.message}>
          <Textarea
            rows={2}
            maxLength={300}
            placeholder="Qué responsabilidades cubre"
            {...register('description')}
          />
        </FormField>
      </div>
      <Controller
        control={control}
        name="permissions"
        render={({ field, fieldState }) => {
          const selected = new Set(field.value)
          const setSelected = (next: Set<string>) => field.onChange([...next])

          return (
            <fieldset
              className="mt-5"
              aria-describedby={fieldState.error ? 'role-permissions-error' : undefined}
              disabled={readOnly}
            >
              <legend className="mb-2 flex w-full items-center justify-between text-[13px] font-semibold text-ink">
                <span>
                  Permisos
                  <span aria-hidden="true" className="ml-0.5 text-danger-600">
                    *
                  </span>
                </span>
                <span className="font-normal text-ink-muted" aria-live="polite">
                  {selected.size} seleccionados
                </span>
              </legend>
              {fieldState.error && (
                <p id="role-permissions-error" role="alert" className="mb-2 text-[13px] text-danger-700">
                  {fieldState.error.message}
                </p>
              )}
              {catalog.isPending ? (
                <Spinner label="Cargando permisos" />
              ) : catalog.isError ? (
                <Alert tone="danger">{errorMessage(catalog.error)}</Alert>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {groupPermissions(catalog.data).map((group) => {
                    const codes = group.permissions.map((permission) => permission.code)
                    const count = codes.filter((code) => selected.has(code)).length

                    return (
                      <div key={group.label} className="rounded-control border border-line p-3">
                        <Checkbox
                          label={<span className="font-semibold">{group.label}</span>}
                          checked={count === codes.length}
                          ref={(element) => {
                            if (element) {
                              element.indeterminate = count > 0 && count < codes.length
                            }
                          }}
                          onChange={(event) => {
                            const next = new Set(selected)
                            for (const code of codes) {
                              if (event.target.checked) {
                                next.add(code)
                              } else {
                                next.delete(code)
                              }
                            }
                            setSelected(next)
                            field.onBlur()
                          }}
                          className="mb-2 border-b border-line pb-2"
                        />
                        <div className="flex flex-col gap-2 pl-6">
                          {group.permissions.map((permission) => (
                            <Checkbox
                              key={permission.code}
                              label={permission.description ?? permission.code}
                              description={permission.code}
                              checked={selected.has(permission.code)}
                              onChange={(event) => {
                                const next = new Set(selected)
                                if (event.target.checked) {
                                  next.add(permission.code)
                                } else {
                                  next.delete(permission.code)
                                }
                                setSelected(next)
                                field.onBlur()
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </fieldset>
          )
        }}
      />
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={save.isPending}>
          {readOnly ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!readOnly && (
          <Button type="submit" loading={save.isPending}>
            {role ? 'Guardar cambios' : 'Crear rol'}
          </Button>
        )}
      </div>
    </form>
  )
}
