import { motion, AnimatePresence } from 'framer-motion';
import { CatalogCard } from './CatalogCard';
import type { CatalogItem } from '../domain/models/CatalogItem';

interface CatalogGridProps {
  items: ReadonlyArray<CatalogItem>;
  onSelect: (item: CatalogItem) => void;
}

export function CatalogGrid({ items, onSelect }: CatalogGridProps) {
  return (
    <motion.ul layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <AnimatePresence>
        {items.map((item, i) => (
          <motion.li
            key={item.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.32, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
          >
            <CatalogCard item={item} onSelect={onSelect} />
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}
