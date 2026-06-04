import { motion } from 'framer-motion';
import { Icon } from '@core/ui';

interface HeroCtasProps {
  onCta: () => void;
}

export function HeroCtas({ onCta }: HeroCtasProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.3 }}
      className="mt-9 flex items-center justify-center gap-3"
    >
      <button
        onClick={onCta}
        className="h-12 px-6 rounded-md bg-sun text-[#3a2a00] text-[14px] font-semibold inline-flex items-center gap-2 hover:brightness-105 hover:-translate-y-px active:translate-y-0 transition shadow-[0_8px_20px_-6px_rgba(254,162,31,0.45)]"
      >
        <Icon name="zap" size={15} /> Essayer StackNest
      </button>
      <button
        onClick={onCta}
        className="h-12 px-6 rounded-md border border-[#0d3e57] bg-[#073047]/40 backdrop-blur text-white text-[14px] font-medium inline-flex items-center gap-2 hover:border-cyan transition"
      >
        <Icon name="play" size={13} /> Voir une démo
      </button>
    </motion.div>
  );
}
