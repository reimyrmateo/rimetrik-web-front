import { Outlet } from 'react-router'

export function AuthLayout() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-control bg-brand-600 text-lg font-black">
            R
          </span>
          <span className="text-lg font-extrabold tracking-wide">RIMETRIK</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl leading-tight font-bold">
            Controle presupuestos, gastos y pagos de cada obra.
          </h2>
          <p className="mt-4 text-base text-white/70">
            Toda la información financiera de sus proyectos en un solo lugar, con permisos por rol.
          </p>
        </div>
        <p className="text-xs text-white/45">© {new Date().getFullYear()} RIMETRIK</p>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full border-[48px] border-white/5"
        />
      </section>
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
