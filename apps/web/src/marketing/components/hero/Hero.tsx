import { HeroNav } from './HeroNav';
import { HeroContent } from './HeroContent';
import { HeroMockup } from './HeroMockup';

interface HeroProps {
  onCta: () => void;
}

const HERO_BG = {
  background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #0d3e57 0%, #032233 55%, #021824 100%)',
} as const;

export function Hero({ onCta }: HeroProps) {
  return (
    <section className="relative overflow-hidden text-white" style={HERO_BG}>
      <div className="absolute inset-0 grid-bg grid-bg-fade" />
      <div className="absolute inset-0 stars opacity-90" />
      <HeroNav onCta={onCta} />
      <HeroContent onCta={onCta} />
      <HeroMockup />
    </section>
  );
}
