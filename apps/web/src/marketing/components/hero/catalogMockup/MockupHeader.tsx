import { Icon } from '@core/ui';

export function MockupHeader() {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <div className="text-[18px] font-bold tracking-tight">Catalogue</div>
        <div className="text-[12px] text-[#94aabb]">12 ressources prêtes à déployer</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 h-9 rounded-md bg-[#021824] border border-[#0d3e57] text-[12px] text-[#94aabb] w-64">
          <Icon name="search" size={13} />
          <span>Rechercher une ressource…</span>
        </div>
        <div className="h-9 px-3 rounded-md bg-sun text-[#3a2a00] text-[12.5px] font-semibold flex items-center gap-2">
          <Icon name="plus" size={13} /> Nouveau
        </div>
      </div>
    </div>
  );
}
