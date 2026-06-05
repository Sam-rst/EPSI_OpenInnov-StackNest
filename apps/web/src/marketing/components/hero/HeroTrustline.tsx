import { motion } from 'framer-motion'

import { Icon } from '../../../shared/components/ui'

/**
 * Trustline honnête (CA5) : engagements réels du produit, aucune métrique
 * sociale chiffrée ni logo client inventé.
 */
const ITEMS = ['Aucune carte de crédit', 'Self-host & cloud', 'Open infrastructure']

export function HeroTrustline() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.55 }}
      className="mt-6 flex items-center justify-center gap-4 font-mono text-[12px] text-[#94aabb]"
    >
      {ITEMS.map((label, index) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          {index > 0 && <span className="mr-1 opacity-40">·</span>}
          <Icon name="check" size={11} /> {label}
        </span>
      ))}
    </motion.div>
  )
}
