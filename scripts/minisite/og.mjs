/**
 * OG cards for mini-sites (1200×630 PNG): app colours, icon, name, §4.1 line, a phone shot.
 *   node og.mjs <jobs.json> <playwright-core dir>
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [jobsPath, pwCore] = process.argv.slice(2);
const jobs = JSON.parse(readFileSync(jobsPath, 'utf8'));
const { chromium } = await import(pathToFileURL(join(pwCore, 'index.mjs')).href);
const b64 = (p, type) => `data:${type};base64,${readFileSync(p).toString('base64')}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const j of jobs) {
  const shot = j.shot && existsSync(j.shot) ? `<div class="phone"><img src="${b64(j.shot, 'image/webp')}"></div>` : '';
  await page.setContent(`<!doctype html><style>
    body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",system-ui,sans-serif;
      background:radial-gradient(60% 80% at 80% 20%, ${j.glow}55, transparent 70%), ${j.bg};color:#f6f4ef}
    .t{position:absolute;left:84px;top:150px;width:640px}
    img.i{width:120px;height:120px;border-radius:28px;box-shadow:0 18px 40px ${j.glow}66}
    h1{margin:34px 0 0;font-size:84px;line-height:1;letter-spacing:-.035em;font-weight:800}
    p{margin:18px 0 0;font-size:34px;line-height:1.25;font-weight:600;color:#f6f4efd0}
    .b{position:absolute;left:84px;bottom:56px;font-size:22px;font-weight:600;color:${j.accent}}
    .phone{position:absolute;right:96px;top:70px;width:270px;padding:9px;border-radius:44px;background:#0b0b0d;box-shadow:0 30px 70px #0008}
    .phone img{width:100%;border-radius:36px;display:block}
  </style><div class="t"><img class="i" src="${b64(j.icon, 'image/svg+xml')}"><h1>${esc(j.name)}</h1><p>${esc(j.desc)}</p></div>${shot}<div class="b">Capricorn Systems · free · on your device</div>`);
  await page.waitForTimeout(120);
  await page.screenshot({ path: j.out, type: 'png' });
  console.log(`  og ✓ ${j.slug}`);
}
await browser.close();
