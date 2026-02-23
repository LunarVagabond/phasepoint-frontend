import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg}'] },
      manifest: {
        name: 'Phasepoint ITAD',
        short_name: 'Phasepoint',
        display: 'standalone',
        description: 'Internal ITAD asset tracking',
        theme_color: '#42b883',
        background_color: '#ffffff',
        // 192 and 512 PNGs in public/ required for install prompt (Chrome, Firefox)
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  // Port must match VITE_PORT in .env (must sync with backend FRONTEND_PORT for local dev CORS)
  server: {
    host: '0.0.0.0', // Allow external access
    port: parseInt(process.env.VITE_PORT || '3330'),
    allowedHosts: true,
    // Proxy API requests to backend for local dev
    // Target backend API_PORT (default: 3332) - must match backend .env API_PORT
    proxy: {
      '/api': {
        target: 'http://localhost:3332',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Keep /api prefix
      },
    },
  },
})
