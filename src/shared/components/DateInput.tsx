import type { Ref } from 'react'
import { Input, type InputProps } from '@/shared/components/Input'

export interface DateInputProps extends Omit<InputProps, 'type'> {
  ref?: Ref<HTMLInputElement>
}

export function DateInput({ min = '2000-01-01', max = '2100-12-31', ...props }: DateInputProps) {
  return <Input type="date" min={min} max={max} {...props} />
}
