import { motion } from 'framer-motion'

import { STACK_BOTTOM, STACK_TOP } from '../../data/stack.data'
import { MarqueeRow } from './MarqueeRow'

/** Section #stack : double marquee des briques techniques sur fond bleu nuit. */
export function StackMarquee() {
  return (
    <section id="stack" className="relative overflow-hidden bg-[#021824] py-24 text-white">
      <div className="marketing-grid absolute inset-0 opacity-50" />
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-[1180px] px-8 text-center"
        >
          <div className="text-cyan font-mono text-[11px] tracking-[0.18em] uppercase">
            Stack technique
          </div>
          <h2 className="mt-3 text-[32px] font-bold tracking-[-0.025em] md:text-[40px]">
            Sous le capot, du solide.
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[14.5px] leading-relaxed text-[#94aabb]">
            20+ briques modernes choisies une par une — rien de propriétaire, rien de bricolé.
          </p>
        </motion.div>

        <div className="marketing-marquee-pause marketing-marquee-mask relative space-y-3">
          <MarqueeRow items={STACK_TOP} direction="left" prefix="t" />
          <MarqueeRow items={STACK_BOTTOM} direction="right" prefix="b" />
        </div>
      </div>
    </section>
  )
}
