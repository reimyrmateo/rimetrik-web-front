# RIMETRIK · Front

Interfaz web de RIMETRIK (gestión de obras) con React, TypeScript, Vite y Tailwind CSS.

## Requisitos

- Node.js 22.12 o superior
- pnpm 10 (`corepack enable` lo activa con la versión de `packageManager`)
- La API de RIMETRIK corriendo con el perfil `https` (`https://localhost:7209`)

## Puesta en marcha

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

La aplicación abre en `http://localhost:5173`. En desarrollo, Vite reenvía `/api` a la API
(`RIMETRIK_API_PROXY_TARGET`), así el front y la API comparten origen y la cookie de sesión funciona sin CORS.
En producción, un proxy inverso debe servir el front y `/api` bajo el mismo dominio.

## Scripts

| Comando          | Uso                                         |
| ---------------- | ------------------------------------------- |
| `pnpm dev`       | Servidor de desarrollo                      |
| `pnpm build`     | Verificación de tipos y build de producción |
| `pnpm preview`   | Sirve el build localmente                   |
| `pnpm lint`      | ESLint                                      |
| `pnpm typecheck` | TypeScript sin emitir archivos              |
| `pnpm test`      | Pruebas con Vitest                          |
| `pnpm format`    | Formatea con Prettier                       |

## Estructura

- `src/app`: proveedores, rutas y estado global.
- `src/core`: cliente de la API, sesión, configuración, constantes, errores y permisos.
- `src/features`: un módulo por área del negocio.
- `src/shared`: componentes, hooks, utilidades, tipos y validaciones reutilizables.
- `src/layouts`: estructura de las pantallas (menú lateral, barra superior y acceso).
- `src/test`: configuración y ayudas para las pruebas.

## Seguridad

- El refresh token solo vive en la cookie `HttpOnly` que emite la API; el front nunca lo lee ni lo guarda.
- El access token se mantiene en memoria dentro de `core/api` y no se persiste ni se expone en el estado global.
- Los permisos solo deciden qué se muestra; la autorización real la aplica la API en cada endpoint.
- Los importes, saldos y estados financieros siempre vienen de la API; el front no los recalcula como fuente de verdad.
- El build de producción no genera mapas de código fuente.
