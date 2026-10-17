import type { ChangeEvent, FocusEvent, Ref } from 'react'
import { Input, type InputProps } from '@/shared/components/Input'

export interface MoneyInputProps extends Omit<InputProps, 'type' | 'value' | 'onChange' | 'inputMode'> {
  value: string
  onValueChange: (value: string) => void
  ref?: Ref<HTMLInputElement>
}

const ALLOWED = /^\d*(\.\d{0,2})?$/

export function sanitizeMoney(raw: string): string | null {
  const plain = raw.replace(/[,\s]/g, '')
  return ALLOWED.test(plain) ? plain : null
}

export function formatMoneyInput(value: string): string {
  if (value === '' || Number.isNaN(Number(value))) {
    return value
  }

  const [integer = '', decimals] = value.split('.')
  const grouped = (integer.replace(/^0+(?=\d)/, '') || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return `${grouped}.${(decimals ?? '').padEnd(2, '0')}`
}

export function MoneyInput({ value, onValueChange, onBlur, onFocus, ...props }: MoneyInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = sanitizeMoney(event.target.value)

    if (next !== null) {
      onValueChange(next)
    }
  }

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    onValueChange(value.replace(/,/g, ''))
    onFocus?.(event)
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    onValueChange(formatMoneyInput(value.replace(/,/g, '')))
    onBlur?.(event)
  }

  return (
    <Input
      inputMode="decimal"
      autoComplete="off"
      leading={<span className="text-[13px] font-semibold">RD$</span>}
      className="tabular text-right"
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  )
}
