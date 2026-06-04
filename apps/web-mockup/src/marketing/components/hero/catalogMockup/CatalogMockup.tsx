import { MockupChrome } from './MockupChrome';
import { MockupSidebar } from './MockupSidebar';
import { MockupBody } from './MockupBody';

const SHADOW =
  'shadow-[0_60px_120px_-30px_rgba(0,0,0,0.6),0_0_0_1px_rgba(13,146,151,0.18)_inset]';

/** Capture stylisée du Catalogue affichée en perspective dans le hero. */
export function CatalogMockup() {
  return (
    <div
      className={`rounded-xl overflow-hidden border border-[#0d3e57] bg-[#073047] ${SHADOW} text-[#fffefa]`}
      style={{ width: 1080 }}
    >
      <MockupChrome />
      <div className="grid" style={{ gridTemplateColumns: '220px 1fr' }}>
        <MockupSidebar />
        <MockupBody />
      </div>
    </div>
  );
}
