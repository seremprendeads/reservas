/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'bg-gray-800', 'bg-gray-700', 'bg-gray-600', 'bg-gray-900',
    'text-white', 'text-gray-100', 'text-gray-200', 'text-gray-300', 'text-gray-400',
    'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800',
    'border-gray-600', 'border-gray-700',
    'hover:bg-gray-600', 'hover:bg-gray-700',
    'divide-gray-700',
    'placeholder-gray-400',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Newsreader', 'Georgia', 'serif'],
        ui: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        premium: {
          bg: '#FAFAF8',
          card: '#FFFFFF',
          text: '#111111',
          muted: '#666666',
          border: '#E8E8E8',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'premium': '0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)',
        'premium-md': '0 1px 3px rgba(0,0,0,.04), 0 16px 40px rgba(0,0,0,.1)',
        'premium-lg': '0 2px 4px rgba(0,0,0,.04), 0 24px 60px rgba(0,0,0,.12)',
        'premium-hover': '0 1px 3px rgba(0,0,0,.04), 0 16px 40px rgba(0,0,0,.1)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'whatsapp-scroll': {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
          '15%': { transform: 'rotate(-12deg) scale(1.06)' },
          '30%': { transform: 'rotate(10deg) scale(1.06)' },
          '45%': { transform: 'rotate(-8deg) scale(1.03)' },
          '60%': { transform: 'rotate(6deg) scale(1.03)' },
          '75%': { transform: 'rotate(-3deg) scale(1.01)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.25s ease-out',
        'accordion-up': 'accordion-up 0.25s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'whatsapp-scroll': 'whatsapp-scroll 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
