import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { applyServerErrors } from '@/core/errors/applyServerErrors'
import {
  SUPPLIER_FIELDS,
  supplierDefaults,
  supplierSchema,
  toSupplierPayload,
  type SupplierFormValues,
} from '@/features/suppliers/supplierSchema'
import type { Supplier } from '@/features/suppliers/supplierTypes'
import { useSupplierMutations } from '@/features/suppliers/useSuppliers'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { DOCUMENT_TYPE_OPTIONS, DocumentInput } from '@/shared/components/DocumentInput'
import { FormField } from '@/shared/components/FormField'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'

export interface SupplierFormProps {
  supplier?: Supplier
  onSaved: (message: string) => void
  onCancel: () => void
}

export function SupplierForm({ supplier, onSaved, onCancel }: SupplierFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const { save } = useSupplierMutations()
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<SupplierFormValues, unknown, ReturnType<typeof supplierSchema.parse>>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplierDefaults(supplier),
  })
  const documentType = useWatch({ control, name: 'documentType' })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    const payload = toSupplierPayload(values)

    try {
      const result = await save.mutateAsync(
        supplier
          ? { id: supplier.id, update: { ...payload, row_version: supplier.row_version } }
          : { id: null, create: payload },
      )
      onSaved(result.message)
    } catch (error) {
      setFormError(applyServerErrors(error, setError, SUPPLIER_FIELDS))
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} aria-label={supplier ? 'Editar proveedor' : 'Nuevo proveedor'}>
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
        <FormField
          label="Categoría"
          optionalLabel
          hint="Por ejemplo: Ferretería, Transporte, Equipos."
          error={errors.category?.message}
          className="sm:col-span-2"
        >
          <Input maxLength={60} {...register('category')} />
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
        <FormField label="Correo electrónico" optionalLabel error={errors.email?.message}>
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
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={save.isPending}>
          {supplier ? 'Guardar cambios' : 'Crear proveedor'}
        </Button>
      </div>
    </form>
  )
}
