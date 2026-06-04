import { motion } from 'framer-motion';
import { AssistantBubbleIcon } from './AssistantBubbleIcon';

export function TypingBubble() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
      <AssistantBubbleIcon />
      <div className="rounded-2xl px-4 py-3 border border-border bg-surface-elevated">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16 }}
              className="w-1.5 h-1.5 rounded-full bg-text-muted"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
