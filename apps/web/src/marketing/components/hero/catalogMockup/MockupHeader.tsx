import { Icon } from '../../../../shared/components/ui'

/** En-tête du corps du mockup catalogue (titre + recherche + bouton). */
export function MockupHeader() {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div>
        <div className="text-[18px] font-bold tracking-tight">Catalogue</div>
        <div className="text-[12px] text-[#94aabb]">Des ressources prêtes à déployer</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-64 items-center gap-2 rounded-md border border-[#0d3e57] bg-[#021824] px-3 text-[12px] text-[#94aabb]">
          <Icon name="search" size={13} />
          <span>Rechercher une ressource…</span>
        </div>
        <div className="bg-yellow flex h-9 items-center gap-2 rounded-md px-3 text-[12.5px] font-semibold text-[#3a2a00]">
          <Icon name="plus" size={13} /> Nouveau
        </div>
      </div>
    </div>
  )
}
