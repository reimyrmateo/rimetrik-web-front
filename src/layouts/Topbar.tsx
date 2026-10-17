import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, LogOut, Menu, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router'
import { ROUTES } from '@/core/constants/routes'
import { useLogout, useSession } from '@/core/auth/useSession'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

const itemClass =
  'flex cursor-pointer items-center gap-2.5 rounded-control px-3 py-2 text-sm text-ink outline-none data-[highlighted]:bg-canvas'

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user } = useSession()
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menú"
        className="rounded-control p-2 text-ink-muted hover:bg-canvas hover:text-ink lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>
      <span className="text-[15px] font-extrabold tracking-wide text-ink lg:hidden">RIMETRIK</span>
      <div className="flex-1" />
      {user && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="flex items-center gap-2.5 rounded-control py-1.5 pr-2 pl-1.5 text-left hover:bg-canvas">
            <span className="flex size-8 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
              {initials(user.full_name)}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-semibold text-ink">{user.full_name}</span>
              <span className="block text-xs text-ink-muted">{user.roles.join(' · ') || 'Sin rol'}</span>
            </span>
            <ChevronDown className="size-4 text-ink-subtle" aria-hidden="true" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className="z-50 min-w-56 rounded-card border border-line bg-surface p-1.5 shadow-overlay"
            >
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-ink">{user.full_name}</p>
                <p className="truncate text-xs text-ink-muted">{user.email}</p>
              </div>
              <DropdownMenu.Separator className="my-1 h-px bg-line" />
              <DropdownMenu.Item className={itemClass} onSelect={() => void navigate(ROUTES.account)}>
                <UserRound className="size-4 text-ink-subtle" aria-hidden="true" />
                Mi cuenta
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className={itemClass}
                disabled={logout.isPending}
                onSelect={() => logout.mutate()}
              >
                <LogOut className="size-4 text-ink-subtle" aria-hidden="true" />
                Cerrar sesión
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </header>
  )
}
