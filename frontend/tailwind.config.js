/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Mythic Interface System palette (exact).
        void: 'var(--void-ink)',
        myth: 'var(--deep-myth)',
        night: 'var(--night-violet)',
        royal: 'var(--royal-indigo)',
        gold: 'var(--myth-gold)',
        rune: 'var(--rune-cyan)',
        spirit: 'var(--spirit-blue)',
        ember: 'var(--rose-ember)',
        bone: 'var(--ancient-bone)',
        silver: 'var(--muted-silver)',
        ruby: 'var(--danger-ruby)',
        mint: 'var(--success-mint)'
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        sub: ['"Cormorant Garamond"', 'serif'],
        body: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        glow: '0 0 40px -8px var(--rune-cyan)',
        gold: '0 0 36px -10px var(--myth-gold)',
        deep: '0 30px 80px -40px rgba(0,0,0,0.9)'
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' }
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.5' },
          '50%': { opacity: '1' }
        }
      },
      animation: {
        floaty: 'floaty 7s ease-in-out infinite',
        shimmer: 'shimmer 8s linear infinite',
        pulseGlow: 'pulseGlow 4s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
