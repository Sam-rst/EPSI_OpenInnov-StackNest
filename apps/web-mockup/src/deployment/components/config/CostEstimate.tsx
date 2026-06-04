import { motion } from 'framer-motion';
import { Button, Card } from '@core/ui';
import type { InstanceSize } from '../../data/sizes';

interface CostEstimateProps {
  size: InstanceSize;
  storage: number;
  backups: boolean;
  onPlan: () => void;
  onDeploy: () => void;
}

const computeStorageCost = (storage: number): number => Math.round(storage * 0.12);
const computeTotal = (size: InstanceSize, storage: number, backups: boolean): number =>
  size.cost + computeStorageCost(storage) + (backups ? 4 : 0);

export function CostEstimate({ size, storage, backups, onPlan, onDeploy }: CostEstimateProps) {
  const total = computeTotal(size, storage, backups);
  const storageCost = computeStorageCost(storage);
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">
            Coût mensuel estimé
          </div>
          <motion.div
            key={`${size.id}-${storage}-${backups}`}
            initial={{ scale: 0.95, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            className="font-bold tracking-[-0.02em] text-[44px] mt-1 text-text-primary"
          >
            {total},00 €
          </motion.div>
          <div className="text-[12px] text-text-muted">
            ≈ {(total / 30).toFixed(2)} €/jour · facturé à la seconde
          </div>
        </div>
        <div className="text-right text-[11px] space-y-0.5 text-text-muted">
          <div>Compute : <span className="font-mono text-text-secondary">{size.cost}€</span></div>
          <div>Stockage ({storage} GB) : <span className="font-mono text-text-secondary">{storageCost}€</span></div>
          <div>Backups : <span className="font-mono text-text-secondary">{backups ? '4€' : '0€'}</span></div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <Button variant="secondary" icon="play" onClick={onPlan}>Plan (dry-run)</Button>
        <Button variant="primary" icon="rocket" onClick={onDeploy}>Déployer maintenant</Button>
      </div>
    </Card>
  );
}
