import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  integrations: [
    vue(),
    tailwind({
      applyBaseStyles: false,
    })
  ],
  
  output: 'server',
  adapter: netlify(),

  site: import.meta.env.SITE_URL || 'http://localhost:3000',
  
  // Performance optimizations
  build: {
    assets: '_astro',
    inlineStylesheets: 'auto',
  },
  
  // Prefetch optimization - disable for better Lighthouse score
  prefetch: false,
  
  // Compression and optimization
  compressHTML: true,
  
  vite: {
    server: {
      port: 3000,
      host: true,
    },
    build: {
      // Optimize bundle splitting
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Create micro-chunks for better caching
              if (id.includes('vue')) return 'vue';
              if (id.includes('zod')) return 'validation';
              if (id.includes('@supabase')) return 'supabase';
              // Group remaining vendor code
              return 'vendor';
            }
            // Split large internal modules into smaller chunks
            if (id.includes('/src/lib/database')) return 'database';
            if (id.includes('/src/lib/validation')) return 'form-validation';
            if (id.includes('/src/components/Reservation')) return 'reservation-form';
            if (id.includes('/src/components/Consent')) return 'consent';
            if (id.includes('/src/components/Error')) return 'error-handling';
          },
        },
      },
      // Enable aggressive minification
      minify: 'esbuild',
      target: 'es2020',
      // Source maps only in development
      sourcemap: false,
      // Reduce chunk size warnings
      chunkSizeWarningLimit: 100,
      // Enable tree shaking
      modulePreload: {
        polyfill: false,
      },
      // Optimize imports
      dynamicImportVarsOptions: {
        warnOnError: true,
        exclude: ['node_modules/**'],
      },
    },
    // CSS optimization
    css: {
      devSourcemap: false,
    },
  },
});