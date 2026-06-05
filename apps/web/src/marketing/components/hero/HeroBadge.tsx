import { motion } from 'framer-motion'

/** Pastille « disponible » animée en tête du hero. */
export function HeroBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-6 inline-flex h-7 items-center gap-2 rounded-full border border-[#0d3e57] bg-[#021824] px-3 text-[11.5px] font-medium text-[#c7d4dd]">
        <span className="bg-yellow h-1.5 w-1.5 animate-pulse rounded-full" />
        <span>Plateforme self-service · v1.0 disponible</span>
      </div>
    </motion.div>
  )
}
