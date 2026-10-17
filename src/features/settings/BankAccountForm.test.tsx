import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BankAccountForm } from '@/features/settings/BankAccountForm'
import type { BankAccount } from '@/features/settings/settingsTypes'
import { jsonResponse, renderWithProviders } from '@/test/helpers/renderWithProviders'

const fetchMock = vi.fn<typeof fetch>()

const existing: BankAccount = {
  id: 4,
  name: 'Banreservas · Corriente',
  account_type: 'CHECKING',
  bank_name: 'Banreservas',
  account_last4: '1234',
  opening_balance: 0,
  opening_date: null,
  is_active: true,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: null,
  row_version: 'AAAAAAAAB9E=',
}

function setup(account?: BankAccount) {
  const onSaved = vi.fn()
  const view = renderWithProviders(
    <BankAccountForm {...(account ? { account } : {})} onSaved={onSaved} onCancel={vi.fn()} />,
  )

  return {
    ...view,
    onSaved,
    name: screen.getByLabelText(/nombre de la cuenta/i),
    accountType: screen.getByLabelText(/tipo de cuenta/i),
    submit: screen.getByRole('button', { name: account ? 'Guardar cambios' : 'Crear cuenta' }),
  }
}

function sentBody(): Record<string, unknown> {
  return JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as Record<string, unknown>
}

describe('BankAccountForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('orders the fields from name to account digits and limits their length', () => {
    const { name, accountType } = setup()
    const bank = screen.getByLabelText(/^banco/i)
    const last4 = screen.getByLabelText(/últimos 4 dígitos/i)
    const order = [name, accountType, bank, last4]

    for (let index = 1; index < order.length; index++) {
      expect(
        order[index - 1]!.compareDocumentPosition(order[index]!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    }

    expect(name).toHaveFocus()
    expect(name).toHaveAttribute('maxlength', '120')
    expect(bank).toHaveAttribute('maxlength', '100')
    expect(last4).toHaveAttribute('maxlength', '4')
  })

  it('requires the name, the type and the bank', async () => {
    const { user, submit } = setup()

    await user.click(submit)

    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('Seleccione el tipo de cuenta.')).toBeInTheDocument()
    expect(screen.getByText('Indique el banco; solo las cajas de efectivo no lo llevan.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('accepts only four digits for the account', async () => {
    const { user, name, accountType, submit } = setup()

    await user.type(name, 'Popular')
    await user.selectOptions(accountType, 'SAVINGS')
    await user.type(screen.getByLabelText(/^banco/i), 'Banco Popular')
    await user.type(screen.getByLabelText(/últimos 4 dígitos/i), '12a4')
    await user.click(submit)

    expect(await screen.findByText('Indique solo los últimos 4 dígitos de la cuenta.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('hides the bank fields for a cash box and sends them as null', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { message: 'Cuenta creada.', data: existing }))
    const { user, name, accountType, submit, onSaved } = setup()

    await user.type(name, '  Caja de obra ')
    await user.selectOptions(accountType, 'CASH_BOX')

    expect(screen.queryByLabelText(/^banco/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/últimos 4 dígitos/i)).not.toBeInTheDocument()

    await user.click(submit)

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Cuenta creada.'))
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/bank-accounts')
    expect(sentBody()).toEqual({
      name: 'Caja de obra',
      account_type: 'CASH_BOX',
      bank_name: null,
      account_last4: null,
    })
  })

  it('edits with the row version it read', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { message: 'Cuenta actualizada.', data: existing }))
    const { user, submit, onSaved } = setup(existing)

    await user.clear(screen.getByLabelText(/últimos 4 dígitos/i))
    await user.click(submit)

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/bank-accounts/4')
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('PUT')
    expect(sentBody()).toEqual({
      name: 'Banreservas · Corriente',
      account_type: 'CHECKING',
      bank_name: 'Banreservas',
      account_last4: null,
      row_version: 'AAAAAAAAB9E=',
    })
  })

  it('shows duplicates and concurrency conflicts from the server', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(409, { message: 'Ya existe una cuenta con ese nombre.', data: null }),
    )
    const { user, submit, onSaved } = setup(existing)

    await user.click(submit)

    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una cuenta con ese nombre.')
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('places server field errors under their input', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, {
        message: 'El banco es obligatorio.',
        data: [{ field: 'bank_name', messages: ['El banco es obligatorio.'] }],
      }),
    )
    const { user, submit } = setup(existing)

    await user.click(submit)

    await waitFor(() => expect(screen.getByLabelText(/^banco/i)).toHaveAttribute('aria-invalid', 'true'))
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getByRole('alert')).toHaveTextContent('El banco es obligatorio.')
  })
})
