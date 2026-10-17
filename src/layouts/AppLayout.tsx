import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { Outlet } from 'react-router'
import { Sidebar } from '@/layouts/Sidebar'
import { Topbar } from '@/layouts/Topbar'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16.5rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh lg:block">
        <Sidebar />
      </aside>
      <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-navy-950/45 lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-overlay focus:outline-none lg:hidden">
            <Dialog.Title className="sr-only">Menú principal</Dialog.Title>
            <Dialog.Description className="sr-only">
              Secciones disponibles según sus permisos
            </Dialog.Description>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="flex min-w-0 flex-col">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main id="contenido" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
