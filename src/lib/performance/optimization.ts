/**
 * Performance Optimization Utilities
 * 
 * Comprehensive performance optimization strategies including:
 * - Image optimization and lazy loading
 * - Code splitting and dynamic imports
 * - Caching strategies
 * - Resource preloading
 * - Bundle analysis helpers
 */

// =============================================================================
// IMAGE OPTIMIZATION
// =============================================================================

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  loading?: 'lazy' | 'eager';
  sizes?: string;
  alt: string;
}

/**
 * Generate optimized image attributes for Astro Image component
 */
export function getOptimizedImageProps(
  src: string,
  options: ImageOptimizationOptions
): Record<string, any> {
  const {
    width = 800,
    height,
    quality = 80,
    format = 'webp',
    loading = 'lazy',
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    alt,
  } = options;

  return {
    src,
    alt,
    width,
    height,
    quality,
    format,
    loading,
    sizes,
    // Generate responsive sizes for different viewports
    widths: [320, 640, 768, 1024, 1280, 1920],
    // Add decoding hint for better UX
    decoding: 'async',
    // Add fetchpriority for above-the-fold images
    ...(loading === 'eager' && { fetchpriority: 'high' }),
  };
}

/**
 * Intersection Observer for lazy loading elements
 */
export class LazyLoader {
  private observer: IntersectionObserver | null = null;
  private loadedElements = new Set<Element>();

  constructor(options: IntersectionObserverInit = {}) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: '50px 0px',
          threshold: 0.01,
          ...options,
        }
      );
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !this.loadedElements.has(entry.target)) {
        this.loadElement(entry.target);
        this.loadedElements.add(entry.target);
        this.observer?.unobserve(entry.target);
      }
    });
  }

  private loadElement(element: Element) {
    // Handle images
    if (element.tagName === 'IMG') {
      const img = element as HTMLImageElement;
      const dataSrc = img.dataset.src;
      if (dataSrc) {
        img.src = dataSrc;
        img.removeAttribute('data-src');
      }
    }

    // Handle iframes
    if (element.tagName === 'IFRAME') {
      const iframe = element as HTMLIFrameElement;
      const dataSrc = iframe.dataset.src;
      if (dataSrc) {
        iframe.src = dataSrc;
        iframe.removeAttribute('data-src');
      }
    }

    // Handle custom elements with data-load attribute
    const dataLoad = element.getAttribute('data-load');
    if (dataLoad) {
      element.dispatchEvent(new CustomEvent('lazy-load', { detail: { element } }));
    }
  }

  public observe(element: Element) {
    if (this.observer) {
      this.observer.observe(element);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadElement(element);
    }
  }

  public disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.loadedElements.clear();
  }
}

// =============================================================================
// CODE SPLITTING AND DYNAMIC IMPORTS
// =============================================================================

/**
 * Dynamic import with error handling and loading states
 */
export async function dynamicImport<T = any>(
  importFn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    const module = await importFn();
    return module;
  } catch (error) {
    console.error('Dynamic import failed:', error);
    if (fallback) {
      return fallback;
    }
    throw error;
  }
}

/**
 * Component lazy loading helper for Vue components
 */
export function createLazyComponent(importFn: () => Promise<any>) {
  return () => ({
    component: importFn(),
    loading: LoadingComponent,
    error: ErrorComponent,
    delay: 200,
    timeout: 10000,
  });
}

// Default loading component
const LoadingComponent = {
  template: `
    <div class="flex items-center justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600">Loading...</span>
    </div>
  `,
};

// Default error component
const ErrorComponent = {
  template: `
    <div class="p-4 bg-red-50 border border-red-200 rounded-md">
      <p class="text-red-800">Failed to load component. Please try again.</p>
      <button 
        @click="$parent.$forceUpdate()" 
        class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  `,
};

// =============================================================================
// CACHING STRATEGIES
// =============================================================================

export interface CacheOptions {
  maxAge?: number; // in milliseconds
  maxSize?: number; // maximum number of entries
  staleWhileRevalidate?: boolean;
}

/**
 * Simple in-memory cache with TTL and size limits
 */
export class MemoryCache<T = any> {
  private cache = new Map<string, { value: T; expires: number }>();
  private maxSize: number;
  private defaultMaxAge: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultMaxAge = options.maxAge || 300000; // 5 minutes
  }

  set(key: string, value: T, maxAge?: number): void {
    // Clean up expired entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    // If still full after cleanup, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const expires = Date.now() + (maxAge || this.defaultMaxAge);
    this.cache.set(key, { value, expires });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }
}

