import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#07111f',
        panel: '#0c1b33',
        line: 'rgba(255,255,255,.09)',
        accent: '#26e0a3',
        accent2: '#4ea3ff',
      },
      boxShadow: {
        glow: '0 22px 60px rgba(0,0,0,.35)',
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
      },
    },
  },
  plugins: [],
};
export default config;