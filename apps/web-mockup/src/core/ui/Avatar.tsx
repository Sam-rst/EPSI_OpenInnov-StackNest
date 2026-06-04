interface AvatarProps {
  name: string;
  color?: string;
  size?: number;
}

const computeInitials = (name: string): string =>
  name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export function Avatar({ name, color = '#0d9297', size = 28 }: AvatarProps) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: color,
        letterSpacing: '0.02em',
      }}
    >
      {computeInitials(name)}
    </span>
  );
}
