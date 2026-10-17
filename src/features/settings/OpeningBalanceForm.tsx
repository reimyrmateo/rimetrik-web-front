import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { applyServerErrors } from '@/core/errors/applyServerErrors'
import {
  OPENING_BALANCE_FIELDS,
  openingBalanceSchema,
  type OpeningBalanceFormValues,
} from '@/features/settings/bankAccountSchema'
import type { BankAccount } from '@/features/settings/settingsTypes'
import { useOpeningBalance } from '@/features/settings/useSettings'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { DateInput } from '@/shared/components/DateInput'
import { FormField } from '@/shared/components/FormField'
import { formatMoneyInput, MoneyInput } from '@/shared/components/MoneyInput'
import { todayInBusinessZone } from '@/shared/utils/format'

export interface OpeningBalanceFormProps {
  account: BankAccount
  onSaved: (message: string) => void
  onCancel: () => void
}

export function OpeningBalanceForm({ account, onSaved, onCancel }: OpeningBalanceFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const mutation = useOpeningBalance()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OpeningBalanceFormValues, unknown, ReturnType<typeof openingBalanceSchema.parse>>({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: {
      openingBalance: account.opening_date ? formatMoneyInput(account.opening_balance.toFixed(2)) : '',
      openingDate: account.opening_date ?? todayInBusinessZone(),
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)

    try {
      const result = await mutation.mutateAsync({
        id: account.id,
        payload: {
          opening_balance: values.openingBalance,
          opening_date: values.openingDate,
          row_version: account.row_version,
        },
      })
      onSaved(result.message)
    } catch (error) {
      setFormError(applyServerErrors(error, setError, OPENING_BALANCE_FIELDS))
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} aria-label="Saldo inicial">
      <Alert tone="info" className="mb-4">
        Solo puede definirse mientras la cuenta no tenga pagos, cobros, gastos de contado ni transferencias.
        Ningún movimiento podrá tener fecha anterior.
      </Alert>
      {formError && (
        <Alert tone="danger" className="mb-4">
          {formError}
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Saldo inicial" required error={errors.openingBalance?.message}>
          <Controller
            control={control}
            name="openingBalance"
            render={({ field }) => (
              <MoneyInput
                autoFocus
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            )}
          />
        </FormField>
        <FormField label="Fecha del saldo" required error={errors.openingDate?.message}>
          <DateInput {...register('openingDate')} />
        </FormField>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          Guardar saldo inicial
        </Button>
      </div>
    </form>
  )
}
