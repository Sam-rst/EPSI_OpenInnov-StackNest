import { LogoMark } from './LogoMark';

interface LogoLockupProps {
  size?: number;
  color?: string;
}

export function LogoLockup({ size = 28, color = 'currentColor' }: LogoLockupProps) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <LogoMark size={size} />
      <span
        style={{
          fontSize: Math.round(size * 0.62),
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color,
        }}
      >
        StackNest
      </span>
    </span>
  );
}
