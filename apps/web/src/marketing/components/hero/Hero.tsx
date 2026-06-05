import { HeroContent } from './HeroContent'
import { HeroMockup } from './HeroMockup'
import { HeroNav } from './HeroNav'

interface HeroProps {
  onCta: () => void
}

const HERO_BG = {
  background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #0d3e57 0%, #032233 55%, #021824 100%)',
} as const

/** Section d'accroche de la landing : nav, titre, CTAs et visuel produit. */
export function Hero({ onCta }: HeroProps) {
  return (
    <section className="relative overflow-hidden text-white" style={HERO_BG}>
      <div className="marketing-grid marketing-grid-fade absolute inset-0" />
      <div className="marketing-stars absolute inset-0 opacity-90" />
      <HeroNav onCta={onCta} />
      <HeroContent onCta={onCta} />
      <HeroMockup />
    </section>
  )
}
