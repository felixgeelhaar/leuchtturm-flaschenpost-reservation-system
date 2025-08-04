/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      // Brand Colors for Flaschenpost Magazine
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        secondary: {
          50: '#fef7ee',
          100: '#fdedd7',
          200: '#fbd8ae',
          300: '#f8bc7a',
          400: '#f59545',
          500: '#f37220',
          600: '#e45516',
          700: '#bd3f14',
          800: '#973218',
          900: '#7c2a17',
          950: '#43130a',
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
      },
      
      // Typography optimized for readability
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      
      // Spacing scale for mobile-first design
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Mobile-friendly touch targets
      minHeight: {
        '44': '2.75rem', // iOS minimum touch target
        '48': '3rem',    // Android minimum touch target
      },
      
      minWidth: {
        '44': '2.75rem',
        '48': '3rem',
      },
      
      // Form-specific styles
      borderRadius: {
        'form': '0.5rem',
        'button': '0.375rem',
        'card': '0.75rem',
      },
      
      // Shadows for depth and focus states
      boxShadow: {
        'form': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'form-focus': '0 0 0 3px rgba(59, 130, 246, 0.1)',
        'button': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'button-hover': '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      
      // Animation for smooth interactions
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
      },
      
      // Grid layouts for responsive design
      gridTemplateColumns: {
        'form': 'repeat(auto-fit, minmax(250px, 1fr))',
        'card': 'repeat(auto-fit, minmax(300px, 1fr))',
      },
      
      // Container sizes
      maxWidth: {
        'form': '42rem',    // 672px
        'content': '65rem', // 1040px
        'reading': '75ch',  // Optimal reading width
      },
    },
  },
  plugins: [
    // Custom components for consistent styling
    function({ addComponents, theme }) {
      addComponents({
        // Form Components
        '.form-container': {
          '@apply max-w-form mx-auto px-4 sm:px-6 lg:px-8': {},
        },
        '.form-field': {
          '@apply w-full min-h-44 px-4 py-3 text-base border border-neutral-300 rounded-form bg-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-250': {},
          fontSize: '16px', // Prevent zoom on iOS
          '&:invalid': {
            '@apply border-error-500 focus:ring-error-500': {},
          },
          '&:disabled': {
            '@apply bg-neutral-100 text-neutral-500 cursor-not-allowed': {},
          },
        },
        '.form-field-error': {
          '@apply border-error-500 focus:ring-error-500': {},
        },
        '.form-label': {
          '@apply block text-sm font-medium text-neutral-700 mb-2': {},
        },
        '.form-label-required': {
          '&::after': {
            content: '" *"',
            '@apply text-error-500': {},
          },
        },
        '.form-error': {
          '@apply mt-1 text-sm text-error-600': {},
        },
        '.form-help': {
          '@apply mt-1 text-sm text-neutral-500': {},
        },
        
        // Button Components
        '.btn': {
          '@apply inline-flex items-center justify-center min-h-48 px-6 py-3 text-base font-medium rounded-button transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed': {},
        },
        '.btn-primary': {
          '@apply btn bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-button hover:shadow-button-hover': {},
        },
        '.btn-secondary': {
          '@apply btn bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500 border border-neutral-300': {},
        },
        '.btn-outline': {
          '@apply btn bg-transparent text-primary-600 hover:bg-primary-50 focus:ring-primary-500 border border-primary-600': {},
        },
        '.btn-danger': {
          '@apply btn bg-error-600 text-white hover:bg-error-700 focus:ring-error-500': {},
        },
        '.btn-lg': {
          '@apply px-8 py-4 text-lg min-h-14': {},
        },
        '.btn-sm': {
          '@apply px-4 py-2 text-sm min-h-10': {},
        },
        
        // Card Components
        '.card': {
          '@apply bg-white rounded-card shadow-card border border-neutral-200': {},
        },
        '.card-hover': {
          '@apply card hover:shadow-card-hover transition-shadow duration-250': {},
        },
        '.card-body': {
          '@apply p-6': {},
        },
        '.card-header': {
          '@apply px-6 py-4 border-b border-neutral-200': {},
        },
        '.card-footer': {
          '@apply px-6 py-4 border-t border-neutral-200 bg-neutral-50': {},
        },
        
        // Alert Components
        '.alert': {
          '@apply p-4 rounded-form border-l-4': {},
        },
        '.alert-success': {
          '@apply alert bg-success-50 border-success-400 text-success-800': {},
        },
        '.alert-warning': {
          '@apply alert bg-warning-50 border-warning-400 text-warning-800': {},
        },
        '.alert-error': {
          '@apply alert bg-error-50 border-error-400 text-error-800': {},
        },
        '.alert-info': {
          '@apply alert bg-primary-50 border-primary-400 text-primary-800': {},
        },
        
        // Loading States
        '.loading': {
          '@apply inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent': {},
        },
        '.loading-sm': {
          '@apply loading h-4 w-4': {},
        },
        '.loading-md': {
          '@apply loading h-6 w-6': {},
        },
        '.loading-lg': {
          '@apply loading h-8 w-8': {},
        },
        
        // Focus Management for Accessibility
        '.focus-visible': {
          '@apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2': {},
        },
        
        // Skip Links for Accessibility
        '.skip-link': {
          '@apply absolute -top-10 left-0 bg-primary-600 text-white px-4 py-2 rounded-br-form focus:top-0 transition-all duration-250': {},
        },
        
        // Screen Reader Only Content
        '.sr-only': {
          '@apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0': {},
          clipPath: 'inset(50%)',
        },
        
        // Mobile-specific styles
        '@screen max-sm': {
          '.mobile-full': {
            '@apply w-full': {},
          },
          '.mobile-stack': {
            '@apply flex flex-col space-y-4': {},
          },
        },
      })
    },
  ],
}