import { AnimatePresence, motion } from 'framer-motion'

import type { Persona } from '../../data/personas.data'
import { PersonaContent } from './PersonaContent'
import { PersonaMockup } from './PersonaMockup'
import { PersonasProgressBar } from './PersonasProgressBar'

interface PersonasStageProps {
  personas: readonly Persona[]
  active: number
  paused: boolean
  durationMs: number
  onMouseEnter: () => void
  onMouseLeave: () => void
}

const cyanGradient =
  'radial-gradient(circle at 80% 20%, color-mix(in oklch, var(--color-cyan) 22%, transparent), transparent 55%)'
const yellowGradient =
  'radial-gradient(circle at 80% 20%, color-mix(in oklch, var(--color-yellow) 18%, transparent), transparent 55%)'

/** Scène à deux colonnes (texte + visuel) du persona actif, avec halo accentué. */
export function PersonasStage({
  personas,
  active,
  paused,
  durationMs,
  onMouseEnter,
  onMouseLeave,
}: PersonasStageProps) {
  const persona = personas[active]
  if (!persona) {
    return null
  }

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="border-border bg-surface-elevated relative overflow-hidden rounded-2xl border shadow-[0_30px_80px_-30px_rgba(3,34,51,0.18)]"
    >
      <motion.div
        key={persona.accent + active}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="pointer-events-none absolute inset-0"
        style={{ background: persona.accent === 'cyan' ? cyanGradient : yellowGradient }}
      />
      <div className="relative grid md:grid-cols-2">
        <div className="flex min-h-[480px] flex-col justify-center p-9 md:p-12">
          <AnimatePresence mode="wait">
            <PersonaContent persona={persona} />
          </AnimatePresence>
        </div>
        <div className="relative flex min-h-[480px] items-center justify-center bg-[color-mix(in_oklch,var(--color-surface-sunken)_55%,transparent)] p-8 md:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={persona.mockup}
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-full justify-center"
            >
              <PersonaMockup mockup={persona.mockup} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <PersonasProgressBar active={active} paused={paused} durationMs={durationMs} />
    </div>
  )
}
