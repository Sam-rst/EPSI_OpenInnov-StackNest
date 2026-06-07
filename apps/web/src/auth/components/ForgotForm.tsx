import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { authApi } from '../services/auth.api'
import { authErrorMessage } from '../services/authErrorMessage'
import { forgotSchema, type ForgotFormValues } from '../validation/authSchemas'
import { zodResolver } from '../validation/zodResolver'
import { AuthField } from './AuthField'
import { AuthFormError } from './AuthFormError'
import { AuthSubmitButton } from './AuthSubmitButton'
import { AuthSuccessNotice } from './AuthSuccessNotice'

/**
 * Formulaire « mot de passe oublié » : envoie une demande de réinitialisation.
 * La confirmation est générique (anti-énumération) : on ne révèle jamais si
 * l'adresse correspond à un compte existant.
 */
export function ForgotForm() {
  const forgot = useMutation({ mutationFn: authApi.forgot })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({ resolver: zodResolver(forgotSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await forgot.mutateAsync(values)
      setSubmitted(true)
    } catch (error) {
      setFormError(authErrorMessage(error))
    }
  })

  if (submitted) {
    return (
      <AuthSuccessNotice title="Demande envoyée">
        Si un compte est associé à cette adresse, un lien de réinitialisation vient de vous être
        envoyé par e-mail.
      </AuthSuccessNotice>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <AuthFormError message={formError} />
      <AuthField
        id="forgot-email"
        type="email"
        label="Adresse e-mail"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <AuthSubmitButton isPending={forgot.isPending} pendingLabel="Envoi en cours…">
        Envoyer le lien
      </AuthSubmitButton>
    </form>
  )
}
