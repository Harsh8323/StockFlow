/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#E8522D',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        surface: {
          DEFAULT: '#020617',
          base: '#020617',
          card: '#0f172a',
          elevated: '#1e293b',
          border: '#334155',
        },
      },
      fontFamily: {
        sans: [
          'Outfit',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
        glow: '0 0 60px -12px rgba(249, 115, 22, 0.45)',
        'glow-sm': '0 0 30px -8px rgba(249, 115, 22, 0.35)',
        'glow-lg': '0 0 100px -20px rgba(249, 115, 22, 0.5)',
      },
      backgroundImage: {
        'hero-glow':
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(249, 115, 22, 0.25), transparent)',
        'card-gradient':
          'linear-gradient(180deg, rgba(249, 115, 22, 0.12) 0%, rgba(18, 18, 18, 0) 100%)',
      },
    },
  },
  plugins: [],
};
