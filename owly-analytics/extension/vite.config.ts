import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/manifest.json',
          dest: '.'
        },
        {
          src: 'public/icons/*',
          dest: 'icons'
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        background: path.resolve(__dirname, 'src/background/service-worker.ts'),
        content: path.resolve(__dirname, 'src/content/content.ts'),
        popup: path.resolve(__dirname, 'src/popup/popup.html'),
        dashboard: path.resolve(__dirname, 'src/dashboard/dashboard.html'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId || '';
          if (facadeModuleId.includes('service-worker')) {
            return 'background/service-worker.js';
          }
          if (facadeModuleId.includes('content')) {
            return 'content/content.js';
          }
          return '[name]/[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
})
