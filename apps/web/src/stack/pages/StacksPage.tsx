import { useNavigate } from 'react-router-dom'

import { EmptyState } from '../../shared/components/EmptyState'
import { Button } from '../../shared/components/ui'
import { StackCard } from '../components/StackCard'
import { useStacks } from '../hooks/useStacks'

/**
 * Liste des stacks de l'utilisateur (`/stacks`). Affiche un chargement, une
 * erreur avec réessai, un état vide honnête, ou la grille de cartes cliquables.
 */
export function StacksPage() {
  const navigate = useNavigate()
  const { stacks, loading, isError, refetch } = useStacks()

  return (
    <div className="mx-auto max-w-[1280px] p-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-text-primary text-[22px] font-bold">Stacks</h1>
          <p className="text-text-muted mt-1 text-[13.5px]">
            Tes projets multi-services déployés comme Docker Compose.
          </p>
        </div>
        <Button variant="cyan" icon="plus" onClick={() => navigate('/stacks/new')}>
          Composer une stack
        </Button>
      </header>

      {loading && <p className="text-text-muted text-[13.5px]">Chargement des stacks…</p>}

      {!loading && isError && (
        <div className="border-border rounded-lg border border-dashed p-8 text-center">
          <p className="text-text-secondary text-[13.5px]">Impossible de charger les stacks.</p>
          <Button variant="secondary" className="mt-4" onClick={refetch}>
            Réessayer
          </Button>
        </div>
      )}

      {!loading && !isError && stacks.length === 0 && (
        <EmptyState
          icon="layers"
          title="Aucune stack"
          description="Compose ta première stack multi-services depuis le catalogue."
          actionLabel="Composer une stack"
          onAction={() => navigate('/stacks/new')}
        />
      )}

      {!loading && !isError && stacks.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stacks.map((stack) => (
            <StackCard key={stack.id} stack={stack} />
          ))}
        </div>
      )}
    </div>
  )
}
