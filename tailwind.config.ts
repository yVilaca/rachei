import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FF5436',
          light: '#FF8A3D',
          50:  '#FFF1EC',
          100: '#FFEDE8',
          200: '#FFCDC2',
          500: '#FF5436',
          600: '#E8421E',
        },
        positive: '#11A36B',
        negative: '#FF5436',
        surface: '#F6F6F8',
        card: '#FFFFFF',
        muted: '#9A9AA4',
        border: '#ECECF0',
      },
      fontFamily: {
        heading: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '26px',
        '4xl': '32px',
      },
      boxShadow: {
        card: '0 2px 10px rgba(0,0,0,0.04)',
        hero: '0 16px 30px rgba(255,84,54,0.32)',
        float: '0 8px 18px rgba(255,84,54,0.30)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
