import { FOOTER_COLUMNS } from '../../data/footer.data'
import { FooterBrand } from './FooterBrand'
import { FooterColumn } from './FooterColumn'
import { FooterCopyright } from './FooterCopyright'

/** Pied de page marketing : identité, colonnes de liens et copyright. */
export function Footer() {
  return (
    <footer className="border-t border-[#0d3e57] bg-[#021824] pt-16 pb-10 text-white">
      <div className="mx-auto max-w-[1180px] px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <FooterBrand />
          {FOOTER_COLUMNS.map((column) => (
            <FooterColumn key={column.title} column={column} />
          ))}
        </div>
        <FooterCopyright />
      </div>
    </footer>
  )
}
