import type {
  ExpenseCategory,
  ExpenseCategoryPayload,
  MeasurementUnit,
  MeasurementUnitPayload,
} from '@/features/settings/settingsTypes'
import { createCatalogApi } from '@/shared/hooks/useCatalogList'

export const UNITS_KEY = 'measurement-units'
export const CATEGORIES_KEY = 'expense-categories'

export const unitsApi = createCatalogApi<MeasurementUnit, MeasurementUnitPayload>('/measurement-units')

export const categoriesApi = createCatalogApi<ExpenseCategory, ExpenseCategoryPayload>('/expense-categories')
