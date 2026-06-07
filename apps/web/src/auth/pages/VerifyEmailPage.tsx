import { useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { authApi } from '../services/auth.api'
import { AuthLayout } from '../components/AuthLayout'
import { AuthFormError } from '../components/AuthFormError'
import { AuthSuccessNotice } from '../components/AuthSuccessNotice'

/**
 * Page de vérification d'e-mail. Lit le token du lien (`?token=…`) et le POST
 * automatiquement au montage. Affiche l'état de la vérification (en cours,
 * succès, ou lien invalide/expiré).
 */
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const verify = useMutation({ mutationFn: authApi.verify })
  const hasRun = useRef(false)

  useEffect(() => {
    if (token && !hasRun.current) {
      hasRun.current = true
      verify.mutate(token)
    }
  }, [token, verify])

  return (
    <AuthLayout
      title="Vérification de l'e-mail"
      subtitle="Confirmation de votre adresse e-mail."
      footer={
        <Link to="/login" className="text-cyan font-medium">
          Aller à la connexion
        </Link>
      }
    >
      <VerifyState token={token} status={verify.status} />
    </AuthLayout>
  )
}

interface VerifyStateProps {
  token: string | null
  /** État de la mutation de vérification : idle | pending | success | error. */
  status: 'idle' | 'pending' | 'success' | 'error'
}

function VerifyState({ token, status }: VerifyStateProps) {
  if (!token || status === 'error') {
    return (
      <AuthFormError message="Ce lien de vérification est invalide ou a expiré. Demandez un nouveau lien depuis la page de connexion." />
    )
  }

  if (status === 'success') {
    return (
      <AuthSuccessNotice title="Adresse e-mail vérifiée">
        Votre adresse e-mail a bien été vérifiée. Vous pouvez maintenant vous connecter.
      </AuthSuccessNotice>
    )
  }

  return (
    <p role="status" className="text-text-secondary text-[13px]">
      Vérification en cours…
    </p>
  )
}
