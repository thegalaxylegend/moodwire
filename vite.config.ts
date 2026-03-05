
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => {
  const isSSR = process.argv.includes('--ssr') || process.argv.includes('ssr');
  console.log(`🛠️  Vite Build - Mode: ${isSSR ? 'SSR' : 'CSR'}`);

  return {
    plugins: [
      react()
    ],
    resolve: {
      alias: {
        'virtual:pwa-register/react': '/src/mocks/pwa-mock.ts'
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
      noExternal: ['react-helmet-async', 'framer-motion', 'lucide-react', 'react-router-dom', 'react-router']
    }
  };
})

