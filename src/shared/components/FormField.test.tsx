import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormField } from '@/shared/components/FormField'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'

describe('FormField', () => {
  it('links the label, hint and required state to the control', () => {
    render(
      <FormField label="Nombre" required hint="Como aparece en el contrato">
        <Input />
      </FormField>,
    )

    const input = screen.getByLabelText(/nombre/i)
    expect(input).toHaveAttribute('aria-required', 'true')
    expect(input).toHaveAccessibleDescription('Como aparece en el contrato')
    expect(input).not.toHaveAttribute('aria-invalid')
  })

  it('replaces the hint with the error and marks the control invalid', () => {
    render(
      <FormField label="Tipo" error="Seleccione un tipo." hint="Ayuda">
        <Select options={[{ value: 'A', label: 'A' }]} placeholder="Seleccione" />
      </FormField>,
    )

    const select = screen.getByLabelText('Tipo')
    expect(select).toHaveAttribute('aria-invalid', 'true')
    expect(select).toHaveAccessibleDescription('Seleccione un tipo.')
    expect(screen.queryByText('Ayuda')).not.toBeInTheDocument()
  })

  it('marks optional fields', () => {
    render(
      <FormField label="Teléfono" optionalLabel>
        <Input />
      </FormField>,
    )

    expect(screen.getByText('(opcional)')).toBeInTheDocument()
  })
})
