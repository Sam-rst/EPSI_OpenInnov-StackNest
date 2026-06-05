import { motion } from 'framer-motion'

import { Icon } from '../../../shared/components/ui'

const BARS = [68, 72, 75, 64, 56, 48, 32, 28, 24, 18, 14, 12.4]
const SHADOW = 'shadow-[0_18px_60px_-20px_rgba(3,34,51,0.18)]'

const LINES = [
  { label: 'Postgres prod', cost: '5,80 €' },
  { label: 'Redis cache', cost: '3,20 €' },
  { label: '3 sandboxes équipe', cost: '3,40 €' },
]

/** Mockup persona « lead PME » : tableau de coûts illustratif (valeurs d'exemple). */
export function PersonaMockupLead() {
  return (
    <div className="w-full max-w-[420px]">
      <div className={`border-border bg-surface-elevated rounded-xl border p-5 ${SHADOW}`}>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="text-text-muted font-mono text-[11px] tracking-[0.14em] uppercase">
              Coût mensuel
            </div>
            <div className="text-text-primary text-[36px] leading-[1.1] font-bold tracking-[-0.02em]">
              12,40&nbsp;€
            </div>
          </div>
          <div className="text-success inline-flex h-6 items-center gap-1 rounded bg-[color-mix(in_oklch,var(--color-success)_18%,transparent)] px-2 text-[11px] font-medium">
            <Icon name="trending-down" size={11} /> -68%
          </div>
        </div>
        <div className="mb-1.5 flex h-14 items-end gap-1">
          {BARS.map((value, index) => (
            <motion.div
              key={value}
              initial={{ height: 0 }}
              whileInView={{ height: `${(value / 75) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className={`flex-1 rounded-sm ${index === BARS.length - 1 ? 'bg-cyan' : 'bg-[color-mix(in_oklch,var(--color-text-muted)_28%,transparent)]'}`}
            />
          ))}
        </div>
        <div className="text-text-muted mb-4 flex items-center justify-between font-mono text-[10px]">
          <span>il y a 12 mois</span>
          <span className="text-cyan">maintenant</span>
        </div>
        <div className="border-border space-y-1.5 border-t pt-3 text-[12px]">
          {LINES.map((line) => (
            <div key={line.label} className="flex justify-between">
              <span className="text-text-secondary">{line.label}</span>
              <span className="text-text-primary font-mono">{line.cost}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
