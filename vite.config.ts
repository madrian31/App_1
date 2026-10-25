import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves the site from /App_1/; keep dev at the root
  base: command === 'build' ? '/App_1/' : '/',
  plugins: [react(), tailwindcss()],
}))