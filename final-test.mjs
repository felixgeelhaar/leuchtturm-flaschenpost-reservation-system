import { chromium } from 'playwright';

async function finalTest() {
  console.log('Running final test before deployment...');
  
  const browser = await chromium.launch({ 
    headless: true 
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:4322', { waitUntil: 'networkidle' });
    
    // Test scrolling to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    const footerVisible = await page.locator('footer').isVisible();
    const dsgvoVisible = await page.locator('text=DSGVO Konform').isVisible();
    
    // Check form is visible
    const formVisible = await page.locator('#reservation-form').isVisible();
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: perf.loadEventEnd - perf.fetchStart,
        domInteractive: perf.domInteractive - perf.fetchStart,
      };
    });
    
    console.log('\n=== FINAL TEST RESULTS ===');
    console.log(`✅ Footer reachable: ${footerVisible}`);
    console.log(`✅ DSGVO section visible: ${dsgvoVisible}`);
    console.log(`✅ Form visible: ${formVisible}`);
    console.log(`✅ Page load time: ${metrics.loadTime}ms`);
    console.log(`✅ DOM Interactive: ${metrics.domInteractive}ms`);
    
    if (footerVisible && dsgvoVisible && formVisible && metrics.loadTime < 3000) {
      console.log('\n🎉 All tests passed! Ready to deploy.');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please review.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

finalTest().catch(console.error);