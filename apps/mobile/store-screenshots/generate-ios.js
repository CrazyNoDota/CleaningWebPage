// Generates App Store (iOS) screenshots for Shinex.
// Same composer as generate.js, but renders the iPhone 6.5"/6.9" sizes that
// App Store Connect accepts, into store-screenshots/ios-6.5 and ios-6.9.
//
// Run:  node store-screenshots/generate-ios.js
const path = require('path');
const fs = require('fs');
const PW = 'C:/Users/Jalil/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);

const MOBILE = 'C:/Users/Jalil/myApps/CleaningWebPage/apps/mobile';
const DESIGN = MOBILE + '/Design';
const OUT = MOBILE + '/store-screenshots';

// Each screen: source mockup + marketing copy (Russian — primary ASC locale).
const SCREENS = [
  { file: 'booking-light-ru.html',      title: 'Закажите уборку',          sub: 'Выберите услугу, дату и адрес за минуту' },
  { file: 'confirmation-light-ru.html', title: 'Мгновенное подтверждение', sub: 'Клинер приедет точно в назначенное время' },
  { file: 'orders-light-ru.html',       title: 'Все заказы под рукой',     sub: 'История и активные уборки в одном месте' },
  { file: 'order-detail-light-ru.html', title: 'Следите за статусом',      sub: 'Контролируйте каждый этап уборки' },
  { file: 'profile-light-ru.html',      title: 'Бонусы за уборки',         sub: '1 бонус = 1 тенге на следующий заказ' },
  { file: 'login-light-ru.html',        title: 'Вход за секунды',          sub: 'Телефон, Google или Apple' },
];

// App Store Connect required iPhone sizes (portrait).
//   6.5" -> 1242 x 2688  (iPhone 11 Pro Max / XS Max class)  — the slot in your screenshot
//   6.9" -> 1320 x 2868  (iPhone 16 Pro Max class) — newest required size
const DEVICES = [
  { name: 'iphone-6.5', dir: 'ios-6.5', W: 1242, H: 2688 },
  { name: 'iphone-6.9', dir: 'ios-6.9', W: 1320, H: 2868 },
];

// Composer HTML: brand background + headline + device frame holding the app screen.
function composer(screenUrl, title, sub, W, H) {
  const u = W / 1080;                 // unit scale (same base as Android generator)
  const px = (n) => Math.round(n * u);
  const frameW = px(760);
  const bezel = px(16);
  const radius = px(72);
  const innerW = frameW - bezel * 2;
  const logicalW = 412;               // CSS width the mockup renders at
  const scale = innerW / logicalW;    // scale the iframe up to fill the frame
  const innerH = H - px(620);         // frame bleeds off the bottom edge
  const logicalH = Math.ceil(innerH / scale) + 40;

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${W}px; height:${H}px; overflow:hidden; }
  body {
    font-family: 'Inter','Segoe UI',sans-serif;
    background: radial-gradient(120% 90% at 50% 0%, #2d6a4f 0%, #134e35 55%, #0c3826 100%);
    position:relative;
  }
  .blob { position:absolute; border-radius:50%; filter:blur(${px(40)}px); opacity:.35; }
  .b1 { width:${px(520)}px;height:${px(520)}px; background:#52B788; top:${px(-120)}px; right:${px(-120)}px; }
  .b2 { width:${px(420)}px;height:${px(420)}px; background:#95d4b3; bottom:${px(-160)}px; left:${px(-140)}px; opacity:.25;}
  .wrap { position:relative; z-index:2; height:100%; display:flex; flex-direction:column; align-items:center; }
  .copy { text-align:center; padding:${px(120)}px ${px(80)}px ${px(40)}px; }
  .title { color:#fff; font-weight:700; font-size:${px(76)}px; line-height:1.05; letter-spacing:-0.02em; }
  .sub { color:#b7e4c7; font-weight:500; font-size:${px(36)}px; line-height:1.3; margin-top:${px(24)}px; }
  .frame {
    width:${frameW}px; margin-top:auto;
    background:#0a0a0a; border-radius:${radius}px ${radius}px 0 0;
    padding:${bezel}px ${bezel}px 0; box-shadow:0 ${px(40)}px ${px(80)}px rgba(0,0,0,.45);
  }
  .screen {
    width:${innerW}px; height:${innerH}px; overflow:hidden;
    border-radius:${radius - bezel}px ${radius - bezel}px 0 0; background:#f8faf6;
  }
  .screen iframe {
    width:${logicalW}px; height:${logicalH}px; border:0;
    transform:scale(${scale}); transform-origin:top left;
  }
</style></head>
<body>
  <div class="blob b1"></div><div class="blob b2"></div>
  <div class="wrap">
    <div class="copy">
      <div class="title">${title}</div>
      <div class="sub">${sub}</div>
    </div>
    <div class="frame"><div class="screen">
      <iframe src="${screenUrl}" scrolling="no"></iframe>
    </div></div>
  </div>
</body></html>`;
}

(async () => {
  const browser = await chromium.launch();
  for (const dev of DEVICES) {
    fs.mkdirSync(`${OUT}/${dev.dir}`, { recursive: true });
    for (let i = 0; i < SCREENS.length; i++) {
      const s = SCREENS[i];
      const tmpName = `_composer_${dev.dir}.html`;
      const tmpPath = path.join(DESIGN, tmpName);
      fs.writeFileSync(tmpPath, composer(s.file, s.title, s.sub, dev.W, dev.H));
      const page = await browser.newPage({ viewport: { width: dev.W, height: dev.H }, deviceScaleFactor: 1 });
      await page.goto('file:///' + tmpPath.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      const n = String(i + 1).padStart(2, '0');
      const out = `${OUT}/${dev.dir}/${n}-${s.file.replace('-light-ru.html', '')}.png`;
      await page.screenshot({ path: out });
      await page.close();
      fs.unlinkSync(tmpPath);
      console.log('OK', dev.name, out.split('/').slice(-1)[0]);
    }
  }
  await browser.close();
  console.log('\nAll iOS screenshots generated.');
})().catch((e) => { console.error(e); process.exit(1); });
