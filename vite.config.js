import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },

      // ── Manifest (Web App Manifest) ───────────────────────
      manifest: {
        name: '米国ETF ダッシュボード',
        short_name: 'ETFダッシュ',
        description: '米国・世界ETFをリアルタイムで追跡・分析できる投資ダッシュボード',
        lang: 'ja',
        theme_color: '#0c1445',
        background_color: '#0c1445',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        id: '/',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        categories: ['finance', 'productivity'],
      },

      // ── Static assets to cache ───────────────────────────
      includeAssets: [
        'favicon.ico',
        'icon.svg',
        'apple-touch-icon-180x180.png',
        'pwa-*.png',
        'maskable-icon-512x512.png',
      ],

      // ── Workbox (Service Worker) ─────────────────────────
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(api\.allorigins\.win|corsproxy\.io|api\.codetabs\.com)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'market-data-v1',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60,
              },
              networkTimeoutSeconds: 8,
            },
          },
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
})
