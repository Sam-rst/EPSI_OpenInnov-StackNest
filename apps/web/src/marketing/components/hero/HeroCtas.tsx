import { motion } from 'framer-motion'

import { Icon } from '../../../shared/components/ui'

interface HeroCtasProps {
  onCta: () => void
}

/** Doublon de boutons d'appel à l'action sous le sous-titre du hero. */
export function HeroCtas({ onCta }: HeroCtasProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.3 }}
      className="mt-9 flex items-center justify-center gap-3"
    >
      <button
        type="button"
        onClick={onCta}
        className="bg-yellow inline-flex h-12 items-center gap-2 rounded-md px-6 text-[14px] font-semibold text-[#3a2a00] shadow-[0_8px_20px_-6px_rgba(254,162,31,0.45)] transition hover:-translate-y-px hover:brightness-105 active:translate-y-0"
      >
        <Icon name="zap" size={15} /> Essayer StackNest
      </button>
      <button
        type="button"
        onClick={onCta}
        className="hover:border-cyan inline-flex h-12 items-center gap-2 rounded-md border border-[#0d3e57] bg-[#073047]/40 px-6 text-[14px] font-medium text-white backdrop-blur transition"
      >
        <Icon name="play" size={13} /> Voir une démo
      </button>
    </motion.div>
  )
}
