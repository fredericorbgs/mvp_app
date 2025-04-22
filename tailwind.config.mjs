// tailwind.config.mjs
import { type Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('tw-animate-css'), // animações que você já importa no CSS
  ],
} satisfies Config
