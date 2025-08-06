module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4321'],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.7 }], // More realistic for Vue SPA
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.85 }],
        'categories:pwa': 'off',
        
        // Core Web Vitals (more realistic thresholds)
        'first-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'first-input-delay': ['warn', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.25 }],
        
        // Additional Performance Metrics
        'speed-index': ['warn', { maxNumericValue: 4000 }],
        'interactive': ['warn', { maxNumericValue: 5000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 600 }],
        
        // Resource Optimization
        'unused-javascript': ['warn', { maxNumericValue: 40000 }],
        'unused-css-rules': ['warn', { maxNumericValue: 40000 }],
        'render-blocking-resources': 'warn',
        'uses-responsive-images': 'warn',
        'uses-optimized-images': 'warn',
        'modern-image-formats': 'warn',
        'uses-text-compression': 'error',
        'uses-rel-preconnect': 'warn',
        'uses-rel-preload': 'warn',
        
        // Security
        'is-on-https': 'error',
        'uses-http2': 'warn',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'error',
        
        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'list': 'error',
        'meta-viewport': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        
        // SEO
        'meta-description': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'canonical': 'warn',
        'robots-txt': 'warn',
        'structured-data': 'warn',
      },
      preset: 'lighthouse:recommended',
    },
    upload: {
      target: 'temporary-public-storage',
    },
    server: {
      port: 9001,
      storage: './lighthouse-reports',
    },
  },
  
  // Custom budgets for performance monitoring
  budgets: [
    {
      path: '/',
      resourceSizes: [
        { resourceType: 'document', budget: 50 },
        { resourceType: 'stylesheet', budget: 100 },
        { resourceType: 'script', budget: 300 },
        { resourceType: 'image', budget: 500 },
        { resourceType: 'font', budget: 100 },
        { resourceType: 'other', budget: 200 },
        { resourceType: 'total', budget: 1200 },
      ],
      resourceCounts: [
        { resourceType: 'document', budget: 1 },
        { resourceType: 'stylesheet', budget: 5 },
        { resourceType: 'script', budget: 10 },
        { resourceType: 'image', budget: 20 },
        { resourceType: 'font', budget: 5 },
        { resourceType: 'other', budget: 15 },
        { resourceType: 'total', budget: 50 },
      ],
      timings: [
        { metric: 'first-contentful-paint', budget: 2000 },
        { metric: 'largest-contentful-paint', budget: 2500 },
        { metric: 'speed-index', budget: 3000 },
        { metric: 'interactive', budget: 3000 },
        { metric: 'first-meaningful-paint', budget: 2000 },
        { metric: 'first-cpu-idle', budget: 3000 },
        { metric: 'estimated-input-latency', budget: 50 },
      ],
    },
  ],
};