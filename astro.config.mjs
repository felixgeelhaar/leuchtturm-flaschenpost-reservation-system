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
  
  vite: {
    server: {
      port: 3000,
      host: true,
    },
  },
});