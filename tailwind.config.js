import typography from '@tailwindcss/typography'

const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      // Colors come from CSS variables in index.css, one set per theme.
      colors: {
        page: token('base'),
        surface: token('surface'),
        raised: token('raised'),
        line: token('line'),
        ink: token('ink'),
        ink2: token('ink2'),
        ink3: token('ink3'),
        accent: token('accent'),
        'accent-ink': token('accent-ink'),
        'on-accent': token('on-accent'),
        cyan: token('cyan'),
        'cyan-ink': token('cyan-ink'),
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.2), 0 12px 32px -16px rgb(0 0 0 / 0.5)',
        glow: '0 0 0 1px rgb(var(--accent) / 0.35), 0 0 24px -4px rgb(var(--accent) / 0.45)',
        'glow-cyan': '0 0 0 1px rgb(var(--cyan) / 0.35), 0 0 24px -4px rgb(var(--cyan) / 0.4)',
      },
    },
  },
  plugins: [typography],
}
