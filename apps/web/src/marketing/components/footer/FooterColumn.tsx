import type { FooterColumn as FooterColumnType } from '../../data/footer.data'

interface FooterColumnProps {
  column: FooterColumnType
}

/** Colonne de liens du footer (titre mono + liste de libellés). */
export function FooterColumn({ column }: FooterColumnProps) {
  return (
    <div>
      <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[#94aabb]">
        {column.title}
      </div>
      <ul className="space-y-2.5">
        {column.links.map((label) => (
          <li key={label}>
            <a href="#" className="text-[13.5px] text-[#c7d4dd] transition-colors hover:text-white">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
