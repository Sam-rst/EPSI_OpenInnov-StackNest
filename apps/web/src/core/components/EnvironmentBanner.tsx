export type Environment = 'dev' | 'test' | 'preview' | 'prod'

interface BannerStyle {
  label: string
  className: string
}

const BANNER_STYLES: Record<Exclude<Environment, 'prod'>, BannerStyle> = {
  dev: {
    label: 'DEV',
    className: 'bg-night text-white',
  },
  test: {
    label: 'TEST',
    className: 'bg-error text-white',
  },
  preview: {
    label: 'PREVIEW',
    className: 'bg-yellow text-night',
  },
}

interface EnvironmentBannerProps {
  environment: string | undefined
}

export function EnvironmentBanner({ environment }: EnvironmentBannerProps) {
  if (!environment || !(environment in BANNER_STYLES)) {
    return null
  }

  const { label, className } = BANNER_STYLES[environment as keyof typeof BANNER_STYLES]

  return (
    <div
      role="status"
      className={`fixed top-0 right-0 left-0 z-50 py-1 text-center text-xs font-semibold tracking-wider uppercase ${className}`}
    >
      Environnement : {label}
    </div>
  )
}
