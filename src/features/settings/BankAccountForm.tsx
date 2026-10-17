import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { applyServerErrors } from '@/core/errors/applyServerErrors'
import {
  BANK_ACCOUNT_FIELDS,
  bankAccountDefaults,
  bankAccountSchema,
  toBankAccountPayload,
  type BankAccountFormValues,
} from '@/features/settings/bankAccountSchema'
import { ACCOUNT_TYPE_OPTIONS, type BankAccount } from '@/features/settings/settingsTypes'
import { useBankAccountMutations } from '@/features/settings/useSettings'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { FormField } from '@/shared/components/FormField'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'

export interface BankAccountFormProps {
  account?: BankAccount
  onSaved: (message: string) => void
  onCancel: () => void
}

export function BankAccountForm({ account, onSaved, onCancel }: BankAccountFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const { save } = useBankAccountMutations()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BankAccountFormValues, unknown, ReturnType<typeof bankAccountSchema.parse>>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: bankAccountDefaults(account),
  })
  const accountType = useWatch({ control, name: 'accountType' })
  const isCashBox = accountType === 'CASH_BOX'

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    const payload = toBankAccountPayload(values)

    try {
      const result = await save.mutateAsync(
        account
          ? { id: account.id, update: { ...payload, row_version: account.row_version } }
          : { id: null, create: payload },
      )
      onSaved(result.message)
    } catch (error) {
      setFormError(applyServerErrors(error, setError, BANK_ACCOUNT_FIELDS))
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} aria-label={account ? 'Editar cuenta' : 'Nueva cuenta'}>
      {formError && (
        <Alert tone="danger" className="mb-4">
          {formError}
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nombre de la cuenta"
          required
          hint="Como la reconocerá su equipo, por ejemplo: Banreservas · Corriente."
          error={errors.name?.message}
          className="sm:col-span-2"
        >
          <Input autoFocus maxLength={120} {...register('name')} />
        </FormField>
        <FormField
          label="Tipo de cuenta"
          required
          error={errors.accountType?.message}
          className="sm:col-span-2"
        >
          <Select options={ACCOUNT_TYPE_OPTIONS} placeholder="Seleccione" {...register('accountType')} />
        </FormField>
        {!isCashBox && (
          <>
            <FormField label="Banco" required error={errors.bankName?.message}>
              <Input maxLength={100} {...register('bankName')} />
            </FormField>
            <FormField
              label="Últimos 4 dígitos"
              optionalLabel
              hint="No se guarda el número completo."
              error={errors.accountLast4?.message}
            >
              <Input
                inputMode="numeric"
                maxLength={4}
                autoComplete="off"
                placeholder="0000"
                {...register('accountLast4')}
              />
            </FormField>
          </>
        )}
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={save.isPending}>
          {account ? 'Guardar cambios' : 'Crear cuenta'}
        </Button>
      </div>
    </form>
  )
}
