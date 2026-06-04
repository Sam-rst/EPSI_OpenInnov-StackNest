import { motion } from 'framer-motion';
import { HOW_STEPS } from './steps.data';
import { HowStepCard } from './HowStepCard';

export function HowItWorks() {
  return (
    <section id="how" className="py-28">
      <div className="max-w-[1180px] mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-cyan">Comment ça marche</div>
          <h2 className="mt-3 text-[44px] font-bold tracking-[-0.02em] text-text-primary">
            De l'idée à l'infra en 3 étapes
          </h2>
        </motion.div>
        <div className="relative">
          <svg
            className="hidden md:block absolute left-0 right-0 top-[44px] w-full h-2"
            preserveAspectRatio="none"
            viewBox="0 0 1000 8"
          >
            <motion.path
              d="M 80 4 L 920 4"
              stroke="var(--brand-cyan)"
              strokeWidth="1.5"
              strokeDasharray="2 6"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            />
          </svg>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {HOW_STEPS.map((step, i) => (
              <HowStepCard key={step.number} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
