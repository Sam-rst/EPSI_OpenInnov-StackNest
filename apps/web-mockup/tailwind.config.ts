import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        night: '#032233',
        cyan: { DEFAULT: '#0d9297', 500: '#15979D', 600: '#0d9297', 700: '#017B86' },
        sun: { DEFAULT: '#fea21f' },
        danger: '#c42b1c',
        success: '#22c55e',
        surface: 'var(--surface)',
        'surface-elevated': 'var(--surface-elevated)',
        'surface-sunken': 'var(--surface-sunken)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-inverse': 'var(--text-inverse)',
        'code-bg': 'var(--code-bg)',
        hairline: 'var(--hairline)',
      },
    },
  },
  plugins: [],
} satisfies Config;
