import { chromium } from 'playwright';

async function testScrolling() {
  console.log('Starting scrolling test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to local dev server
    console.log('Navigating to http://localhost:4322...');
    await page.goto('http://localhost:4322', { waitUntil: 'networkidle' });
    
    // Test 1: Check if footer is present in DOM
    console.log('Test 1: Checking if footer exists...');
    const footerExists = await page.locator('footer').isVisible();
    console.log(`Footer exists: ${footerExists}`);
    
    // Test 2: Try to scroll to bottom
    console.log('Test 2: Scrolling to bottom...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Test 3: Check if footer is visible after scroll
    console.log('Test 3: Checking if footer is visible after scroll...');
    const footerVisible = await page.locator('footer').isVisible();
    console.log(`Footer visible after scroll: ${footerVisible}`);
    
    // Test 4: Try smooth scroll to footer
    console.log('Test 4: Smooth scrolling to footer...');
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    const footerInView = await page.locator('footer').isVisible();
    console.log(`Footer in viewport after smooth scroll: ${footerInView}`);
    
    // Test 5: Check DSGVO section visibility
    console.log('Test 5: Checking DSGVO section...');
    const dsgvoSection = await page.locator('text=DSGVO Konform').isVisible();
    console.log(`DSGVO section visible: ${dsgvoSection}`);
    
    // Test 6: Get scroll position
    const scrollPosition = await page.evaluate(() => ({
      scrollY: window.scrollY,
      scrollHeight: document.body.scrollHeight,
      clientHeight: window.innerHeight,
      canScrollMore: window.scrollY + window.innerHeight < document.body.scrollHeight
    }));
    console.log('Scroll position:', scrollPosition);
    
    // Test results
    console.log('\n=== TEST RESULTS ===');
    if (footerVisible && footerInView) {
      console.log('✅ Scrolling works! Footer is reachable.');
    } else {
      console.log('❌ Scrolling issue detected! Footer not reachable.');
    }
    
    console.log('\nPress Ctrl+C to close the browser...');
    await page.waitForTimeout(30000); // Keep browser open for manual inspection
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testScrolling().catch(console.error);