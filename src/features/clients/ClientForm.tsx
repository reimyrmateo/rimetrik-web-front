import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { applyServerErrors } from '@/core/errors/applyServerErrors'
import {
  CLIENT_FIELDS,
  clientDefaults,
  clientSchema,
  toClientPayload,
  type ClientFormValues,
} from '@/features/clients/clientSchema'
import type { Client } from '@/features/clients/clientTypes'
import { useClientMutations } from '@/features/clients/useClients'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { DOCUMENT_TYPE_OPTIONS, DocumentInput } from '@/shared/components/DocumentInput'
import { FormField } from '@/shared/components/FormField'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { Textarea } from '@/shared/components/Textarea'

export interface ClientFormProps {
  client?: Client
  onSaved: (message: string) => void
  onCancel: () => void
}

export function ClientForm({ client, onSaved, onCancel }: ClientFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const { save } = useClientMutations()
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<ClientFormValues, unknown, ReturnType<typeof clientSchema.parse>>({
    resolver: zodResolver(clientSchema),
    defaultValues: clientDefaults(client),
  })
  const documentType = useWatch({ control, name: 'documentType' })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    const payload = toClientPayload(values)

    try {
      const result = await save.mutateAsync(
        client
          ? { id: client.id, update: { ...payload, row_version: client.row_version } }
          : { id: null, create: payload },
      )
      onSaved(result.message)
    } catch (error) {
      setFormError(applyServerErrors(error, setError, CLIENT_FIELDS))
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} aria-label={client ? 'Editar cliente' : 'Nuevo cliente'}>
      {formError && (
        <Alert tone="danger" className="mb-4">
          {formError}
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nombre o razón social"
          required
          error={errors.name?.message}
          className="sm:col-span-2"
        >
          <Input autoFocus maxLength={200} autoComplete="organization" {...register('name')} />
        </FormField>
        <FormField label="Tipo de documento" optionalLabel error={errors.documentType?.message}>
          <Select
            options={DOCUMENT_TYPE_OPTIONS}
            placeholder="Sin documento"
            {...register('documentType', {
              onChange: () => setValue('documentNumber', '', { shouldValidate: false }),
            })}
          />
        </FormField>
        <FormField
          label="Número de documento"
          error={errors.documentNumber?.message}
          required={documentType !== ''}
        >
          <Controller
            control={control}
            name="documentNumber"
            render={({ field }) => (
              <DocumentInput
                documentType={documentType}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            )}
          />
        </FormField>
        <FormField label="Correo electrónico" required error={errors.email?.message}>
          <Input type="email" maxLength={256} autoComplete="email" {...register('email')} />
        </FormField>
        <FormField label="Teléfono" optionalLabel error={errors.phone?.message}>
          <Input
            type="tel"
            maxLength={30}
            autoComplete="tel"
            placeholder="809-000-0000"
            {...register('phone')}
          />
        </FormField>
        <FormField label="Dirección" optionalLabel error={errors.address?.message} className="sm:col-span-2">
          <Textarea rows={2} maxLength={300} autoComplete="street-address" {...register('address')} />
        </FormField>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={save.isPending}>
          {client ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </div>
    </form>
  )
}
