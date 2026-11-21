// Playtest for the polished Circuit Breaker simulator.
// Loads the file in headless Chromium, drives the state machine through
// CLOSED -> OPEN -> HALF_OPEN -> OPEN -> HALF_OPEN -> CLOSED, checks Reset
// All, the packet cap, the log cap, demo cancel, the scripted demo, the
// timeline, and the highlight auto-clear. Screenshots to ./shots/.
//
// NOTE: headless Chromium cannot reach the Tailwind / Google Fonts / Tone.js
// CDNs, so the page loads unstyled. The test sets the canvas container height
// itself (the file's own CSS class normally does this) so the canvas draws.
const puppeteer = require('/home/hatch/workspace/.harness/node_modules/puppeteer-core');
const crypto = require('crypto');
const fs = require('fs');
const POLICY_PATH = '/home/hatch/workspace/.harness/webgl-policy.txt';
const POLICY_SHA = crypto.createHash('sha256').update(fs.readFileSync(POLICY_PATH)).digest('hex');

const FILE = 'file:///home/hatch/workspace/portfolio/circuit-breaker-sim/index.html';
const SHOTS = '/home/hatch/workspace/portfolio/circuit-breaker-sim/shots';
fs.mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(name, cond, detail = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!cond) failures++;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/opt/meta-chromium/chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage',
      '--hatch-webgl-allowed-domains-file=' + POLICY_PATH,
      '--hatch-webgl-allowed-domains-sha256=' + POLICY_SHA],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const pageErrors = [];
  const failedRequests = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('requestfailed', (r) => failedRequests.push(r.url()));

  await page.goto(FILE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // window.onload (which starts the animation loop) waits on subresources;
  // CDN fetches fail fast headless, so complete should arrive shortly.
  await page.waitForFunction(() => document.readyState === 'complete', { timeout: 45000 });
  await sleep(500);

  const state = () => page.evaluate(() => ({
    state: document.getElementById('headerStateText').textContent,
    hudFailures: document.getElementById('hudFailures').textContent,
    hudTimer: document.getElementById('hudTimer').textContent,
    total: document.getElementById('statTotal').textContent,
    success: document.getElementById('statSuccess').textContent,
    failed: document.getElementById('statFailed').textContent,
    blocked: document.getElementById('statBlocked').textContent,
    trips: document.getElementById('statTrips').textContent,
    successRate: document.getElementById('statSuccessRate').textContent,
    db: document.getElementById('dbStatusText').textContent,
    failMaxVal: document.getElementById('failMaxVal').textContent,
    timeoutVal: document.getElementById('timeoutVal').textContent,
    banner: document.getElementById('bannerTitle').textContent,
    timelineFirst: (document.getElementById('timelineList').children[0] || {}).textContent || '',
    timelineCount: document.getElementById('timelineList').children.length,
    timelineEmpty: !!document.querySelector('#timelineList .timeline-empty'),
  }));
  const highlightedLines = () => page.evaluate(() =>
    ['codeLineInit', 'codeLineCall', 'codeLineDb', 'codeLineTry', 'codeLineOpen', 'codeLineFallback1', 'codeLineConnErr', 'codeLineFallback2']
      .filter((id) => /bg-(indigo|rose|amber|emerald)-500\/25/.test(document.getElementById(id).className)),
  );
  const click = (sel) => page.evaluate((s) => document.querySelector(s).click(), sel);
  const waitState = async (want, maxMs) => {
    const t0 = Date.now();
    while (Date.now() - t0 < maxMs) {
      if ((await state()).state === want) return true;
      await sleep(400);
    }
    return false;
  };

  // Give the canvas its height (Tailwind class does this in a real browser)
  // and pin the header SVG to 24px (its w-6 h-6 Tailwind classes do this live;
  // without Tailwind an SVG with only a viewBox sizes to 100% width).
  await page.evaluate(() => {
    document.getElementById('canvasContainer').style.height = '360px';
    window.resizeCanvas();
  });
  await page.addStyleTag({ content: 'svg{width:24px!important;height:24px!important}' });
  await sleep(400);
  await page.screenshot({ path: `${SHOTS}/01-initial.png` });

  // 1. Initial state
  let s = await state();
  check('initial state CLOSED', s.state === 'CLOSED', JSON.stringify(s));
  check('initial DB OFFLINE', s.db.includes('OFFLINE'), s.db);
  check('initial stats all 0', s.total === '0' && s.success === '0' && s.failed === '0' && s.blocked === '0');
  check('initial trips 0 / success rate —', s.trips === '0' && s.successRate === '—', `trips=${s.trips} rate=${s.successRate}`);
  check('initial timeline shows placeholder', s.timelineEmpty && s.timelineCount === 1, `count=${s.timelineCount}`);
  check('initial failMax 3 / timeout 10s', s.failMaxVal === '3 failures' && s.timeoutVal === '10 seconds', `${s.failMaxVal} / ${s.timeoutVal}`);

  // 2. Three failing requests trip the breaker (DB starts DOWN)
  for (let i = 1; i <= 3; i++) {
    await click('#sendSingleBtn');
    await sleep(2200);
  }
  s = await state();
  check('trips to OPEN after 3 failures', s.state === 'OPEN', JSON.stringify(s));
  check('failed count is 3', s.failed === '3', s.failed);
  check('HUD shows 3 / 3', s.hudFailures === '3 / 3', s.hudFailures);
  check('trip count is 1', s.trips === '1', s.trips);
  check('timeline newest row is the trip', s.timelineFirst.includes('OPEN') && s.timelineFirst.includes('Tripped'), s.timelineFirst);
  await page.screenshot({ path: `${SHOTS}/02-open.png` });

  // 3. One more request while OPEN fast-fails to cache
  await click('#sendSingleBtn');
  await sleep(2200);
  s = await state();
  check('OPEN request fast-fails (blocked=1)', s.blocked === '1' && s.failed === '3', `blocked=${s.blocked} failed=${s.failed}`);
  check('still OPEN', s.state === 'OPEN', s.state);

  // 4. Wait out reset_timeout (10s) -> HALF_OPEN
  check('transitions to HALF-OPEN after timeout', await waitState('HALF-OPEN', 12000), 'timeout waiting for HALF-OPEN');
  s = await state();
  check('HALF-OPEN probe ready', s.hudTimer === 'Probe Ready', s.hudTimer);

  // 5. Probe with DB still down -> straight back to OPEN
  await click('#sendSingleBtn');
  await sleep(2200);
  s = await state();
  check('failed probe re-opens circuit', s.state === 'OPEN', JSON.stringify(s));
  check('failed count is 4', s.failed === '4', s.failed);
  check('trip count is 2', s.trips === '2', s.trips);

  // 6. Wait out timeout again, recover DB, probe succeeds -> CLOSED
  check('transitions to HALF-OPEN again', await waitState('HALF-OPEN', 12000), 'timeout waiting for 2nd HALF-OPEN');
  await click('#toggleDbBtn');
  await sleep(300);
  s = await state();
  check('DB recovered ONLINE', s.db.includes('ONLINE'), s.db);
  check('timeline records the DB recovery', s.timelineFirst.includes('ONLINE'), s.timelineFirst);
  await click('#sendSingleBtn');
  check('probe success closes circuit', await waitState('CLOSED', 5000), 'timeout waiting for CLOSED');
  s = await state();
  check('success count is 1, failures reset', s.success === '1' && s.hudFailures === '0 / 3', `success=${s.success} hud=${s.hudFailures}`);
  check('success rate is 17% (1 of 6)', s.successRate === '17%', s.successRate);
  // Code highlight from the probe must auto-clear within ~1.2s (generation guard)
  await sleep(1500);
  const stillLit = await highlightedLines();
  check('code highlight auto-clears', stillLit.length === 0, `still lit: ${stillLit.join(',')}`);
  await page.screenshot({ path: `${SHOTS}/03-closed.png` });

  // 7. Reset All restores initial conditions (incl. DB DOWN + sliders)
  await page.evaluate(() => {
    const fm = document.getElementById('failMaxSlider');
    fm.value = 7; fm.dispatchEvent(new Event('input'));
    const to = document.getElementById('timeoutSlider');
    to.value = 15; to.dispatchEvent(new Event('input'));
  });
  await sleep(200);
  await click('#resetSimBtn');
  await sleep(300);
  s = await state();
  check('Reset All clears stats', s.total === '0' && s.success === '0' && s.failed === '0' && s.blocked === '0', JSON.stringify(s));
  check('Reset All clears trips + success rate', s.trips === '0' && s.successRate === '—', `trips=${s.trips} rate=${s.successRate}`);
  check('Reset All clears timeline to placeholder', s.timelineEmpty, `count=${s.timelineCount}`);
  check('Reset All restores DB DOWN', s.db.includes('OFFLINE'), s.db);
  check('Reset All restores sliders 3 / 10s', s.failMaxVal === '3 failures' && s.timeoutVal === '10 seconds', `${s.failMaxVal} / ${s.timeoutVal}`);

  // 7b. Packet cap: 150 synchronous dispatches -> 100 queued, rest dropped
  const cap = await page.evaluate(() => {
    for (let i = 0; i < 150; i++) dispatchRequest();
    return {
      inFlight: sim.packets.length,
      total: sim.stats.total,
      droppedLogged: document.getElementById('consoleOutput').textContent.includes('Packet limit reached'),
    };
  });
  check('packet cap holds at 100 in flight', cap.inFlight === 100, `inFlight=${cap.inFlight}`);
  check('dropped requests are not counted', cap.total === 100, `total=${cap.total}`);
  check('dropped requests are logged', cap.droppedLogged);
  await sleep(3000); // let the 100 packets drain (all were already past the breaker, so they fail at the DB)
  await click('#resetSimBtn');
  await sleep(300);

  // 8. Log cap: flood logConsole, oldest lines must drop off at 200
  const logCount = await page.evaluate(() => {
    for (let i = 0; i < 210; i++) logConsole('cap-test ' + i, 'info');
    return document.getElementById('consoleOutput').children.length;
  });
  check('console capped at 200 lines', logCount === 200, `children=${logCount}`);
  await click('#clearLogsBtn');
  await sleep(200);

  // 9. Demo cancel: start the demo, hit Reset mid-run, demo must unwind
  await click('#runScriptedDemoBtn');
  await sleep(1500);
  await click('#resetSimBtn');
  await sleep(1500);
  const cancelState = await page.evaluate(() => ({
    demoBtnEnabled: !document.getElementById('runScriptedDemoBtn').disabled,
    cancelledLogged: document.getElementById('consoleOutput').textContent.includes('Demo cancelled by Reset'),
    state: document.getElementById('headerStateText').textContent,
  }));
  check('Reset cancels a running demo', cancelState.demoBtnEnabled && cancelState.cancelledLogged, JSON.stringify(cancelState));
  check('state is CLOSED after demo-cancel reset', cancelState.state === 'CLOSED', cancelState.state);

  // 10. Scripted demo: 4 attempts (trip on 3rd, fast-fail 4th), recover, probe -> CLOSED
  await click('#runScriptedDemoBtn');
  const demoDone = await page.waitForFunction(
    () => document.getElementById('consoleOutput').textContent.includes('Demo Complete'),
    { timeout: 25000 },
  ).then(() => true).catch(() => false);
  check('demo runs to completion', demoDone);
  check('demo ends CLOSED', await waitState('CLOSED', 5000), 'timeout waiting for CLOSED after demo');
  s = await state();
  check(
    'demo stats total=5 success=1 failed=3 blocked=1 trips=1 rate=20%',
    s.total === '5' && s.success === '1' && s.failed === '3' && s.blocked === '1' && s.trips === '1' && s.successRate === '20%',
    JSON.stringify(s),
  );
  check('timeline newest row is the close', s.timelineFirst.includes('CLOSED'), s.timelineFirst);
  await page.screenshot({ path: `${SHOTS}/04-demo-done.png` });

  // 11. No page JS errors (CDN request failures are environmental, listed separately)
  check('no page JS errors', pageErrors.length === 0, pageErrors.join(' | '));
  const nonCdnFailures = failedRequests.filter(
    (u) => !u.includes('tailwindcss') && !u.includes('googleapis') && !u.includes('gstatic') && !u.includes('cdnjs'),
  );
  check('no non-CDN failed requests', nonCdnFailures.length === 0, nonCdnFailures.join(' | '));
  console.log('CDN requests that failed headless (expected, no network to CDNs):');
  failedRequests.forEach((u) => console.log('  - ' + u));

  await browser.close();
  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
  console.error('PLAYTEST CRASHED:', e);
  process.exit(2);
});
