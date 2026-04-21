import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-gray-600">La page demandée n'existe pas.</p>
      <Link to="/dashboard" className="text-blue-600 underline hover:text-blue-800">
        Retour au dashboard
      </Link>
    </main>
  )
}
