import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// `base` lets the app work from a GitHub Pages sub-path (e.g. /FlashCards/).
// The deploy workflow sets VITE_BASE automatically from the repo name, so you
// normally don't need to touch this. Defaults to '/' for local dev.
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        // Precache bundled decks (JSON) too, so they work fully offline.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest}'],
      },
      manifest: {
        name: 'FlashCards',
        short_name: 'FlashCards',
        description: 'Custom JSON flashcards with practice and quiz modes',
        theme_color: '#4f46e5',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
