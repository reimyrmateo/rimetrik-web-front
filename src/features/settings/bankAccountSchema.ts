import { z } from 'zod'
import type { BankAccount, BankAccountPayload } from '@/features/settings/settingsTypes'
import { dateField, moneyField, nullable, optionalText, requiredText } from '@/shared/validations/common'

export const bankAccountSchema = z
  .object({
    name: requiredText('El nombre', 120),
    accountType: z.enum(['', 'CHECKING', 'SAVINGS', 'CASH_BOX']).refine((value) => value !== '', {
      message: 'Seleccione el tipo de cuenta.',
    }),
    bankName: optionalText('El banco', 100),
    accountLast4: z
      .string()
      .trim()
      .refine((value) => value === '' || /^\d{4}$/.test(value), {
        message: 'Indique solo los últimos 4 dígitos de la cuenta.',
      }),
  })
  .superRefine((values, context) => {
    if (values.accountType !== 'CASH_BOX' && values.bankName === '') {
      context.addIssue({
        code: 'custom',
        path: ['bankName'],
        message: 'Indique el banco; solo las cajas de efectivo no lo llevan.',
      })
    }
  })

export type BankAccountFormValues = z.input<typeof bankAccountSchema>

export const BANK_ACCOUNT_FIELDS = ['name', 'accountType', 'bankName', 'accountLast4'] as const

export function bankAccountDefaults(account?: BankAccount): BankAccountFormValues {
  return {
    name: account?.name ?? '',
    accountType: account?.account_type ?? '',
    bankName: account?.bank_name ?? '',
    accountLast4: account?.account_last4 ?? '',
  }
}

export function toBankAccountPayload(values: z.output<typeof bankAccountSchema>): BankAccountPayload {
  const isCashBox = values.accountType === 'CASH_BOX'

  return {
    name: values.name,
    account_type: values.accountType,
    bank_name: isCashBox ? null : nullable(values.bankName),
    account_last4: isCashBox ? null : nullable(values.accountLast4),
  }
}

export const openingBalanceSchema = z.object({
  openingBalance: moneyField('El saldo inicial', { allowZero: true }),
  openingDate: dateField('La fecha del saldo inicial'),
})

export type OpeningBalanceFormValues = z.input<typeof openingBalanceSchema>

export const OPENING_BALANCE_FIELDS = ['openingBalance', 'openingDate'] as const
