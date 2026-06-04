import { motion } from 'framer-motion';

interface PersonasProgressBarProps {
  active: number;
  paused: boolean;
  durationMs: number;
}

export function PersonasProgressBar({ active, paused, durationMs }: PersonasProgressBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-surface-sunken">
      <motion.div
        key={`${active}-${paused}`}
        initial={{ width: '0%' }}
        animate={{ width: paused ? '0%' : '100%' }}
        transition={{ duration: paused ? 0 : durationMs / 1000, ease: 'linear' }}
        className="h-full bg-cyan"
      />
    </div>
  );
}
