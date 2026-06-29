/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#06050a',
        abyss: '#0a0912',
        midnight: '#100e1a',
        shadow: '#1a1525',
        goth: {
          950: '#06050a',
          900: '#0a0912',
          800: '#100e1a',
          700: '#1a1525',
          600: '#2d1f3d',
          500: '#4b0082',
          400: '#6b3fa0',
          300: '#8b5cf6',
        },
        blood: {
          900: '#1a0510',
          700: '#7f1d1d',
          600: '#991b1b',
          500: '#dc2626',
          400: '#f87171',
        },
        bone: {
          50: '#faf5f0',
          100: '#f5ede4',
          200: '#e8d5c0',
          300: '#d4b896',
          400: '#c4a47a',
          500: '#b89064',
        },
        lumen: '#e8d5c0',
      },
      fontFamily: {
        gothic: ['Cinzel', 'serif'],
        decorative: ['Cinzel Decorative', 'serif'],
        unifraktur: ['UnifrakturMaguntia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-out-right': 'slideOutRight 0.25s ease-in',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'drift': 'drift 20s linear infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        drift: {
          '0%': { transform: 'translateY(0) translateX(0)' },
          '25%': { transform: 'translateY(calc(var(--drift, 20px))) translateX(5px)' },
          '50%': { transform: 'translateY(calc(var(--drift, 20px) * 0.5)) translateX(-5px)' },
          '75%': { transform: 'translateY(calc(var(--drift, 20px) * -0.3)) translateX(3px)' },
          '100%': { transform: 'translateY(0) translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'goth-gradient': 'linear-gradient(180deg, #06050a 0%, #100e1a 50%, #1a1525 100%)',
        'card-gradient': 'linear-gradient(135deg, #1a1525 0%, #100e1a 100%)',
        'glow-purple': 'radial-gradient(ellipse at center, rgba(75,0,130,0.15) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
}
