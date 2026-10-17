import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OpeningBalanceForm } from '@/features/settings/OpeningBalanceForm'
import type { BankAccount } from '@/features/settings/settingsTypes'
import { jsonResponse, renderWithProviders } from '@/test/helpers/renderWithProviders'

const fetchMock = vi.fn<typeof fetch>()

const account: BankAccount = {
  id: 4,
  name: 'Caja de obra',
  account_type: 'CASH_BOX',
  bank_name: null,
  account_last4: null,
  opening_balance: 0,
  opening_date: null,
  is_active: true,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: null,
  row_version: 'AAAAAAAAB9E=',
}

function setup(value: BankAccount = account) {
  const onSaved = vi.fn()
  const view = renderWithProviders(
    <OpeningBalanceForm account={value} onSaved={onSaved} onCancel={vi.fn()} />,
  )

  return {
    ...view,
    onSaved,
    balance: screen.getByLabelText(/saldo inicial/i, { selector: 'input' }),
    date: screen.getByLabelText(/fecha del saldo/i),
    submit: screen.getByRole('button', { name: 'Guardar saldo inicial' }),
  }
}

describe('OpeningBalanceForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('starts with the balance first and today as the date', () => {
    const { balance, date } = setup()

    expect(balance).toHaveFocus()
    expect(balance.compareDocumentPosition(date) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(date).not.toHaveValue('')
  })

  it('requires both values', async () => {
    const { user, date, submit } = setup()

    await user.clear(date)
    await user.click(submit)

    expect(await screen.findByText('El saldo inicial es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('La fecha del saldo inicial es obligatoria.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('ignores letters, signs and a third decimal while typing', async () => {
    const { user, balance } = setup()

    await user.type(balance, '-1a2.345')

    expect(balance).toHaveValue('12.34')
  })

  it('allows a zero balance and sends a number with the row version', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { message: 'Saldo inicial registrado.', data: account }),
    )
    const { user, balance, date, submit, onSaved } = setup()

    await user.type(balance, '0')
    await user.clear(date)
    await user.type(date, '2026-10-01')
    await user.click(submit)

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Saldo inicial registrado.'))
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/bank-accounts/4/opening-balance')
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('PUT')
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual({
      opening_balance: 0,
      opening_date: '2026-10-01',
      row_version: 'AAAAAAAAB9E=',
    })
  })

  it('shows the current balance formatted when it was already defined', () => {
    const { balance, date } = setup({ ...account, opening_balance: 1500000.5, opening_date: '2026-09-15' })

    expect(balance).toHaveValue('1,500,000.50')
    expect(date).toHaveValue('2026-09-15')
  })

  it('explains that an account with movements cannot change its balance', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(422, {
        message: 'La cuenta ya tiene movimientos; el saldo inicial no puede cambiarse.',
        data: null,
      }),
    )
    const { user, balance, submit, onSaved } = setup()

    await user.type(balance, '1000')
    await user.click(submit)

    expect(await screen.findByRole('alert')).toHaveTextContent('La cuenta ya tiene movimientos')
    expect(onSaved).not.toHaveBeenCalled()
  })
})
