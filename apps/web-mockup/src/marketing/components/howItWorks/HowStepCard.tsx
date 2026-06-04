import { motion } from 'framer-motion';
import { Icon } from '@core/ui';
import type { HowStep } from './steps.data';

interface HowStepCardProps {
  step: HowStep;
  index: number;
}

export function HowStepCard({ step, index }: HowStepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.55, delay: index * 0.15 }}
      className="text-center"
    >
      <div className="relative mx-auto w-[88px] h-[88px] rounded-2xl flex items-center justify-center bg-surface-elevated border border-border shadow-[0_4px_20px_-8px_rgba(13,146,151,0.25)]">
        <Icon name={step.icon} size={26} className="text-cyan" />
        <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-night text-white text-[11px] font-mono font-semibold flex items-center justify-center border-4 border-surface">
          {step.number}
        </span>
      </div>
      <div className="mt-6 text-[18px] font-semibold tracking-tight text-text-primary">{step.title}</div>
      <p className="mt-2 text-[14px] leading-relaxed max-w-[280px] mx-auto text-text-secondary">{step.description}</p>
    </motion.div>
  );
}
