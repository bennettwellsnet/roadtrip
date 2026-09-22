import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/roadtrip/',
  build: {
    rollupOptions: {
      external: ['maplibre-gl'],
      output: {
        paths: {
          'maplibre-gl':
            'https://unpkg.com/maplibre-gl@6.10.0/dist/maplibre-gl.mjs',
        },
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react';
          }
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'leaflet';
          }
        },
      },
    },
  },
})
