import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ContractorForm } from '@/features/contractors/ContractorForm'
import type { Contractor } from '@/features/contractors/contractorTypes'
import { jsonResponse, renderWithProviders } from '@/test/helpers/renderWithProviders'

const fetchMock = vi.fn<typeof fetch>()

const existing: Contractor = {
  id: 3,
  full_name: 'Pedro Martínez',
  document_type: 'CEDULA',
  document_number: '00100000017',
  specialty: 'Albañil',
  worker_type: 'EMPLOYEE',
  phone: '809-555-0102',
  is_active: true,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: null,
  row_version: 'AAAAAAAAB9E=',
}

function setup(contractor?: Contractor) {
  const onSaved = vi.fn()
  const view = renderWithProviders(
    <ContractorForm {...(contractor ? { contractor } : {})} onSaved={onSaved} onCancel={vi.fn()} />,
  )

  return {
    ...view,
    onSaved,
    fullName: screen.getByLabelText(/nombre completo/i),
    workerType: screen.getByLabelText(/tipo de colaborador/i),
    specialty: screen.getByLabelText(/especialidad/i),
    documentType: screen.getByLabelText(/tipo de documento/i),
    documentNumber: screen.getByLabelText(/número de documento/i),
    phone: screen.getByLabelText(/teléfono/i),
    submit: screen.getByRole('button', { name: contractor ? 'Guardar cambios' : 'Crear colaborador' }),
  }
}

describe('ContractorForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('requires the name and the type of collaborator', async () => {
    const { user, submit } = setup()

    await user.click(submit)

    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('Seleccione si es empleado o contratista.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('orders name, type, specialty, document and phone', () => {
    const fields = setup()
    const order = [
      fields.fullName,
      fields.workerType,
      fields.specialty,
      fields.documentType,
      fields.documentNumber,
      fields.phone,
    ]

    for (let index = 1; index < order.length; index++) {
      expect(
        order[index - 1]!.compareDocumentPosition(order[index]!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    }
  })

  it('limits the texts to the database length', () => {
    const { fullName, specialty, phone } = setup()

    expect(fullName).toHaveAttribute('maxlength', '150')
    expect(specialty).toHaveAttribute('maxlength', '100')
    expect(phone).toHaveAttribute('maxlength', '30')
  })

  it('validates the cédula', async () => {
    const { user, fullName, workerType, documentType, documentNumber, submit } = setup()

    await user.type(fullName, 'Juan Pérez')
    await user.selectOptions(workerType, 'CONTRACTOR')
    await user.selectOptions(documentType, 'CEDULA')
    await user.type(documentNumber, '001-0000001-8')
    await user.click(submit)

    expect(
      await screen.findByText('La cédula debe tener 11 dígitos y un dígito verificador válido.'),
    ).toBeInTheDocument()
  })

  it('creates a contractor with the selected type', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { message: 'Colaborador creado.', data: existing }))
    const { user, fullName, workerType, specialty, submit, onSaved } = setup()

    await user.type(fullName, 'Juan Pérez')
    await user.selectOptions(workerType, 'CONTRACTOR')
    await user.type(specialty, 'Electricista')
    await user.click(submit)

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/workers')
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual({
      full_name: 'Juan Pérez',
      worker_type: 'CONTRACTOR',
      specialty: 'Electricista',
      document_type: null,
      document_number: null,
      phone: null,
    })
  })

  it('loads the record being edited and clears the number when the document type changes', async () => {
    const { user, documentType, documentNumber, workerType } = setup(existing)

    expect(workerType).toHaveValue('EMPLOYEE')
    expect(documentNumber).toHaveValue('001-0000001-7')

    await user.selectOptions(documentType, 'PASSPORT')
    expect(documentNumber).toHaveValue('')
  })
})
