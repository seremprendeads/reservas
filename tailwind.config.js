/** @type {import('tailwindcss').Config} */
export default {
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
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
