import { Link } from 'react-router-dom'

import { AuthLayout } from '../components/AuthLayout'
import { ForgotForm } from '../components/ForgotForm'

/** Page « mot de passe oublié » : demande d'un lien de réinitialisation par e-mail. */
export function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation."
      footer={
        <Link to="/login" className="text-cyan font-medium">
          Retour à la connexion
        </Link>
      }
    >
      <ForgotForm />
    </AuthLayout>
  )
}
