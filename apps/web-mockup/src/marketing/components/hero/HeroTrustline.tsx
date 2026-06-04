import { motion } from 'framer-motion';
import { Icon } from '@core/ui';

const ITEMS = ['Aucune carte de crédit', 'Self-host & cloud', 'Open infrastructure'];

export function HeroTrustline() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.55 }}
      className="mt-6 text-[12px] font-mono text-[#94aabb] flex items-center justify-center gap-4"
    >
      {ITEMS.map((label, i) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          {i > 0 && <span className="opacity-40 mr-1">·</span>}
          <Icon name="check" size={11} /> {label}
        </span>
      ))}
    </motion.div>
  );
}
