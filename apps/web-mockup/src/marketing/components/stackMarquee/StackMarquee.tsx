import { motion } from 'framer-motion';
import { STACK_TOP, STACK_BOTTOM } from './stack.data';
import { MarqueeRow } from './MarqueeRow';
import './StackMarquee.css';

export function StackMarquee() {
  return (
    <section id="stack" className="py-24 text-white relative overflow-hidden bg-[#021824]">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 max-w-[1180px] mx-auto px-8"
        >
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-cyan">Stack technique</div>
          <h2 className="mt-3 text-[40px] font-bold tracking-[-0.025em]">Sous le capot, du solide.</h2>
          <p className="mt-3 text-[14.5px] text-[#94aabb] max-w-[520px] mx-auto leading-relaxed">
            20+ briques modernes choisies une par une — rien de propriétaire, rien de bricolé.
          </p>
        </motion.div>

        <div className="stn-mq-pause stn-mq-mask space-y-3 relative">
          <MarqueeRow items={STACK_TOP} direction="left" prefix="t" />
          <MarqueeRow items={STACK_BOTTOM} direction="right" prefix="b" />
        </div>
      </div>
    </section>
  );
}
