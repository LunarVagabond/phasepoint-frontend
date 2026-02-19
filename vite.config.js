import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// TODO(PWA): Investigate how to enable "Install" / Add to Home Screen in Firefox.
// Firefox may require: manifest with name, short_name, icons (at least 192x192 and 512x512),
// and a secure context (HTTPS or localhost). Check beforeinstallprompt / manifest display
// and Firefox-specific PWA install criteria so the install badge appears.

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg}'] },
      manifest: {
        name: 'Phasepoint ITAD',
        short_name: 'Phasepoint',
        display: 'standalone',
        description: 'Internal ITAD asset tracking',
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
