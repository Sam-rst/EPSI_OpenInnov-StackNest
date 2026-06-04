import { motion } from 'framer-motion';

interface CostsChartSvgProps {
  series: ReadonlyArray<number>;
}

const W = 720;
const H = 180;
const P = 16;

const computeAvgY = (series: ReadonlyArray<number>, max: number): number => {
  const avg = series.reduce((a, b) => a + b, 0) / series.length;
  return H - P - (avg / max) * (H - P * 2);
};

export function CostsChartSvg({ series }: CostsChartSvgProps) {
  const max = Math.max(...series);
  const bw = (W - P * 2) / series.length - 2;
  const avgY = computeAvgY(series, max);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-cyan)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--brand-cyan)" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={g}
          x1={P} x2={W - P}
          y1={P + (H - P * 2) * g} y2={P + (H - P * 2) * g}
          stroke="var(--hairline)" strokeDasharray="2 4"
        />
      ))}
      {series.map((value, i) => {
        const h = (value / max) * (H - P * 2);
        const x = P + i * (bw + 2);
        const y = H - P - h;
        return (
          <motion.rect
            key={i}
            initial={{ height: 0, y: H - P }}
            animate={{ height: h, y }}
            transition={{ duration: 0.6, delay: i * 0.018, ease: [0.22, 1, 0.36, 1] }}
            x={x} width={bw} fill="url(#barG)" rx="2"
          />
        );
      })}
      <line x1={P} x2={W - P} y1={avgY} y2={avgY} stroke="var(--brand-yellow)" strokeWidth="1.5" strokeDasharray="3 3" />
    </svg>
  );
}
