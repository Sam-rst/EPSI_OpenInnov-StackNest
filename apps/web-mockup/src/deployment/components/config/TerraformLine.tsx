import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface TerraformLineProps {
  flashKey: string;
  flashedKeys: ReadonlySet<string>;
  children: ReactNode;
}

export function TerraformLine({ flashKey, flashedKeys, children }: TerraformLineProps) {
  const isFlashed = flashedKeys.has(flashKey);
  return (
    <motion.div
      animate={{ background: isFlashed ? 'rgba(13,146,151,0.18)' : 'rgba(13,146,151,0)' }}
      transition={{ duration: 0.3 }}
      className="px-2 -mx-2 rounded"
    >
      {children}
    </motion.div>
  );
}
