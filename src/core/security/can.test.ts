import { describe, expect, it } from 'vitest'
import { PERMISSIONS } from '@/core/constants/permissions'
import { can } from '@/core/security/can'
import { testUser } from '@/test/helpers/renderWithProviders'

const user = { ...testUser, permissions: [PERMISSIONS.costs.view] }

describe('can', () => {
  it('requires a session', () => {
    expect(can(null, PERMISSIONS.costs.view)).toBe(false)
    expect(can(null, undefined)).toBe(false)
    expect(can(user, undefined)).toBe(true)
  })

  it('accepts any of the listed permissions', () => {
    expect(can(user, PERMISSIONS.costs.view)).toBe(true)
    expect(can(user, [PERMISSIONS.costs.managePayments, PERMISSIONS.costs.view])).toBe(true)
    expect(can(user, PERMISSIONS.budgets.approve)).toBe(false)
  })
})
