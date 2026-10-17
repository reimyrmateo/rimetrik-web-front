import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { AppProviders } from '@/app/providers/AppProviders'
import { router } from '@/app/router/router'
import '@/styles/index.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('No se encontró el contenedor #root.')
}

createRoot(container).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
