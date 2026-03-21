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
        includeAssets: ['favicon.ico', 'logo.png', 'logo.jpg', 'robots.txt', 'sitemap.xml'],
        manifest: {
          name: 'Exam Compass',
          short_name: 'ExamCompass',
          description: 'AI-Powered Exam Preparation Platform',
          theme_color: '#8b5cf6',
          background_color: '#0a0a0f',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'logo.jpg',
              sizes: '192x192',
              type: 'image/jpeg',
              purpose: 'any maskable'
            },
            {
              src: 'logo.jpg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,json}'],
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // 15MB for large SEO manifests
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
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
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'firebase-storage-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    resolve: {
      alias: {
        // Mock removed to allow real PWA registration
      }
    },
    build: {
      modulePreload: {
        resolveDependencies: (_filename: string, deps: string[]) => {
          // Only preload critical-path chunks. Skip heavy non-critical ones.
          return deps.filter(dep =>
            !dep.includes('vendor-3d') &&
            !dep.includes('vendor-markdown') &&
            !dep.includes('mermaid') &&
            !dep.includes('html2pdf') &&
            !dep.includes('html2canvas') &&
            !dep.includes('jspdf') &&
            !dep.includes('cytoscape') &&
            !dep.includes('katex')
          );
        }
      },
      rollupOptions: {
        output: {
          manualChunks: isSSR ? undefined : {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'vendor-lucide': ['lucide-react'],
            'vendor-motion': ['framer-motion'],
            'vendor-markdown': ['react-markdown', 'remark-gfm'],
            // This prevents ~500KB from blocking initial paint on all other pages
            'vendor-3d': ['three', '@react-three/fiber', '@react-three/drei']
          }
        }
      }
    },
    ssr: {
      noExternal: ['react-helmet-async', 'framer-motion', 'lucide-react', 'react-router-dom', 'react-router', 'vite-plugin-pwa']
    }
  };
})
