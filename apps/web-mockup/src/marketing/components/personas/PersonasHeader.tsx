import { motion } from 'framer-motion';

export function PersonasHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
      className="text-center mb-12"
    >
      <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-cyan">Conçu pour</div>
      <h2 className="mt-3 text-[40px] md:text-[44px] font-bold tracking-[-0.025em] leading-[1.05] text-text-primary">
        Pensé pour ceux qui codent.
      </h2>
      <p className="mt-4 text-[15.5px] max-w-[540px] mx-auto leading-relaxed text-text-secondary">
        Trois métiers, trois usages — la même promesse&nbsp;: provisionner sans réfléchir.
      </p>
    </motion.div>
  );
}
