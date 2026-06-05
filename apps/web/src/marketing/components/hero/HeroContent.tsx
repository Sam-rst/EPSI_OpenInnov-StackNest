import { motion } from 'framer-motion'

import { HeroBadge } from './HeroBadge'
import { HeroCtas } from './HeroCtas'
import { HeroTrustline } from './HeroTrustline'

interface HeroContentProps {
  onCta: () => void
}

/** Bloc central du hero : badge, titre, accroche, CTAs et trustline. */
export function HeroContent({ onCta }: HeroContentProps) {
  return (
    <div className="relative mx-auto max-w-[1280px] px-8 pt-24 pb-12 text-center">
      <HeroBadge />
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="marketing-text-gradient text-[48px] leading-[0.95] font-extrabold tracking-[-0.035em] sm:text-[72px] md:text-[88px]"
      >
        Build Fast.
        <br />
        Deploy Smart.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.18 }}
        className="mx-auto mt-7 max-w-[640px] text-[18px] leading-[1.55] text-[#c7d4dd]"
      >
        L&apos;Internal Developer Platform qui transforme une idée en infra en moins d&apos;une
        minute. Catalogue, ChatOps IA, Terraform sous le capot.
      </motion.p>
      <HeroCtas onCta={onCta} />
      <HeroTrustline />
    </div>
  )
}
