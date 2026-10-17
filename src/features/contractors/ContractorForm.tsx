import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { applyServerErrors } from '@/core/errors/applyServerErrors'
import {
  CONTRACTOR_FIELDS,
  contractorDefaults,
  contractorSchema,
  toContractorPayload,
  type ContractorFormValues,
} from '@/features/contractors/contractorSchema'
import { WORKER_TYPE_OPTIONS, type Contractor } from '@/features/contractors/contractorTypes'
import { useContractorMutations } from '@/features/contractors/useContractors'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { DOCUMENT_TYPE_OPTIONS, DocumentInput } from '@/shared/components/DocumentInput'
import { FormField } from '@/shared/components/FormField'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'

export interface ContractorFormProps {
  contractor?: Contractor
  onSaved: (message: string) => void
  onCancel: () => void
}

export function ContractorForm({ contractor, onSaved, onCancel }: ContractorFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const { save } = useContractorMutations()
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<ContractorFormValues, unknown, ReturnType<typeof contractorSchema.parse>>({
    resolver: zodResolver(contractorSchema),
    defaultValues: contractorDefaults(contractor),
  })
  const documentType = useWatch({ control, name: 'documentType' })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    const payload = toContractorPayload(values)

    try {
      const result = await save.mutateAsync(
        contractor
          ? { id: contractor.id, update: { ...payload, row_version: contractor.row_version } }
          : { id: null, create: payload },
      )
      onSaved(result.message)
    } catch (error) {
      setFormError(applyServerErrors(error, setError, CONTRACTOR_FIELDS))
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} aria-label={contractor ? 'Editar colaborador' : 'Nuevo colaborador'}>
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
          <Input autoFocus maxLength={150} autoComplete="name" {...register('fullName')} />
        </FormField>
        <FormField label="Tipo de colaborador" required error={errors.workerType?.message}>
          <Select options={WORKER_TYPE_OPTIONS} placeholder="Seleccione" {...register('workerType')} />
        </FormField>
        <FormField
          label="Especialidad"
          optionalLabel
          hint="Por ejemplo: Albañil, Electricista, Plomero."
          error={errors.specialty?.message}
        >
          <Input maxLength={100} {...register('specialty')} />
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
          {contractor ? 'Guardar cambios' : 'Crear colaborador'}
        </Button>
      </div>
    </form>
  )
}
