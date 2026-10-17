import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SupplierForm } from '@/features/suppliers/SupplierForm'
import type { Supplier } from '@/features/suppliers/supplierTypes'
import { jsonResponse, renderWithProviders } from '@/test/helpers/renderWithProviders'

const fetchMock = vi.fn<typeof fetch>()

const existing: Supplier = {
  id: 4,
  name: 'Ferretería Central',
  document_type: null,
  document_number: null,
  category: 'Ferretería',
  email: null,
  phone: null,
  is_active: true,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: null,
  row_version: 'AAAAAAAAB9E=',
}

function setup(supplier?: Supplier) {
  const onSaved = vi.fn()
  const view = renderWithProviders(
    <SupplierForm {...(supplier ? { supplier } : {})} onSaved={onSaved} onCancel={vi.fn()} />,
  )

  return {
    ...view,
    onSaved,
    name: screen.getByLabelText(/nombre o razón social/i),
    category: screen.getByLabelText(/categoría/i),
    documentType: screen.getByLabelText(/tipo de documento/i),
    documentNumber: screen.getByLabelText(/número de documento/i),
    email: screen.getByLabelText(/correo electrónico/i),
    phone: screen.getByLabelText(/teléfono/i),
    submit: screen.getByRole('button', { name: supplier ? 'Guardar cambios' : 'Crear proveedor' }),
  }
}

describe('SupplierForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('orders name, category, document and contact', () => {
    const fields = setup()
    const order = [
      fields.name,
      fields.category,
      fields.documentType,
      fields.documentNumber,
      fields.email,
      fields.phone,
    ]

    for (let index = 1; index < order.length; index++) {
      expect(
        order[index - 1]!.compareDocumentPosition(order[index]!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    }
  })

  it('only requires the name', async () => {
    const { user, submit } = setup()

    await user.click(submit)

    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(screen.queryByText('El correo es obligatorio.')).not.toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('validates the optional email only when it is filled', async () => {
    const { user, name, email, submit } = setup()

    await user.type(name, 'Transporte Rápido')
    await user.type(email, 'ventas@')
    await user.click(submit)

    expect(await screen.findByText('El correo no tiene un formato válido.')).toBeInTheDocument()
  })

  it('limits the category to 60 characters', () => {
    const { category, name } = setup()

    expect(category).toHaveAttribute('maxlength', '60')
    expect(name).toHaveAttribute('maxlength', '200')
  })

  it('validates the RNC of the supplier', async () => {
    const { user, name, documentType, documentNumber, submit } = setup()

    await user.type(name, 'Ferretería Norte')
    await user.selectOptions(documentType, 'RNC')
    await user.type(documentNumber, '12345')
    await user.click(submit)

    expect(
      await screen.findByText('El RNC debe tener 9 dígitos y un dígito verificador válido.'),
    ).toBeInTheDocument()
  })

  it('sends nulls for empty optional fields', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { message: 'Proveedor creado.', data: existing }))
    const { user, name, documentType, documentNumber, submit, onSaved } = setup()

    await user.type(name, 'Ferretería Norte')
    await user.selectOptions(documentType, 'RNC')
    await user.type(documentNumber, '4-01-50625-4')
    await user.click(submit)

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Proveedor creado.'))
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual({
      name: 'Ferretería Norte',
      category: null,
      document_type: 'RNC',
      document_number: '401506254',
      email: null,
      phone: null,
    })
  })

  it('shows a duplicate document reported by the server', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(409, { message: 'Ya existe un proveedor con ese documento.', data: null }),
    )
    const { user, submit } = setup(existing)

    await user.click(submit)

    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe un proveedor con ese documento.')
  })
})
