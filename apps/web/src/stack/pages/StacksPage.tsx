import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { EmptyState } from '../../shared/components/EmptyState'
import { Button } from '../../shared/components/ui'
import { StackBulkBar } from '../components/StackBulkBar'
import { StacksTable } from '../components/StacksTable'
import { useBulkDeleteStacks } from '../hooks/useBulkDeleteStacks'
import { useStackSelection } from '../hooks/useStackSelection'
import { useStacks } from '../hooks/useStacks'

/**
 * Liste des stacks de l'utilisateur (`/stacks`), à l'image des déploiements :
 * table (desktop) / cartes (mobile), lignes cliquables vers le détail, sélection
 * multiple et actions groupées (destruction en masse confirmée).
 */
export function StacksPage() {
  const navigate = useNavigate()
  const { stacks, loading, isError, refetch } = useStacks()
  const ids = useMemo(() => stacks.map((stack) => stack.id), [stacks])
  const selection = useStackSelection(ids)
  const bulkDelete = useBulkDeleteStacks()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleConfirmDestroy = async (): Promise<void> => {
    setConfirmOpen(false)
    await bulkDelete.mutateAsync(selection.selectedIds)
    selection.clear()
  }

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
        <>
          <StackBulkBar
            selectedCount={selection.selectedCount}
            onClearSelection={selection.clear}
            onDestroy={() => setConfirmOpen(true)}
            destroying={bulkDelete.isPending}
          />
          <StacksTable
            stacks={stacks}
            isSelected={selection.isSelected}
            onToggleSelect={selection.toggle}
            allSelected={selection.allSelected}
            onToggleAll={selection.toggleAll}
          />
        </>
      )}

      {confirmOpen && (
        <ConfirmDialog
          title="Détruire les stacks sélectionnées"
          description={`Cette action détruit ${selection.selectedCount} stack${
            selection.selectedCount > 1 ? 's' : ''
          } (conteneurs et volumes). Elle est irréversible.`}
          confirmLabel="Détruire"
          onConfirm={() => void handleConfirmDestroy()}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}
