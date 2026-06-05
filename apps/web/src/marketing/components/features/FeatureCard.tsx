import { motion } from 'framer-motion'

import type { Feature } from '../../data/features.data'
import { FeatureInner } from './FeatureInner'

interface FeatureCardProps {
  feature: Feature
}

/** Carte d'une feature : titre, description et démo interne au survol. */
export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-surface-elevated border-border hover:border-cyan rounded-xl border p-6 transition-[border-color,box-shadow] duration-300 hover:shadow-[0_18px_50px_-20px_rgba(13,146,151,0.45)]"
    >
      <div className="text-text-primary text-[19px] font-semibold tracking-tight">
        {feature.title}
      </div>
      <p className="text-text-secondary mt-1.5 mb-5 text-[14px] leading-relaxed">
        {feature.description}
      </p>
      <div className="mt-2">
        <FeatureInner kind={feature.kind} />
      </div>
    </motion.div>
  )
}