/**
 * Browser storage cache (localStorage/sessionStorage)
 */
export class StorageCache {
  private storage: Storage;
  private prefix: string;

  constructor(type: 'local' | 'session' = 'local', prefix = 'app_cache_') {
    this.storage = type === 'local' ? localStorage : sessionStorage;
    this.prefix = prefix;
  }

  set(key: string, value: any, maxAge?: number): void {
    const expires = maxAge ? Date.now() + maxAge : null;
    const item = { value, expires };
    
    try {
      this.storage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('Storage cache set failed:', error);
    }
  }

  get(key: string): any {
    try {
      const item = this.storage.getItem(this.prefix + key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (parsed.expires && Date.now() > parsed.expires) {
        this.delete(key);
        return null;
      }

      return parsed.value;
    } catch (error) {
      console.warn('Storage cache get failed:', error);
      return null;
    }
  }

  delete(key: string): void {
    this.storage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys = Object.keys(this.storage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        this.storage.removeItem(key);
      }
    });
  }
}

// =============================================================================
// RESOURCE PRELOADING
// =============================================================================

/**
 * Preload resources for better performance
 */
export class ResourcePreloader {
  private preloadedResources = new Set<string>();

  /**
   * Preload a resource (script, style, image, etc.)
   */
  preload(href: string, as: string, crossorigin?: boolean): void {
    if (this.preloadedResources.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    
    if (crossorigin) {
      link.crossOrigin = 'anonymous';
    }

    document.head.appendChild(link);
    this.preloadedResources.add(href);
  }

  /**
   * Prefetch a resource for future navigation
   */
  prefetch(href: string): void {
    if (this.preloadedResources.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;

    document.head.appendChild(link);
    this.preloadedResources.add(href);
  }

  /**
   * Preload critical CSS
   */
  preloadCSS(href: string): void {
    this.preload(href, 'style');
  }

  /**
   * Preload JavaScript modules
   */
  preloadScript(href: string): void {
    this.preload(href, 'script', true);
  }

  /**
   * Preload images
   */
  preloadImage(href: string): void {
    this.preload(href, 'image');
  }

  /**
   * Preload fonts
   */
  preloadFont(href: string): void {
    this.preload(href, 'font', true);
  }
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

export interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

/**
 * Performance metrics collector
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private callbacks: Array<(metrics: PerformanceMetrics) => void> = [];

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    // Web Vitals
    this.measureFCP();
    this.measureLCP();
    this.measureFID();
    this.measureCLS();
    this.measureTTFB();
  }

  private measureFCP(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.fcp = fcpEntry.startTime;
        this.notifyCallbacks();
        observer.disconnect();
      }
    });

    try {
      observer.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('FCP measurement not supported');
    }
  }

  private measureLCP(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
      this.notifyCallbacks();
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP measurement not supported');
    }
  }

  private measureFID(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        this.metrics.fid = entry.processingStart - entry.startTime;
        this.notifyCallbacks();
      });
    });

    try {
      observer.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('FID measurement not supported');
    }
  }

  private measureCLS(): void {
    let clsValue = 0;
    let clsEntries: any[] = [];

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsEntries.push(entry);
          clsValue += entry.value;
        }
      });

      this.metrics.cls = clsValue;
      this.notifyCallbacks();
    });

    try {
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('CLS measurement not supported');
    }
  }

  private measureTTFB(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      this.notifyCallbacks();
    }
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => callback(this.metrics));
  }

  public onMetrics(callback: (metrics: PerformanceMetrics) => void): void {
    this.callbacks.push(callback);
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
}

// =============================================================================
// BUNDLE ANALYSIS HELPERS
// =============================================================================

/**
 * Analyze bundle size and suggest optimizations
 */
export function analyzeBundleSize(): void {
  if (typeof window === 'undefined') return;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  const resources = [...scripts, ...styles].map(element => {
    const src = element.getAttribute('src') || element.getAttribute('href');
    return src ? new URL(src, window.location.origin).pathname : null;
  }).filter(Boolean);

  console.group('Bundle Analysis');
  console.log('Loaded resources:', resources.length);
  console.log('Resources:', resources);
  
  // Check for duplicate resources
  const duplicates = resources.filter((item, index) => resources.indexOf(item) !== index);
  if (duplicates.length > 0) {
    console.warn('Duplicate resources detected:', duplicates);
  }

  console.groupEnd();
}

// Global instances
export const globalCache = new MemoryCache();
export const storageCache = new StorageCache();
export const preloader = new ResourcePreloader();
export const performanceMonitor = new PerformanceMonitor();