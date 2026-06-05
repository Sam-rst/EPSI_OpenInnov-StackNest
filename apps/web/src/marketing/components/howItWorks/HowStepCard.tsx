import { motion } from 'framer-motion'

import { Icon } from '../../../shared/components/ui'
import type { HowStep } from '../../data/howItWorks.data'

interface HowStepCardProps {
  step: HowStep
  index: number
}

/** Carte d'une étape du parcours « comment ça marche » (icône + numéro). */
export function HowStepCard({ step, index }: HowStepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.55, delay: index * 0.15 }}
      className="text-center"
    >
      <div className="bg-surface-elevated border-border relative mx-auto flex h-[88px] w-[88px] items-center justify-center rounded-2xl border shadow-[0_4px_20px_-8px_rgba(13,146,151,0.25)]">
        <Icon name={step.icon} size={26} className="text-cyan" />
        <span className="bg-night border-surface absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-4 font-mono text-[11px] font-semibold text-white">
          {step.number}
        </span>
      </div>
      <div className="text-text-primary mt-6 text-[18px] font-semibold tracking-tight">
        {step.title}
      </div>
      <p className="text-text-secondary mx-auto mt-2 max-w-[280px] text-[14px] leading-relaxed">
        {step.description}
      </p>
    </motion.div>
  )
}
