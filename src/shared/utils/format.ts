const LOCALE = 'es-DO'

const moneyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'DOP',
  currencyDisplay: 'code',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 4 })

const compactFormatter = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 })

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Santo_Domingo',
})

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }

  return moneyFormatter
    .format(value)
    .replace('DOP', 'RD$')
    .replace(/\u00a0/g, ' ')
}

export function formatCompactMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }

  return `RD$ ${compactFormatter.format(value)}`
}

export function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined || Number.isNaN(value) ? '—' : numberFormatter.format(value)
}

export function formatPercent(value: number | null | undefined, fractionDigits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }

  return `${value.toLocaleString(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: fractionDigits })} %`
}

export function parseDateOnly(value: string): Date | null {
  const match = DATE_ONLY.exec(value)

  if (!match) {
    return null
  }

  const [, year, month, day] = match.map(Number) as [number, number, number, number]
  const date = new Date(Date.UTC(year, month - 1, day))

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? date
    : null
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  const date = parseDateOnly(value.slice(0, 10))

  return date ? dateFormatter.format(date) : '—'
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}

export function todayInBusinessZone(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo' }).format(new Date())
}

export function formatDocument(type: string | null | undefined, number: string | null | undefined): string {
  if (!number) {
    return '—'
  }

  if (type === 'CEDULA' && /^\d{11}$/.test(number)) {
    return `${number.slice(0, 3)}-${number.slice(3, 10)}-${number.slice(10)}`
  }

  if (type === 'RNC' && /^\d{9}$/.test(number)) {
    return `${number.slice(0, 1)}-${number.slice(1, 3)}-${number.slice(3, 8)}-${number.slice(8)}`
  }

  return number
}
