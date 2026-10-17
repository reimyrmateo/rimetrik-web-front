import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { applyServerErrors } from '@/core/errors/applyServerErrors'
import {
  CATEGORY_FIELDS,
  categorySchema,
  UNIT_FIELDS,
  unitSchema,
  type CategoryFormValues,
  type UnitFormValues,
} from '@/features/settings/catalogSchema'
import type { ExpenseCategory, MeasurementUnit } from '@/features/settings/settingsTypes'
import { useCategoryMutations, useUnitMutations } from '@/features/settings/useSettings'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { FormField } from '@/shared/components/FormField'
import { Input } from '@/shared/components/Input'

interface FormActionsProps {
  editing: boolean
  pending: boolean
  onCancel: () => void
  createLabel: string
}

function FormActions({ editing, pending, onCancel, createLabel }: FormActionsProps) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="secondary" onClick={onCancel} disabled={pending}>
        Cancelar
      </Button>
      <Button type="submit" loading={pending}>
        {editing ? 'Guardar cambios' : createLabel}
      </Button>
    </div>
  )
}

export interface UnitFormProps {
  unit?: MeasurementUnit
  onSaved: (message: string) => void
  onCancel: () => void
}

export function UnitForm({ unit, onSaved, onCancel }: UnitFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const { save } = useUnitMutations()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: { name: unit?.name ?? '', symbol: unit?.symbol ?? '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    const payload = { name: values.name, symbol: values.symbol }

    try {
      const result = await save.mutateAsync(
        unit
          ? { id: unit.id, update: { ...payload, row_version: unit.row_version } }
          : { id: null, create: payload },
      )
      onSaved(result.message)
    } catch (error) {
      setFormError(applyServerErrors(error, setError, UNIT_FIELDS))
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} aria-label={unit ? 'Editar unidad' : 'Nueva unidad'}>
      {formError && (
        <Alert tone="danger" className="mb-4">
          {formError}
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <FormField label="Nombre" required error={errors.name?.message}>
          <Input autoFocus maxLength={80} placeholder="Metro cuadrado" {...register('name')} />
        </FormField>
        <FormField label="Símbolo" required error={errors.symbol?.message}>
          <Input maxLength={15} placeholder="m²" {...register('symbol')} />
        </FormField>
      </div>
      <FormActions
        editing={Boolean(unit)}
        pending={save.isPending}
        onCancel={onCancel}
        createLabel="Crear unidad"
      />
    </form>
  )
}

export interface CategoryFormProps {
  category?: ExpenseCategory
  nextSortOrder?: number
  onSaved: (message: string) => void
  onCancel: () => void
}

export function CategoryForm({ category, nextSortOrder = 0, onSaved, onCancel }: CategoryFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const { save } = useCategoryMutations()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CategoryFormValues, unknown, ReturnType<typeof categorySchema.parse>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: category?.name ?? '', sortOrder: String(category?.sort_order ?? nextSortOrder) },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    const payload = { name: values.name, sort_order: values.sortOrder }

    try {
      const result = await save.mutateAsync(
        category
          ? { id: category.id, update: { ...payload, row_version: category.row_version } }
          : { id: null, create: payload },
      )
      onSaved(result.message)
    } catch (error) {
      setFormError(applyServerErrors(error, setError, CATEGORY_FIELDS))
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} aria-label={category ? 'Editar categoría' : 'Nueva categoría'}>
      {formError && (
        <Alert tone="danger" className="mb-4">
          {formError}
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <FormField label="Nombre" required error={errors.name?.message}>
          <Input autoFocus maxLength={80} placeholder="Materiales" {...register('name')} />
        </FormField>
        <FormField label="Orden" required hint="Posición en las listas." error={errors.sortOrder?.message}>
          <Input inputMode="numeric" maxLength={5} {...register('sortOrder')} />
        </FormField>
      </div>
      <FormActions
        editing={Boolean(category)}
        pending={save.isPending}
        onCancel={onCancel}
        createLabel="Crear categoría"
      />
    </form>
  )
}
