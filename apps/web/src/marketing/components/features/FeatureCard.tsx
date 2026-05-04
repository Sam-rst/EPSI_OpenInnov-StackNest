import { motion } from 'framer-motion';
import { FeatureInner } from './FeatureInner';
import type { Feature } from './features.data';

interface FeatureCardProps {
  feature: Feature;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl p-6 bg-surface-elevated border border-border hover:border-cyan hover:shadow-[0_18px_50px_-20px_rgba(13,146,151,0.45)] transition-[border-color,box-shadow] duration-300"
    >
      <div className="text-[19px] font-semibold tracking-tight text-text-primary">{feature.title}</div>
      <p className="text-[14px] mt-1.5 leading-relaxed mb-5 text-text-secondary">{feature.description}</p>
      <div className="mt-2">
        <FeatureInner kind={feature.kind} />
      </div>
    </motion.div>
  );
}
