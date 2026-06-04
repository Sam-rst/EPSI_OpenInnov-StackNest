import { motion } from 'framer-motion';
import { Icon } from '@core/ui';

interface FinalCtaProps {
  onCta: () => void;
}

const BG = {
  background: 'linear-gradient(135deg, var(--brand-cyan) 0%, #017B86 100%)',
} as const;

export function FinalCta({ onCta }: FinalCtaProps) {
  return (
    <section className="py-24" style={BG}>
      <div className="max-w-[820px] mx-auto px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.55 }}
          className="text-[48px] md:text-[56px] font-bold tracking-[-0.025em] text-white leading-[1.05]"
        >
          Démarre ton premier déploiement aujourd'hui.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-5 text-[17px] text-white/85 max-w-[520px] mx-auto leading-relaxed"
        >
          Aucune carte de crédit requise pour la démo. Self-host ou managé, tu choisis.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mt-9"
        >
          <button
            type="button"
            onClick={onCta}
            className="h-14 px-8 rounded-md bg-sun text-[#3a2a00] text-[15px] font-semibold inline-flex items-center gap-2 hover:brightness-105 hover:-translate-y-0.5 transition shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)]"
          >
            <Icon name="zap" size={16} /> Démarrer maintenant
          </button>
        </motion.div>
      </div>
    </section>
  );
}
