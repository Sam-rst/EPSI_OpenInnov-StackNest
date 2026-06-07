import { Link, useSearchParams } from 'react-router-dom'

import { AuthLayout } from '../components/AuthLayout'
import { ResetForm } from '../components/ResetForm'

/** Page de réinitialisation : lit le token du lien e-mail (`?token=…`) et le passe au formulaire. */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  return (
    <AuthLayout
      title="Réinitialiser le mot de passe"
      subtitle="Choisissez un nouveau mot de passe pour votre compte."
      footer={
        <Link to="/login" className="text-cyan font-medium">
          Retour à la connexion
        </Link>
      }
    >
      <ResetForm token={token} />
    </AuthLayout>
  )
}
