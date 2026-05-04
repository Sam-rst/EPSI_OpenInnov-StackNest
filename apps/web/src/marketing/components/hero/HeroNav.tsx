import { LogoMark } from '@core/ui';

interface HeroNavProps {
  onCta: () => void;
}

const ANCHORS = [
  { href: '#features', label: 'Produit' },
  { href: '#how', label: 'Comment ça marche' },
  { href: '#stack', label: 'Stack' },
];

export function HeroNav({ onCta }: HeroNavProps) {
  return (
    <div className="relative max-w-[1280px] mx-auto px-8 pt-6 flex items-center justify-between">
      <a href="#" className="flex items-center gap-2.5">
        <LogoMark size={28} />
        <span className="font-bold tracking-tight text-[17px]">StackNest</span>
      </a>
      <nav className="hidden md:flex items-center gap-7 text-[13.5px] text-[#c7d4dd]">
        {ANCHORS.map((a) => (
          <a key={a.href} href={a.href} className="hover:text-white">
            {a.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <button onClick={onCta} className="h-9 px-3 text-[13px] text-[#c7d4dd] hover:text-white transition-colors">
          Se connecter
        </button>
        <button onClick={onCta} className="h-9 px-4 rounded-md bg-sun text-[#3a2a00] text-[13px] font-semibold hover:brightness-105 transition">
          Essayer StackNest
        </button>
      </div>
    </div>
  );
}
