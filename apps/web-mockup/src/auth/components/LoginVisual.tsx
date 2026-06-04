import { motion } from 'framer-motion';
import { Avatar, LogoMark } from '@core/ui';

const visualBg = {
  background: 'radial-gradient(ellipse 100% 80% at 70% 50%, #0d3e57 0%, #032233 60%, #021824 100%)',
} as const;

export function LoginVisual() {
  return (
    <div className="hidden lg:flex relative overflow-hidden" style={visualBg}>
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute inset-0 stars opacity-90" />
      <div className="relative w-full flex items-center justify-center">
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 1.5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <LogoMark size={140} />
        </motion.div>
        <div
          className="absolute w-[420px] h-[420px] rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, var(--brand-cyan), transparent 70%)' }}
        />
      </div>
      <div className="absolute bottom-12 left-12 right-12 text-white/85">
        <p className="text-[15px] leading-relaxed max-w-[420px]">
          «&nbsp;En 30 secondes, j'ai un Postgres + Redis isolé pour bosser sans casser le dev partagé. C'est devenu mon réflexe.&nbsp;»
        </p>
        <div className="mt-3 flex items-center gap-2.5">
          <Avatar name="Yassine Zouitni" color="#0d9297" size={28} />
          <span className="text-[12px] text-white/65">Yassine Zouitni · Plateforme</span>
        </div>
      </div>
    </div>
  );
}
