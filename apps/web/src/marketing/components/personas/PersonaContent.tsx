import { motion } from 'framer-motion';
import { Icon } from '@core/ui';
import type { Persona } from './personas.data';

interface PersonaContentProps {
  persona: Persona;
}

const tagBg = (accent: Persona['accent']) =>
  accent === 'cyan'
    ? 'bg-[color-mix(in_oklch,var(--brand-cyan)_14%,transparent)] text-cyan'
    : 'bg-[color-mix(in_oklch,var(--brand-yellow)_18%,transparent)] text-[#9b5805]';

export function PersonaContent({ persona }: PersonaContentProps) {
  return (
    <motion.div
      key={persona.name}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={`inline-flex items-center gap-2 px-2.5 h-6 rounded-md text-[10.5px] font-mono uppercase tracking-[0.14em] ${tagBg(persona.accent)}`}>
        <Icon name={persona.icon} size={11} />
        {persona.tag}
      </div>
      <h3 className="mt-5 text-[44px] md:text-[52px] font-bold tracking-[-0.03em] leading-[1.02] text-text-primary">
        {persona.name}
      </h3>
      <div className="mt-3 text-[19px] leading-[1.4] font-medium text-text-primary">{persona.headline}</div>
      <p className="mt-4 text-[14.5px] leading-[1.65] max-w-[440px] text-text-secondary">{persona.story}</p>
      <ul className="mt-6 space-y-2.5">
        {persona.bullets.map((bullet, i) => (
          <motion.li
            key={bullet.text}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.18 + i * 0.07 }}
            className="flex items-center gap-2.5 text-[13.5px] text-text-secondary"
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[color-mix(in_oklch,var(--brand-cyan)_18%,transparent)] text-cyan">
              <Icon name={bullet.icon} size={11} />
            </span>
            {bullet.text}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
