import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { authApi } from '../services/auth.api'
import { authErrorMessage } from '../services/authErrorMessage'
import { resetSchema, type ResetFormValues } from '../validation/authSchemas'
import { zodResolver } from '../validation/zodResolver'
import { AuthField } from './AuthField'
import { AuthFormError } from './AuthFormError'
import { AuthSubmitButton } from './AuthSubmitButton'
import { AuthSuccessNotice } from './AuthSuccessNotice'

interface ResetFormProps {
  /** Token de réinitialisation extrait de l'URL (`?token=…`), ou null si absent. */
  token: string | null
}

/**
 * Formulaire de définition d'un nouveau mot de passe. Le token vient du lien
 * e-mail (query string) ; absent, on affiche une erreur sans champ. Au succès,
 * une confirmation invite à se reconnecter.
 */
export function ResetForm({ token }: ResetFormProps) {
  const reset = useMutation({ mutationFn: authApi.reset })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({ resolver: zodResolver(resetSchema) })

  if (!token) {
    return (
      <AuthFormError message="Ce lien de réinitialisation est invalide ou a expiré. Veuillez en demander un nouveau." />
    )
  }

  if (submitted) {
    return (
      <AuthSuccessNotice title="Mot de passe réinitialisé">
        Votre mot de passe a été réinitialisé avec succès.{' '}
        <Link to="/login" className="text-cyan font-medium">
          Se connecter
        </Link>
      </AuthSuccessNotice>
    )
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await reset.mutateAsync({ token, password: values.password })
      setSubmitted(true)
    } catch (error) {
      setFormError(authErrorMessage(error))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <AuthFormError message={formError} />
      <AuthField
        id="reset-password"
        type="password"
        label="Nouveau mot de passe"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <p className="text-text-secondary text-[12px]">
        Au moins 8 caractères, dont au moins un chiffre.
      </p>
      <AuthSubmitButton isPending={reset.isPending} pendingLabel="Réinitialisation en cours…">
        Réinitialiser le mot de passe
      </AuthSubmitButton>
    </form>
  )
}
