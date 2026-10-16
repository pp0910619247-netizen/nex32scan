import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        nex: {
          bg: 'var(--nex-bg)',
          surface: 'var(--nex-surface)',
          raised: 'var(--nex-surface-raised)',
          border: 'var(--nex-border)',
          ink: 'var(--nex-text)',
          muted: 'var(--nex-text-secondary)',
          accent: 'var(--nex-accent)',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;