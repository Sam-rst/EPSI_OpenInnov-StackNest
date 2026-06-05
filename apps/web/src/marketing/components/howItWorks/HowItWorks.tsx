import { motion } from 'framer-motion'

import { HOW_STEPS } from '../../data/howItWorks.data'
import { HowStepCard } from './HowStepCard'

/** Section « comment ça marche » : 3 étapes reliées par un trait animé. */
export function HowItWorks() {
  return (
    <section id="how" className="py-28">
      <div className="mx-auto max-w-[1180px] px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <div className="text-cyan font-mono text-[11px] tracking-[0.18em] uppercase">
            Comment ça marche
          </div>
          <h2 className="text-text-primary mt-3 text-[32px] font-bold tracking-[-0.02em] md:text-[44px]">
            De l&apos;idée à l&apos;infra en 3 étapes
          </h2>
        </motion.div>
        <div className="relative">
          <svg
            className="absolute top-[44px] right-0 left-0 hidden h-2 w-full md:block"
            preserveAspectRatio="none"
            viewBox="0 0 1000 8"
            aria-hidden="true"
          >
            <motion.path
              d="M 80 4 L 920 4"
              stroke="var(--color-cyan)"
              strokeWidth="1.5"
              strokeDasharray="2 6"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            />
          </svg>
          <div className="relative grid gap-8 md:grid-cols-3">
            {HOW_STEPS.map((step, index) => (
              <HowStepCard key={step.number} step={step} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
