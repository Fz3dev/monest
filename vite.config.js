import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.png', 'apple-touch-icon.png', 'logo-crown.png'],
      manifest: {
        name: 'Monest — Votre budget, en clair',
        short_name: 'Monest',
        description: 'Votre budget, en clair. Charges, épargne, reste à vivre — tout en un.',
        theme_color: '#0B0B0F',
        background_color: '#0B0B0F',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        handle_links: 'preferred',
        launch_handler: {
          client_mode: ['navigate-existing', 'auto'],
        },
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        share_target: {
          action: '/?share=true',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
          },
        },
        shortcuts: [
          {
            name: 'Ajouter une depense',
            short_name: 'Depense',
            url: '/depenses',
            icons: [{ src: '/pwa-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Tableau de bord',
            short_name: 'Dashboard',
            url: '/dashboard',
            icons: [{ src: '/pwa-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Mon epargne',
            short_name: 'Epargne',
            url: '/epargne',
            icons: [{ src: '/pwa-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['reset.html', 'robots.txt', 'sitemap.xml'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/reset\.html$/, /^\/.well-known\//],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts')) return 'recharts'
          if (id.includes('node_modules/@supabase/supabase-js')) return 'supabase'
          if (id.includes('node_modules/motion')) return 'motion'
        },
      },
    },
  },
})
