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
  
  output: 'hybrid',
  adapter: netlify(),

  site: process.env.SITE_URL || 'http://localhost:3000',
  
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
              if (id.includes('vue')) {
                return 'vue';
              }
            }
          },
        },
      },
      // Enable aggressive minification
      minify: 'esbuild',
      target: 'es2018',
      // Source maps only in development
      sourcemap: false,
      // Reduce chunk size
      chunkSizeWarningLimit: 200,
    },
    // CSS optimization
    css: {
      devSourcemap: false,
    },
  },
});