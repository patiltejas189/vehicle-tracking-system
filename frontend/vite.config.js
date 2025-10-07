import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Vehicle Tracking Management System',
        short_name: 'VehicleTracker',
        description: 'Real-time vehicle tracking with ML capabilities',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone'
      }
    })
  ],
})
