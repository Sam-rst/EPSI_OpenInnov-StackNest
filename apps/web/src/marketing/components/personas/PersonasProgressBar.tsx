import { motion } from 'framer-motion'

interface PersonasProgressBarProps {
  active: number
  paused: boolean
  durationMs: number
}

/** Barre de progression de l'auto-défilement, calée sur le persona actif. */
export function PersonasProgressBar({ active, paused, durationMs }: PersonasProgressBarProps) {
  return (
    <div className="bg-surface-sunken absolute right-0 bottom-0 left-0 h-[2px]">
      <motion.div
        key={`${active}-${paused}`}
        initial={{ width: '0%' }}
        animate={{ width: paused ? '0%' : '100%' }}
        transition={{ duration: paused ? 0 : durationMs / 1000, ease: 'linear' }}
        className="bg-cyan h-full"
      />
    </div>
  )
}
