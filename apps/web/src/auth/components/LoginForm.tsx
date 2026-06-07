import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { useLogin } from '../hooks/useLogin'
import { authErrorMessage } from '../services/authErrorMessage'
import { loginSchema, type LoginFormValues } from '../validation/authSchemas'
import { zodResolver } from '../validation/zodResolver'
import { AuthField } from './AuthField'
import { AuthFormError } from './AuthFormError'
import { AuthSubmitButton } from './AuthSubmitButton'

/** Formulaire de connexion : validation zod, soumission via `useLogin`, redirection au succès. */
export function LoginForm() {
  const navigate = useNavigate()
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login.mutateAsync(values)
      navigate('/dashboard')
    } catch (error) {
      setFormError(authErrorMessage(error))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <AuthFormError message={formError} />
      <AuthField
        id="login-email"
        type="email"
        label="Adresse e-mail"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <AuthField
        id="login-password"
        type="password"
        label="Mot de passe"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <div className="flex justify-end">
        <Link to="/forgot" className="text-cyan text-[12px] font-medium">
          Mot de passe oublié&nbsp;?
        </Link>
      </div>
      <AuthSubmitButton isPending={login.isPending} pendingLabel="Connexion en cours…">
        Se connecter
      </AuthSubmitButton>
    </form>
  )
}
