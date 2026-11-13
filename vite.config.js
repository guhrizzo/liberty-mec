import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    // Evita ler o arquivo no meio da gravação (versão vazia em cache = tela branca ao recarregar).
    watch: { awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 } },
  },
})
