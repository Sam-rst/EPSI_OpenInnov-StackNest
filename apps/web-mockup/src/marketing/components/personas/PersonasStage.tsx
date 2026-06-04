import { motion, AnimatePresence } from 'framer-motion';
import { PersonaContent } from './PersonaContent';
import { PersonaMockup } from './PersonaMockup';
import { PersonasProgressBar } from './PersonasProgressBar';
import type { Persona } from './personas.data';

interface PersonasStageProps {
  personas: ReadonlyArray<Persona>;
  active: number;
  paused: boolean;
  durationMs: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const cyanGradient = 'radial-gradient(circle at 80% 20%, color-mix(in oklch, var(--brand-cyan) 22%, transparent), transparent 55%)';
const yellowGradient = 'radial-gradient(circle at 80% 20%, color-mix(in oklch, var(--brand-yellow) 18%, transparent), transparent 55%)';

export function PersonasStage({ personas, active, paused, durationMs, onMouseEnter, onMouseLeave }: PersonasStageProps) {
  const persona = personas[active];
  if (!persona) return null;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="relative rounded-2xl overflow-hidden border border-border bg-surface-elevated shadow-[0_30px_80px_-30px_rgba(3,34,51,0.18)]"
    >
      <motion.div
        key={persona.accent + active}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: persona.accent === 'cyan' ? cyanGradient : yellowGradient }}
      />
      <div className="relative grid md:grid-cols-2">
        <div className="p-9 md:p-12 flex flex-col justify-center min-h-[480px]">
          <AnimatePresence mode="wait">
            <PersonaContent persona={persona} />
          </AnimatePresence>
        </div>
        <div className="relative flex items-center justify-center p-8 md:p-12 min-h-[480px] bg-[color-mix(in_oklch,var(--surface-sunken)_55%,transparent)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={persona.mockup}
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex justify-center"
            >
              <PersonaMockup mockup={persona.mockup} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <PersonasProgressBar active={active} paused={paused} durationMs={durationMs} />
    </div>
  );
}
