import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { formatMoneyInput, MoneyInput, sanitizeMoney } from '@/shared/components/MoneyInput'

function Harness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return <MoneyInput aria-label="Monto" value={value} onValueChange={setValue} />
}

describe('MoneyInput', () => {
  it('accepts only digits with up to two decimals', () => {
    expect(sanitizeMoney('1,250.5')).toBe('1250.5')
    expect(sanitizeMoney('12.345')).toBeNull()
    expect(sanitizeMoney('-5')).toBeNull()
    expect(sanitizeMoney('abc')).toBeNull()
  })

  it('formats with thousands and two decimals', () => {
    expect(formatMoneyInput('1250.5')).toBe('1,250.50')
    expect(formatMoneyInput('007')).toBe('7.00')
    expect(formatMoneyInput('9999999999999999.99')).toBe('9,999,999,999,999,999.99')
    expect(formatMoneyInput('')).toBe('')
  })

  it('ignores invalid keystrokes and formats on blur', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByLabelText('Monto')

    await user.type(input, '12a50.759')
    expect(input).toHaveValue('1250.75')

    await user.tab()
    expect(input).toHaveValue('1,250.75')

    await user.click(input)
    expect(input).toHaveValue('1250.75')
  })
})
