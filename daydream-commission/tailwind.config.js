/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2b4570', dark: '#1c2f4d', soft: '#e7ecf5' },
        gold: { DEFAULT: '#b9832c', soft: '#faf1de' },
        teal: { DEFAULT: '#2f7d7d', soft: '#e2f1f1' },
        amber: { DEFAULT: '#c9852f', soft: '#faf0e0' },
        ink: { DEFAULT: '#1e2430', soft: '#5b6472', faint: '#8a92a0' },
        line: '#e2e6ee',
      },
      fontFamily: {
        sans: ['"Noto Sans Thai"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '18px' },
      boxShadow: {
        card: '0 1px 2px rgba(28,47,77,.05), 0 6px 16px rgba(28,47,77,.06)',
      },
    },
  },
  plugins: [],
};
