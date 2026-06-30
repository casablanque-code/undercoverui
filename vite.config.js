import { defineConfig } from 'vite'
import { undercoverComponents } from './plugins/undercoverComponents.js'
import { undercoverDocs } from './plugins/undercoverDocs.js'

export default defineConfig({
  plugins: [
    undercoverComponents(),
    undercoverDocs(),
  ],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    port: 3000,
  },
})
