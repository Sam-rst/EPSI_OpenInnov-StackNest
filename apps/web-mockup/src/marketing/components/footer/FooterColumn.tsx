import type { FooterColumn as FooterColumnType } from './footer.data';

interface FooterColumnProps {
  column: FooterColumnType;
}

export function FooterColumn({ column }: FooterColumnProps) {
  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#94aabb] mb-4">
        {column.title}
      </div>
      <ul className="space-y-2.5">
        {column.links.map((label) => (
          <li key={label}>
            <a href="#" className="text-[13.5px] text-[#c7d4dd] hover:text-white transition-colors">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
