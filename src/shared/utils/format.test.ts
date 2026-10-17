import { describe, expect, it } from 'vitest'
import { formatDate, formatMoney, formatPercent, parseDateOnly } from '@/shared/utils/format'

describe('format', () => {
  it('formats money in Dominican pesos', () => {
    expect(formatMoney(1234567.5)).toBe('RD$ 1,234,567.50')
    expect(formatMoney(null)).toBe('—')
  })

  it('formats date-only values without shifting the day by time zone', () => {
    expect(formatDate('2026-10-01')).toMatch(/^01/)
    expect(formatDate('2026-02-30')).toBe('—')
    expect(formatDate(null)).toBe('—')
  })

  it('validates real calendar dates', () => {
    expect(parseDateOnly('2026-12-31')).not.toBeNull()
    expect(parseDateOnly('2026-13-01')).toBeNull()
    expect(parseDateOnly('01/10/2026')).toBeNull()
  })

  it('formats percentages', () => {
    expect(formatPercent(85)).toBe('85 %')
    expect(formatPercent(undefined)).toBe('—')
  })
})
