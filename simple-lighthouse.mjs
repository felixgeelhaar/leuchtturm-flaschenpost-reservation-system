import { chromium } from 'playwright';

async function measurePerformance() {
  console.log('Measuring page performance...');
  
  const browser = await chromium.launch({ 
    headless: true 
  });
  
  const page = await browser.newPage();
  
  try {
    // Start collecting performance metrics
    await page.goto('http://localhost:4322', { waitUntil: 'networkidle' });
    
    // Get navigation timing
    const perfTiming = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
        domInteractive: perf.domInteractive - perf.fetchStart,
        firstByte: perf.responseStart - perf.requestStart,
        totalTime: perf.loadEventEnd - perf.fetchStart
      };
    });
    
    // Get resource counts
    const resources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return {
        total: resources.length,
        scripts: resources.filter(r => r.name.includes('.js')).length,
        styles: resources.filter(r => r.name.includes('.css')).length,
        images: resources.filter(r => r.initiatorType === 'img').length,
        totalSize: resources.reduce((acc, r) => acc + (r.transferSize || 0), 0)
      };
    });
    
    // Check page size
    const pageSize = await page.evaluate(() => {
      return document.documentElement.outerHTML.length;
    });
    
    // Display results
    console.log('\n=== PERFORMANCE METRICS ===');
    console.log(`DOM Interactive: ${perfTiming.domInteractive}ms`);
    console.log(`DOM Content Loaded: ${perfTiming.domContentLoaded}ms`);
    console.log(`Page Load Complete: ${perfTiming.totalTime}ms`);
    console.log(`First Byte: ${perfTiming.firstByte}ms`);
    
    console.log('\n=== RESOURCE METRICS ===');
    console.log(`Total Resources: ${resources.total}`);
    console.log(`Scripts: ${resources.scripts}`);
    console.log(`Styles: ${resources.styles}`);
    console.log(`Images: ${resources.images}`);
    console.log(`Total Transfer Size: ${(resources.totalSize / 1024).toFixed(2)} KB`);
    
    console.log('\n=== PAGE SIZE ===');
    console.log(`HTML Size: ${(pageSize / 1024).toFixed(2)} KB`);
    
    // Performance assessment
    console.log('\n=== PERFORMANCE ASSESSMENT ===');
    if (perfTiming.totalTime < 2000) {
      console.log('✅ Page loads in under 2 seconds');
    } else {
      console.log('⚠️ Page load time exceeds 2 seconds');
    }
    
    if (resources.totalSize < 500000) {
      console.log('✅ Total transfer size under 500KB');
    } else {
      console.log('⚠️ Total transfer size exceeds 500KB');
    }
    
    if (perfTiming.domInteractive < 1500) {
      console.log('✅ DOM Interactive under 1.5 seconds');
    } else {
      console.log('⚠️ DOM Interactive exceeds 1.5 seconds');
    }
    
  } catch (error) {
    console.error('Performance test failed:', error);
  } finally {
    await browser.close();
  }
}

measurePerformance().catch(console.error);