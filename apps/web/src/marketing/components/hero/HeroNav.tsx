import { LogoMark } from '../../../shared/components/Logo'

interface HeroNavProps {
  onCta: () => void
}

const ANCHORS = [
  { href: '#features', label: 'Produit' },
  { href: '#how', label: 'Comment ça marche' },
  { href: '#stack', label: 'Stack' },
]

/** Barre de navigation marketing du hero (logo + ancres + connexion). */
export function HeroNav({ onCta }: HeroNavProps) {
  return (
    <div className="relative mx-auto flex max-w-[1280px] items-center justify-between px-8 pt-6">
      <a href="#" className="flex items-center gap-2.5">
        <LogoMark size={28} alt="StackNest" />
        <span className="text-[17px] font-bold tracking-tight">StackNest</span>
      </a>
      <nav className="hidden items-center gap-7 text-[13.5px] text-[#c7d4dd] md:flex">
        {ANCHORS.map((anchor) => (
          <a key={anchor.href} href={anchor.href} className="hover:text-white">
            {anchor.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCta}
          className="h-9 px-3 text-[13px] text-[#c7d4dd] transition-colors hover:text-white"
        >
          Se connecter
        </button>
        <button
          type="button"
          onClick={onCta}
          className="bg-yellow h-9 rounded-md px-4 text-[13px] font-semibold text-[#3a2a00] transition hover:brightness-105"
        >
          Essayer StackNest
        </button>
      </div>
    </div>
  )
}
