import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE_URL = 'http://localhost:18201';
const OUTPUT_DIR = '/home/tomi/workdir/amyayabot/docs/images';

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

mkdirSync(OUTPUT_DIR, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: '/usr/bin/google-chrome',
});
const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 900 });

// Navigate to settings page
await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
await page.waitForTimeout(2000);

// Capture each section
for (const section of SECTIONS) {
  try {
    // Click the nav item
    const navItem = page.locator(`.settings-nav-item`, { hasText: new RegExp(getLabel(section)) });
    await navItem.click();
    await page.waitForTimeout(800);

    // Capture full page content area
    await page.screenshot({
      path: `${OUTPUT_DIR}/settings-${section}.png`,
      fullPage: true,
    });
    console.log(`✓ ${section}`);
  } catch (e) {
    console.log(`✗ ${section}: ${e.message}`);
  }
}

// Also capture overlay page
try {
  await page.goto(`${BASE_URL}/overlay`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUTPUT_DIR}/overlay.png`, fullPage: true });
  console.log('✓ overlay');
} catch (e) {
  console.log(`✗ overlay: ${e.message}`);
}

await browser.close();
console.log('Done!');

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
