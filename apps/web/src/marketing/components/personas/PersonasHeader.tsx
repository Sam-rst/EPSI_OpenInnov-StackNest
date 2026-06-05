import { motion } from 'framer-motion'

/** En-tête de la section Personas (sur-titre + titre + accroche). */
export function PersonasHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
      className="mb-12 text-center"
    >
      <div className="text-cyan font-mono text-[11px] tracking-[0.18em] uppercase">Conçu pour</div>
      <h2 className="text-text-primary mt-3 text-[32px] leading-[1.05] font-bold tracking-[-0.025em] md:text-[44px]">
        Pensé pour ceux qui codent.
      </h2>
      <p className="text-text-secondary mx-auto mt-4 max-w-[540px] text-[15.5px] leading-relaxed">
        Trois métiers, trois usages — la même promesse&nbsp;: provisionner sans réfléchir.
      </p>
    </motion.div>
  )
}
