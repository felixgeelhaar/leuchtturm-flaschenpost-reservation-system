import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

async function runLighthouseTest() {
  console.log('Starting Lighthouse performance test...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--remote-debugging-port=9222']
  });
  
  try {
    // Run Lighthouse
    const { lhr } = await lighthouse('http://localhost:4322', {
      port: 9222,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
    });
    
    // Display results
    console.log('\n=== LIGHTHOUSE SCORES ===');
    console.log(`Performance: ${(lhr.categories.performance.score * 100).toFixed(0)}/100`);
    console.log(`Accessibility: ${(lhr.categories.accessibility.score * 100).toFixed(0)}/100`);
    console.log(`Best Practices: ${(lhr.categories['best-practices'].score * 100).toFixed(0)}/100`);
    console.log(`SEO: ${(lhr.categories.seo.score * 100).toFixed(0)}/100`);
    
    // Check if performance meets threshold
    const perfScore = lhr.categories.performance.score;
    if (perfScore >= 0.9) {
      console.log('\n✅ Performance score meets 90+ threshold!');
    } else {
      console.log(`\n⚠️ Performance score (${(perfScore * 100).toFixed(0)}) below 90 threshold`);
      
      // Show performance metrics
      console.log('\nPerformance Metrics:');
      const metrics = lhr.audits;
      console.log(`- First Contentful Paint: ${metrics['first-contentful-paint'].displayValue}`);
      console.log(`- Speed Index: ${metrics['speed-index'].displayValue}`);
      console.log(`- Largest Contentful Paint: ${metrics['largest-contentful-paint'].displayValue}`);
      console.log(`- Time to Interactive: ${metrics['interactive'].displayValue}`);
      console.log(`- Total Blocking Time: ${metrics['total-blocking-time'].displayValue}`);
      console.log(`- Cumulative Layout Shift: ${metrics['cumulative-layout-shift'].displayValue}`);
    }
    
  } catch (error) {
    console.error('Lighthouse test failed:', error);
  } finally {
    await browser.close();
  }
}

runLighthouseTest().catch(console.error);