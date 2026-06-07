import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { useRegister } from '../hooks/useRegister'
import { authErrorMessage } from '../services/authErrorMessage'
import { registerSchema, type RegisterFormValues } from '../validation/authSchemas'
import { zodResolver } from '../validation/zodResolver'
import { AuthField } from './AuthField'
import { AuthFormError } from './AuthFormError'
import { AuthSubmitButton } from './AuthSubmitButton'
import { AuthSuccessNotice } from './AuthSuccessNotice'

/**
 * Formulaire d'inscription : validation zod (politique de mot de passe), soumission
 * via `useRegister`. Affiche une confirmation générique (anti-énumération) : on ne
 * révèle jamais si l'adresse était déjà connue.
 */
export function RegisterForm() {
  const registerMutation = useRegister()
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await registerMutation.mutateAsync(values)
      setSubmitted(true)
    } catch (error) {
      setFormError(authErrorMessage(error))
    }
  })

  if (submitted) {
    return (
      <AuthSuccessNotice title="Vérifiez votre boîte mail">
        Si la création a abouti, vous allez recevoir un e-mail pour vérifier votre adresse e-mail et
        activer votre compte.
      </AuthSuccessNotice>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <AuthFormError message={formError} />
      <AuthField
        id="register-email"
        type="email"
        label="Adresse e-mail"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <AuthField
        id="register-password"
        type="password"
        label="Mot de passe"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <p className="text-text-secondary text-[12px]">
        Au moins 8 caractères, dont au moins un chiffre.
      </p>
      <AuthSubmitButton isPending={registerMutation.isPending} pendingLabel="Création en cours…">
        Créer mon compte
      </AuthSubmitButton>
    </form>
  )
}
