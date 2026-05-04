import { FOOTER_COLUMNS } from './footer.data';
import { FooterBrand } from './FooterBrand';
import { FooterColumn } from './FooterColumn';
import { FooterCopyright } from './FooterCopyright';

export function Footer() {
  return (
    <footer className="text-white pt-16 pb-10 border-t border-[#0d3e57] bg-[#021824]">
      <div className="max-w-[1180px] mx-auto px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <FooterBrand />
          {FOOTER_COLUMNS.map((column) => (
            <FooterColumn key={column.title} column={column} />
          ))}
        </div>
        <FooterCopyright />
      </div>
    </footer>
  );
}
