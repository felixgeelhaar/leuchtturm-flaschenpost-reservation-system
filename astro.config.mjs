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
  
  // Prefetch optimization
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  
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
          manualChunks: {
            'vue-vendor': ['vue', '@vue/runtime-core', '@vue/runtime-dom'],
            'utils': ['zod'],
          },
        },
      },
      // Enable minification (using default esbuild minifier)
      minify: true,
      // Source maps only in development
      sourcemap: process.env.NODE_ENV === 'development',
    },
    // CSS optimization
    css: {
      devSourcemap: false,
    },
  },
});