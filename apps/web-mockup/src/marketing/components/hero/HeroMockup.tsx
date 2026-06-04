import { motion } from 'framer-motion';
import { CatalogMockup } from './catalogMockup';

const GLOW_BG = {
  background: 'radial-gradient(ellipse, rgba(13,146,151,0.45), transparent 70%)',
} as const;

export function HeroMockup() {
  return (
    <div className="relative max-w-[1280px] mx-auto px-8 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 80, rotateX: 28, rotateY: -12 }}
        animate={{ opacity: 1, y: 0, rotateX: 14, rotateY: -6 }}
        transition={{ duration: 1.1, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mockup-perspective"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="mockup-tilt mx-auto"
          style={{ width: 'min(1080px, 100%)' }}
        >
          <div className="mx-auto" style={{ width: 1080, transformOrigin: 'center top' }}>
            <CatalogMockup />
          </div>
        </motion.div>
      </motion.div>
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-12 w-[60%] h-32 rounded-[50%] blur-3xl opacity-50"
        style={GLOW_BG}
      />
    </div>
  );
}
