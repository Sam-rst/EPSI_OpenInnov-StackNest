import { motion } from 'framer-motion'

import { Icon } from '../../../shared/components/ui'
import type { Persona } from '../../data/personas.data'

interface PersonaContentProps {
  persona: Persona
}

const tagBg = (accent: Persona['accent']): string =>
  accent === 'cyan'
    ? 'bg-[color-mix(in_oklch,var(--color-cyan)_14%,transparent)] text-cyan'
    : 'bg-[color-mix(in_oklch,var(--color-yellow)_18%,transparent)] text-[#9b5805]'

/** Texte du persona actif : tag, nom, accroche, histoire et bénéfices. */
export function PersonaContent({ persona }: PersonaContentProps) {
  return (
    <motion.div
      key={persona.name}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={`inline-flex h-6 items-center gap-2 rounded-md px-2.5 font-mono text-[10.5px] tracking-[0.14em] uppercase ${tagBg(persona.accent)}`}
      >
        <Icon name={persona.icon} size={11} />
        {persona.tag}
      </div>
      <h3 className="text-text-primary mt-5 text-[36px] leading-[1.02] font-bold tracking-[-0.03em] md:text-[52px]">
        {persona.name}
      </h3>
      <div className="text-text-primary mt-3 text-[19px] leading-[1.4] font-medium">
        {persona.headline}
      </div>
      <p className="text-text-secondary mt-4 max-w-[440px] text-[14.5px] leading-[1.65]">
        {persona.story}
      </p>
      <ul className="mt-6 space-y-2.5">
        {persona.bullets.map((bullet, index) => (
          <motion.li
            key={bullet.text}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.18 + index * 0.07 }}
            className="text-text-secondary flex items-center gap-2.5 text-[13.5px]"
          >
            <span className="text-cyan flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--color-cyan)_18%,transparent)]">
              <Icon name={bullet.icon} size={11} />
            </span>
            {bullet.text}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}
