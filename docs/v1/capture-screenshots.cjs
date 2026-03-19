const puppeteer = require('puppeteer-core');
const path = require('path');

const BASE_URL = 'http://localhost:18201';
const OUTPUT_DIR = path.join(__dirname, 'images');

const SECTIONS = [
  'quickstart',
  'api',
  'persona',
  'reaction',
  'stt',
  'avatar',
  'bubble',
  'tts',
  'moderation',
  'donation',
  'interaction',
  'broadcast',
  'advanced',
];

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Navigate to settings page and wait for it to load
  await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle2', timeout: 15000 });
  await page.waitForSelector('.settings-nav-item', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));

  for (const section of SECTIONS) {
    try {
      // Click the nav item by matching text
      const navItems = await page.$$('.settings-nav-item');
      for (const item of navItems) {
        const text = await item.evaluate(el => el.textContent);
        if (text && text.includes(getLabel(section))) {
          await item.click();
          break;
        }
      }

      await new Promise(r => setTimeout(r, 1000));

      // Screenshot the whole page
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `settings-${section}.png`),
        fullPage: true,
      });
      console.log(`✓ ${section}`);
    } catch (e) {
      console.log(`✗ ${section}: ${e.message}`);
    }
  }

  // Capture overlay page
  try {
    await page.goto(`${BASE_URL}/overlay`, { waitUntil: 'networkidle2', timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'overlay.png'), fullPage: true });
    console.log('✓ overlay');
  } catch (e) {
    console.log(`✗ overlay: ${e.message}`);
  }

  await browser.close();
  console.log('Done!');
})();

function getLabel(section) {
  const labels = {
    quickstart: '빠른 설정',
    api: 'API 설정',
    persona: '페르소나',
    reaction: '반응 설정',
    stt: 'STT 설정',
    avatar: '아바타',
    bubble: '출력 설정',
    tts: 'TTS 음성',
    moderation: '콘텐츠 관리',
    donation: '후원/구독',
    interaction: '상호작용',
    broadcast: '방송 제어',
    advanced: '고급 설정',
  };
  return labels[section] || section;
}
