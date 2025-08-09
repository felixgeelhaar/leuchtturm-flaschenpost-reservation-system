import { chromium, type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  // Launch browser to warm up the server
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for server to be ready
    await page.goto(baseURL!);
    await page.waitForSelector('h1', { timeout: 30000 });
    console.log('✅ Server is ready for testing');
  } catch (error) {
    console.error('❌ Server failed to start:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
