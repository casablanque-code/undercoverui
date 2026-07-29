import { defineConfig } from 'vite'
import { undercoverComponents } from './plugins/undercoverComponents.js'
import { undercoverDocs } from './plugins/undercoverDocs.js'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [undercoverComponents(), undercoverDocs(), cloudflare()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    port: 3000,
  },
})