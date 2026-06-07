import { Link } from 'react-router-dom'

import { AuthLayout } from '../components/AuthLayout'
import { LoginForm } from '../components/LoginForm'

/** Page de connexion : formulaire de login + lien vers la création de compte. */
export function LoginPage() {
  return (
    <AuthLayout
      title="Connexion"
      subtitle="Bon retour. Reprenez là où vous vous étiez arrêté."
      footer={
        <>
          Pas encore de compte&nbsp;?{' '}
          <Link to="/register" className="text-cyan font-medium">
            Créer un compte
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}
