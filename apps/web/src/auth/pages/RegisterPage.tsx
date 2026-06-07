import { Link } from 'react-router-dom'

import { AuthLayout } from '../components/AuthLayout'
import { RegisterForm } from '../components/RegisterForm'

/** Page d'inscription : formulaire de création de compte + lien vers la connexion. */
export function RegisterPage() {
  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="Quelques secondes suffisent pour démarrer."
      footer={
        <>
          Vous avez déjà un compte&nbsp;?{' '}
          <Link to="/login" className="text-cyan font-medium">
            Se connecter
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  )
}
