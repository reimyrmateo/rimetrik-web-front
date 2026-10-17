import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLogin } from '@/core/auth/useSession'
import { applyServerErrors } from '@/core/errors/applyServerErrors'
import { isApiError } from '@/core/errors/ApiError'
import { loginSchema, type LoginValues } from '@/features/auth/loginSchema'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { FormField } from '@/shared/components/FormField'
import { Input } from '@/shared/components/Input'

const FIELDS = ['email', 'password'] as const

function serverMessage(error: unknown, fallback: string | null): string | null {
  if (isApiError(error) && error.kind === 'rate_limited' && error.retryAfterSeconds !== null) {
    const minutes = Math.max(1, Math.ceil(error.retryAfterSeconds / 60))
    return `${error.message} Intente de nuevo en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`
  }

  return fallback
}

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const login = useLogin()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)

    try {
      await login.mutateAsync({ email: values.email, password: values.password })
      onSuccess()
    } catch (error) {
      setFormError(serverMessage(error, applyServerErrors(error, setError, FIELDS)))
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4" aria-label="Iniciar sesión">
      {formError && <Alert tone="danger">{formError}</Alert>}
      <FormField label="Correo electrónico" required error={errors.email?.message}>
        <Input
          type="email"
          autoComplete="username"
          autoFocus
          maxLength={256}
          placeholder="nombre@empresa.com"
          {...register('email')}
        />
      </FormField>
      <FormField label="Contraseña" required error={errors.password?.message}>
        <Input
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          maxLength={128}
          {...register('password')}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
              className="rounded-control p-1.5 text-ink-subtle hover:bg-canvas hover:text-ink"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          }
        />
      </FormField>
      <Button
        type="submit"
        fullWidth
        loading={login.isPending}
        icon={<LogIn className="size-4" aria-hidden="true" />}
        className="mt-2"
      >
        Iniciar sesión
      </Button>
    </form>
  )
}
