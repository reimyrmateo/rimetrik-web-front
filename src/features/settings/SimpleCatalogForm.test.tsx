import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CategoryForm, UnitForm } from '@/features/settings/SimpleCatalogForm'
import type { ExpenseCategory, MeasurementUnit } from '@/features/settings/settingsTypes'
import { jsonResponse, renderWithProviders } from '@/test/helpers/renderWithProviders'

const fetchMock = vi.fn<typeof fetch>()

const unit: MeasurementUnit = {
  id: 2,
  name: 'Metro cuadrado',
  symbol: 'm²',
  is_active: true,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: null,
  row_version: 'AAAAAAAAB9E=',
}

const category: ExpenseCategory = {
  id: 3,
  name: 'Materiales',
  sort_order: 10,
  is_active: true,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: null,
  row_version: 'AAAAAAAAB9F=',
}

function sentBody(): Record<string, unknown> {
  return JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as Record<string, unknown>
}

describe('catalog forms', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => vi.unstubAllGlobals())

  describe('UnitForm', () => {
    it('requires the name and the symbol within their lengths', async () => {
      const { user } = renderWithProviders(<UnitForm onSaved={vi.fn()} onCancel={vi.fn()} />)
      const name = screen.getByLabelText(/nombre/i)
      const symbol = screen.getByLabelText(/símbolo/i)

      expect(name).toHaveFocus()
      expect(name).toHaveAttribute('maxlength', '80')
      expect(symbol).toHaveAttribute('maxlength', '15')

      await user.type(name, '   ')
      await user.click(screen.getByRole('button', { name: 'Crear unidad' }))

      expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument()
      expect(screen.getByText('El símbolo es obligatorio.')).toBeInTheDocument()
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('creates a trimmed unit', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(201, { message: 'Unidad creada.', data: unit }))
      const onSaved = vi.fn()
      const { user } = renderWithProviders(<UnitForm onSaved={onSaved} onCancel={vi.fn()} />)

      await user.type(screen.getByLabelText(/nombre/i), ' Metro lineal ')
      await user.type(screen.getByLabelText(/símbolo/i), ' ml ')
      await user.click(screen.getByRole('button', { name: 'Crear unidad' }))

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Unidad creada.'))
      expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/measurement-units')
      expect(sentBody()).toEqual({ name: 'Metro lineal', symbol: 'ml' })
    })

    it('edits with the row version and shows a duplicate reported by the server', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(409, { message: 'Ya existe una unidad con ese símbolo.', data: null }),
      )
      const onSaved = vi.fn()
      const { user } = renderWithProviders(<UnitForm unit={unit} onSaved={onSaved} onCancel={vi.fn()} />)

      await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una unidad con ese símbolo.')
      expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/measurement-units/2')
      expect(sentBody()).toEqual({ name: 'Metro cuadrado', symbol: 'm²', row_version: 'AAAAAAAAB9E=' })
      expect(onSaved).not.toHaveBeenCalled()
    })
  })

  describe('CategoryForm', () => {
    it('suggests the next position and requires the name', async () => {
      const { user } = renderWithProviders(
        <CategoryForm nextSortOrder={40} onSaved={vi.fn()} onCancel={vi.fn()} />,
      )

      expect(screen.getByLabelText(/orden/i)).toHaveValue('40')

      await user.click(screen.getByRole('button', { name: 'Crear categoría' }))

      expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument()
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it.each([
      ['', 'El orden es obligatorio.'],
      ['-1', 'El orden debe ser un número entero sin signo.'],
      ['2.5', 'El orden debe ser un número entero sin signo.'],
      ['10001', 'El orden debe estar entre 0 y 10000.'],
    ])('rejects the position %j', async (value, message) => {
      const { user } = renderWithProviders(<CategoryForm onSaved={vi.fn()} onCancel={vi.fn()} />)
      const order = screen.getByLabelText(/orden/i)

      await user.type(screen.getByLabelText(/nombre/i), 'Equipos')
      await user.clear(order)

      if (value !== '') {
        await user.type(order, value)
      }

      await user.click(screen.getByRole('button', { name: 'Crear categoría' }))

      expect(await screen.findByText(message)).toBeInTheDocument()
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('sends the position as a number with the row version', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse(200, { message: 'Categoría actualizada.', data: category }),
      )
      const onSaved = vi.fn()
      const { user } = renderWithProviders(
        <CategoryForm category={category} onSaved={onSaved} onCancel={vi.fn()} />,
      )
      const order = screen.getByLabelText(/orden/i)

      await user.clear(order)
      await user.type(order, '25')
      await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith('Categoría actualizada.'))
      expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/expense-categories/3')
      expect(sentBody()).toEqual({ name: 'Materiales', sort_order: 25, row_version: 'AAAAAAAAB9F=' })
    })
  })
})
