const { chromium } = require('/opt/node22/lib/node_modules/playwright');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const BASE = 'http://localhost:8081';
  const WAIT = 3500;

  async function shot(name, path) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await sleep(WAIT);
    await page.screenshot({ path: `/home/user/its-corporate-site/screenshots/${name}.png`, fullPage: false });
    console.log(`✓ ${name}`);
  }

  // Navigate to home first to initialize the app
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await sleep(3000);
  await page.screenshot({ path: '/home/user/its-corporate-site/screenshots/01_home.png', fullPage: false });
  console.log('✓ 01_home');

  // Navigate to other tabs using hash/push state via client routing
  // Click on the tab links instead of navigating directly to avoid 404
  async function clickTab(tabText) {
    try {
      await page.click(`text=${tabText}`, { timeout: 3000 });
      await sleep(2000);
    } catch (e) {
      // ignore
    }
  }

  await clickTab('子ども');
  await page.screenshot({ path: '/home/user/its-corporate-site/screenshots/02_children.png', fullPage: false });
  console.log('✓ 02_children');

  await clickTab('カレンダー');
  await page.screenshot({ path: '/home/user/its-corporate-site/screenshots/03_calendar.png', fullPage: false });
  console.log('✓ 03_calendar');

  await clickTab('共有');
  await page.screenshot({ path: '/home/user/its-corporate-site/screenshots/04_board.png', fullPage: false });
  console.log('✓ 04_board');

  // Go back to home then navigate to detail screens
  await clickTab('ホーム');
  await sleep(1000);

  // Click on "明日の準備" card
  try {
    await page.click('text=→ 確認する', { timeout: 3000 });
    await sleep(2000);
    await page.screenshot({ path: '/home/user/its-corporate-site/screenshots/05_preparation.png', fullPage: false });
    console.log('✓ 05_preparation');
    await page.goBack();
    await sleep(1000);
  } catch(e) {
    console.log('skip 05_preparation:', e.message);
  }

  // Click on notification bell
  try {
    await page.click('text=🔔', { timeout: 3000 });
    await sleep(2000);
    await page.screenshot({ path: '/home/user/its-corporate-site/screenshots/06_notifications.png', fullPage: false });
    console.log('✓ 06_notifications');
    await page.goBack();
    await sleep(1000);
  } catch(e) {
    console.log('skip 06_notifications:', e.message);
  }

  // Click on print scan FAB
  try {
    await page.click('text=📷 プリントを撮影', { timeout: 3000 });
    await sleep(2000);
    await page.screenshot({ path: '/home/user/its-corporate-site/screenshots/07_print_scan.png', fullPage: false });
    console.log('✓ 07_print_scan');
    await page.goBack();
    await sleep(1000);
  } catch(e) {
    console.log('skip 07_print_scan:', e.message);
  }

  // Navigate to children tab and click on a child
  await clickTab('子ども');
  await sleep(1000);
  try {
    await page.click('text=さくら', { timeout: 3000 });
    await sleep(2500);
    await page.screenshot({ path: '/home/user/its-corporate-site/screenshots/08_child_detail.png', fullPage: false });
    console.log('✓ 08_child_detail');
    await page.goBack();
    await sleep(1000);
  } catch(e) {
    console.log('skip 08_child_detail:', e.message);
  }

  await browser.close();
  console.log('All screenshots done');
})();
