import { motion } from 'framer-motion'

import { FEATURES } from '../../data/features.data'
import { FeatureCard } from './FeatureCard'

/** Section des features clés (#features) avec démos internes animées. */
export function Features() {
  return (
    <section id="features" className="bg-surface-sunken py-28">
      <div className="mx-auto max-w-[1180px] px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <div className="text-cyan font-mono text-[11px] tracking-[0.18em] uppercase">
            Features clés
          </div>
          <h2 className="text-text-primary mt-3 text-[32px] font-bold tracking-[-0.02em] md:text-[44px]">
            Tout ce qu&apos;il faut, rien de plus
          </h2>
        </motion.div>
        <div className="grid gap-5 md:grid-cols-2">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
            >
              <FeatureCard feature={feature} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
