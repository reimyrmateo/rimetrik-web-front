import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClientForm } from '@/features/clients/ClientForm'
import type { Client } from '@/features/clients/clientTypes'
import { jsonResponse, renderWithProviders } from '@/test/helpers/renderWithProviders'

const fetchMock = vi.fn<typeof fetch>()

const existing: Client = {
  id: 9,
  name: 'Constructora Ejemplo',
  document_type: 'RNC',
  document_number: '401506254',
  email: 'obras@ejemplo.test',
  phone: '809-555-0101',
  address: 'Av. Principal 1',
  is_active: true,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: null,
  row_version: 'AAAAAAAAB9E=',
}

function setup(client?: Client) {
  const onSaved = vi.fn()
  const onCancel = vi.fn()
  const view = renderWithProviders(
    <ClientForm {...(client ? { client } : {})} onSaved={onSaved} onCancel={onCancel} />,
  )

  return {
    ...view,
    onSaved,
    onCancel,
    name: screen.getByLabelText(/nombre o razón social/i),
    documentType: screen.getByLabelText(/tipo de documento/i),
    documentNumber: screen.getByLabelText(/número de documento/i),
    email: screen.getByLabelText(/correo electrónico/i),
    phone: screen.getByLabelText(/teléfono/i),
    address: screen.getByLabelText(/dirección/i),
    submit: screen.getByRole('button', { name: client ? 'Guardar cambios' : 'Crear cliente' }),
  }
}

function sentBody(call = 0): Record<string, unknown> {
  return JSON.parse(fetchMock.mock.calls[call]?.[1]?.body as string) as Record<string, unknown>
}

describe('ClientForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('orders the fields from identity to contact', () => {
    const fields = setup()
    const order = [
      fields.name,
      fields.documentType,
      fields.documentNumber,
      fields.email,
      fields.phone,
      fields.address,
    ]

    for (let index = 1; index < order.length; index++) {
      expect(
        order[index - 1]!.compareDocumentPosition(order[index]!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    }

    expect(fields.name).toHaveFocus()
  })

  it('requires the name and the email', async () => {
    const { user, submit } = setup()

    await user.click(submit)

    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('El correo es obligatorio.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects names made only of spaces and malformed emails', async () => {
    const { user, name, email, submit } = setup()

    await user.type(name, '   ')
    await user.type(email, 'obras@')
    await user.click(submit)

    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('El correo no tiene un formato válido.')).toBeInTheDocument()
  })

  it('limits every text to the database length', () => {
    const { name, documentNumber, email, phone, address } = setup()

    expect(name).toHaveAttribute('maxlength', '200')
    expect(documentNumber).toHaveAttribute('maxlength', '30')
    expect(email).toHaveAttribute('maxlength', '256')
    expect(phone).toHaveAttribute('maxlength', '30')
    expect(address).toHaveAttribute('maxlength', '300')
  })

  it('keeps the number disabled until a document type is chosen', async () => {
    const { user, documentType, documentNumber } = setup()

    expect(documentNumber).toBeDisabled()
    await user.selectOptions(documentType, 'CEDULA')
    expect(documentNumber).toBeEnabled()
  })

  it('requires the number once a document type is chosen', async () => {
    const { user, name, email, documentType, submit } = setup()

    await user.type(name, 'Ana Pérez')
    await user.type(email, 'ana@ejemplo.test')
    await user.selectOptions(documentType, 'CEDULA')
    await user.click(submit)

    expect(await screen.findByText('Indique el número de documento.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('validates the cédula check digit', async () => {
    const { user, name, email, documentType, documentNumber, submit } = setup()

    await user.type(name, 'Ana Pérez')
    await user.type(email, 'ana@ejemplo.test')
    await user.selectOptions(documentType, 'CEDULA')
    await user.type(documentNumber, '00100000018')
    await user.click(submit)

    expect(
      await screen.findByText('La cédula debe tener 11 dígitos y un dígito verificador válido.'),
    ).toBeInTheDocument()
  })

  it('validates the RNC check digit', async () => {
    const { user, name, email, documentType, documentNumber, submit } = setup()

    await user.type(name, 'Constructora')
    await user.type(email, 'obras@ejemplo.test')
    await user.selectOptions(documentType, 'RNC')
    await user.type(documentNumber, '401506255')
    await user.click(submit)

    expect(
      await screen.findByText('El RNC debe tener 9 dígitos y un dígito verificador válido.'),
    ).toBeInTheDocument()
  })

  it('formats the cédula and sends only digits and nulls for empty optionals', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { message: 'Cliente creado.', data: existing }))
    const { user, name, email, documentType, documentNumber, submit, onSaved } = setup()

    await user.type(name, '  Ana Pérez ')
    await user.selectOptions(documentType, 'CEDULA')
    await user.type(documentNumber, '00100000017')
    await user.tab()
    expect(documentNumber).toHaveValue('001-0000001-7')
    await user.type(email, 'ana@ejemplo.test')
    await user.click(submit)

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Cliente creado.'))
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/customers')
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST')
    expect(sentBody()).toEqual({
      name: 'Ana Pérez',
      document_type: 'CEDULA',
      document_number: '00100000017',
      email: 'ana@ejemplo.test',
      phone: null,
      address: null,
    })
  })

  it('edits with the row version it read and shows the formatted document', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { message: 'Cliente actualizado.', data: existing }))
    const { user, documentNumber, phone, submit, onSaved } = setup(existing)

    expect(documentNumber).toHaveValue('4-01-50625-4')
    await user.clear(phone)
    await user.click(submit)

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/customers/9')
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('PUT')
    expect(sentBody()).toMatchObject({
      document_number: '401506254',
      phone: null,
      row_version: 'AAAAAAAAB9E=',
    })
  })

  it('shows duplicates and concurrency conflicts from the server', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(409, {
        message: 'Otro usuario modificó el registro. Recargue e intente de nuevo.',
        data: null,
      }),
    )
    const { user, submit, onSaved } = setup(existing)

    await user.click(submit)

    expect(await screen.findByRole('alert')).toHaveTextContent('Otro usuario modificó el registro.')
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('places server field errors under their input', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, {
        message: 'La cédula debe tener 11 dígitos y un dígito verificador válido.',
        data: [
          {
            field: 'document_number',
            messages: ['La cédula debe tener 11 dígitos y un dígito verificador válido.'],
          },
        ],
      }),
    )
    const { user, submit, documentNumber } = setup(existing)

    await user.click(submit)

    expect(
      await screen.findByText('La cédula debe tener 11 dígitos y un dígito verificador válido.'),
    ).toBeInTheDocument()
    expect(documentNumber).toHaveAttribute('aria-invalid', 'true')
  })

  it('cancels without saving', async () => {
    const { user, onCancel } = setup()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCancel).toHaveBeenCalledOnce()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
