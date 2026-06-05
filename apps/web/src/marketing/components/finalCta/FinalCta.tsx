import { motion } from 'framer-motion'

import { Icon } from '../../../shared/components/ui'

interface FinalCtaProps {
  onCta: () => void
}

const BG = {
  background: 'linear-gradient(135deg, var(--color-cyan) 0%, #017B86 100%)',
} as const

/** Bandeau d'appel à l'action final, dégradé cyan, avant le footer. */
export function FinalCta({ onCta }: FinalCtaProps) {
  return (
    <section className="py-24" style={BG}>
      <div className="mx-auto max-w-[820px] px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.55 }}
          className="text-[36px] leading-[1.05] font-bold tracking-[-0.025em] text-white md:text-[56px]"
        >
          Démarre ton premier déploiement aujourd&apos;hui.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-5 max-w-[520px] text-[17px] leading-relaxed text-white/85"
        >
          Aucune carte de crédit requise pour la démo. Self-host ou managé, tu choisis.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mt-9"
        >
          <button
            type="button"
            onClick={onCta}
            className="bg-yellow inline-flex h-14 items-center gap-2 rounded-md px-8 text-[15px] font-semibold text-[#3a2a00] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] transition hover:-translate-y-0.5 hover:brightness-105"
          >
            <Icon name="zap" size={16} /> Démarrer maintenant
          </button>
        </motion.div>
      </div>
    </section>
  )
}
