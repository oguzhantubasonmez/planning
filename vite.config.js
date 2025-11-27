import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      'planlama.denizcast.com',
      'localhost',
      '.denizcast.com' // Tüm denizcast.com subdomain'leri
    ],
    hmr: {
      port: 5173
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 4173,
    host: true,
    allowedHosts: [
      'planlama.denizcast.com',
      'localhost',
      '.denizcast.com'
    ]
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  css: {
    devSourcemap: true
  }
})
