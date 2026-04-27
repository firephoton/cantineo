import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  base: './',          // ← CRUCIAL pour Cordova (chemins relatifs)
  build: {
    outDir: 'Cordovapp/www',     // ← Cordova lit depuis le dossier www/
    emptyOutDir: true,
  },
})