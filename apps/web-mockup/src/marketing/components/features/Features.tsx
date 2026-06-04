import { motion } from 'framer-motion';
import { FEATURES } from './features.data';
import { FeatureCard } from './FeatureCard';

export function Features() {
  return (
    <section id="features" className="py-28 bg-surface-sunken">
      <div className="max-w-[1180px] mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-cyan">Features clés</div>
          <h2 className="mt-3 text-[44px] font-bold tracking-[-0.02em] text-text-primary">
            Tout ce qu'il faut, rien de plus
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-5">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
            >
              <FeatureCard feature={feature} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
