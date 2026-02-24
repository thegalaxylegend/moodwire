
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(() => {
  const isSSR = process.argv.includes('--ssr') || process.argv.includes('ssr');
  console.log(`🛠️  Vite Build - Mode: ${isSSR ? 'SSR' : 'CSR'}`);

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true, // Allow testing PWA locally
          type: 'module'
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /.*\.glb$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: '3d-models-cache',
                expiration: {
                  maxEntries: 5,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
                }
              }
            }
          ]
        },
        manifest: {
          name: 'Exam Compass',
          short_name: 'ExamCompass',
          description: 'AI-Powered Exam Preparation Platform',
          theme_color: '#0A0A0A',
          background_color: '#0A0A0A',
          display: 'standalone',
          icons: [
            {
              src: 'logo.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            }
          ]
        }
      })
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: isSSR ? undefined : {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'vendor-lucide': ['lucide-react'],
            'vendor-motion': ['framer-motion'],
            'vendor-markdown': ['react-markdown', 'remark-gfm'],
            'vendor-pdf': ['jspdf', 'jspdf-autotable', 'html2pdf.js'],
            'vendor-ai': ['@google/generative-ai', 'openai', 'groq-sdk'],
            'vendor-vfx': ['three', '@react-three/fiber', '@react-three/drei']
          }
        }
      }
    },
    ssr: {
      noExternal: ['react-helmet-async', 'framer-motion', 'lucide-react', 'react-router-dom', 'react-router']
    }
  };
})
