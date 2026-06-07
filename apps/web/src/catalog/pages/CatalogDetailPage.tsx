import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '../../shared/components/EmptyState'
import { Icon } from '../../shared/components/ui'
import { TemplateDetailHeader } from '../components/detail/TemplateDetailHeader'
import { TemplateParamsTable } from '../components/detail/TemplateParamsTable'
import { TemplateVersionsTable } from '../components/detail/TemplateVersionsTable'
import { useTemplateDetail } from '../hooks/useTemplateDetail'

function BackLink() {
  return (
    <Link
      to="/catalog"
      className="text-text-muted hover:text-cyan mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium transition"
    >
      <Icon name="arrow-left" size={14} />
      Retour au catalogue
    </Link>
  )
}

export function CatalogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { detail, loading, isError } = useTemplateDetail(id)

  return (
    <div className="p-8">
      <BackLink />

      {loading && (
        <p className="text-text-muted text-[13.5px]">Chargement de la fiche du template…</p>
      )}

      {!loading && (isError || !detail) && (
        <EmptyState
          icon="package-x"
          title="Template introuvable"
          description="Ce template n'existe pas ou n'est plus disponible dans le catalogue."
        />
      )}

      {!loading && !isError && detail && (
        <div className="space-y-8">
          <TemplateDetailHeader detail={detail} />
          <TemplateVersionsTable versions={detail.versions} />
          <TemplateParamsTable params={detail.params} />
        </div>
      )}
    </div>
  )
}
