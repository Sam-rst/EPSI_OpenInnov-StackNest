import { motion } from 'framer-motion';

export function HeroBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="inline-flex items-center gap-2 px-3 h-7 rounded-full border border-[#0d3e57] bg-[#021824] text-[11.5px] font-medium text-[#c7d4dd] mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-sun animate-pulse" />
        <span>Plateforme self-service · v1.0 disponible</span>
      </div>
    </motion.div>
  );
}
