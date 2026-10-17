import { Clock3 } from 'lucide-react'
import { NavLink } from 'react-router'
import { ROUTES } from '@/core/constants/routes'
import { useSession } from '@/core/auth/useSession'
import { NAVIGATION } from '@/layouts/navigation'
import { cn } from '@/shared/utils/cn'

export function Brand() {
  return (
    <NavLink to={ROUTES.home} className="flex items-center gap-3 rounded-control px-2 py-1.5">
      <span className="flex size-9 items-center justify-center rounded-control bg-brand-600 text-base font-black text-white">
        R
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-extrabold tracking-wide text-white">RIMETRIK</span>
        <span className="block text-xs text-white/60">Gestión de obras</span>
      </span>
    </NavLink>
  )
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useSession()

  const groups = NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(item.requires)),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="flex h-full flex-col bg-navy-900 text-white">
      <div className="px-4 pt-5 pb-4">
        <Brand />
      </div>
      <nav aria-label="Menú principal" className="flex-1 overflow-y-auto px-3 pb-6">
        {groups.map((group) => (
          <div key={group.label} className="mt-4 first:mt-1">
            <p className="px-3 pb-1.5 text-[11px] font-bold tracking-[0.08em] text-white/45 uppercase">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map(({ label, to, icon: Icon, ready }) => (
                <li key={to}>
                  {ready ? (
                    <NavLink
                      to={to}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/8 hover:text-white',
                          isActive && 'bg-navy-800 text-white',
                        )
                      }
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{label}</span>
                    </NavLink>
                  ) : (
                    <span
                      aria-disabled="true"
                      title="Disponible próximamente"
                      className="flex cursor-default items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-white/40"
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{label}</span>
                      <Clock3 className="ml-auto size-3.5 shrink-0" aria-hidden="true" />
                      <span className="sr-only">(disponible próximamente)</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}
