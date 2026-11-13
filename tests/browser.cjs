const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
let playwright;
for (const candidate of [process.env.LAB5_PLAYWRIGHT, 'playwright-core', path.resolve(__dirname, '../../.lab-tools/node_modules/playwright-core')].filter(Boolean)) {
  try { playwright = require(candidate); break; } catch {}
}
if (!playwright) throw new Error('Cần playwright-core để kiểm tra trình duyệt; bản mẫu vẫn mở trực tiếp không cần cài.');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'prototype', 'evidence');
fs.mkdirSync(out, { recursive: true });
const results = [];
async function check(name, task) { await task(); results.push({ name, status: 'PASS' }); console.log('PASS', name); }
(async () => {
  const executablePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await playwright.chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  const remoteRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url())) remoteRequests.push(request.url()); });
  const open = async name => { await page.selectOption('#case', name); };
  const expectText = async (selector, text) => assert.ok((await page.locator(selector).innerText()).includes(text), selector + ' must contain ' + text);
  try {
    await page.goto(pathToFileURL(path.join(root, 'prototype', 'index.html')).href);
    await check('S01: cảnh báo ngay, không cần nhập đủ thông tin hoặc đồng ý lưu', async () => {
      await expectText('.warning', 'Không chờ trong chat');
      assert.equal(await page.locator('#consent').isChecked(), false);
      assert.equal(await page.locator('[data-action="save"]:visible').isEnabled(), false);
      assert.equal(await page.locator('.suggestion').count(), 0);
      await page.locator('[data-action="emergency-help"]:visible').click();
      await expectText('#emergency-help', 'không thực hiện cuộc gọi');
      await page.mouse.move(10, 10);
      await page.screenshot({ path: path.join(out, '01-khach-khan-cap.png'), fullPage: true });
    });
    await check('S01: chuyển thất bại không làm mất cảnh báo', async () => {
      await page.click('#tab-staff'); await page.uncheck('#online');
      await expectText('#staff', 'Chưa chuyển được'); await page.click('#tab-customer');
      assert.equal(await page.locator('.warning').isVisible(), true);
    });
    await check('S02: sửa thai kỳ thu hồi gợi ý, thông báo dược sĩ và chặn duyệt', async () => {
      await open('correction'); await page.locator('[data-action="correct"]:visible').click();
      await expectText('.legacy', 'Gợi ý cũ đã thu hồi');
      await page.locator('[data-action="taken-no"]:visible').click();
      await page.click('#tab-staff');
      await expectText('#staff', 'Đang mang thai');
      await page.locator('[data-action="accept"]:visible').click();
      assert.equal(await page.locator('[data-action="approve"]:visible').isEnabled(), false);
      await page.locator('[data-action="staff-reply"]:visible').click();
      await page.mouse.move(10, 10);
      await page.screenshot({ path: path.join(out, '02-duoc-si-thu-hoi.png'), fullPage: true });
    });
    await check('S03: đúng người nhận và duyệt mới gửi thẻ', async () => {
      await open('normal'); await page.click('#tab-staff');
      assert.equal(await page.locator('[data-action="approve"]:visible').isEnabled(), false);
      await page.locator('[data-action="accept"]:visible').click();
      assert.equal(await page.locator('[data-action="approve"]:visible').isEnabled(), true);
      await page.locator('[data-action="approve"]:visible').click(); await page.click('#tab-customer');
      await expectText('.suggestion', 'THẺ MINH HOẠ A');
      await page.locator('[data-action="revoke"]:visible').click(); assert.equal(await page.locator('.suggestion').count(), 0);
    });
    await check('Đã nhận rồi mất người trực: giữ lịch sử đã nhận, khoá duyệt và trả lời', async () => {
      await open('normal'); await page.click('#tab-staff'); await page.locator('[data-action="accept"]:visible').click();
      await page.uncheck('#online'); await expectText('#staff', 'Đã nhận · hiện không có người trực');
      assert.equal(await page.locator('[data-action="approve"]:visible').isEnabled(), false);
      assert.equal(await page.locator('[data-action="staff-reply"]:visible').isEnabled(), false);
    });
    await check('Quá hạn thực sự khoá duyệt và cho gửi lại', async () => {
      await open('normal'); await page.click('#tab-staff'); await page.locator('[data-action="accept"]:visible').click();
      await page.click('#expire');
      assert.equal(await page.locator('[data-action="approve"]:visible').isEnabled(), false);
      await page.click('#tab-customer'); await expectText('#customer', 'Đã hết hạn duyệt');
      await page.locator('[data-action="transfer"]:visible').click();
      await page.click('#tab-staff'); await page.locator('[data-action="accept"]:visible').click();
      assert.equal(await page.locator('[data-action="approve"]:visible').isEnabled(), true);
      await page.click('#tab-customer'); await page.click('#reset'); await page.click('#expire');
      await expectText('#customer', 'Quá hạn chờ');
      await page.locator('[data-action="transfer"]:visible').click();
      await page.click('#tab-staff'); await page.locator('[data-action="accept"]:visible').click();
      assert.equal(await page.locator('[data-action="approve"]:visible').isEnabled(), true);
    });
    await check('Khách sửa thông tin sau duyệt làm thẻ cũ mất hiệu lực', async () => {
      await open('normal'); await page.click('#tab-staff'); await page.locator('[data-action="accept"]:visible').click(); await page.locator('[data-action="approve"]:visible').click();
      await page.click('#tab-customer'); await page.click('#intake-details > summary');
      await page.selectOption('[name="pregnancy"]', 'pregnant'); await page.locator('#intake-form button[type="submit"]').click();
      assert.equal(await page.locator('.suggestion').count(), 0);
      await expectText('#customer', 'Gợi ý cũ đã thu hồi');
      await page.click('#tab-staff'); assert.equal(await page.locator('[data-action="approve"]:visible').isEnabled(), false);
    });
    await check('Lưu chỉ sau đồng ý, rút lại xoá thật và reload không giữ ghi chú', async () => {
      await open('normal'); await page.check('#consent'); await page.locator('[data-action="save"]:visible').click();
      await expectText('#customer', 'Đã lưu trong trang');
      await page.locator('[data-action="delete"]:visible').click(); assert.equal(await page.locator('#consent').isChecked(), false);
      assert.equal(await page.evaluate(() => window.__careState.savedNote), null);
      await page.check('#consent'); await page.locator('[data-action="save"]:visible').click();
      await page.reload(); assert.equal(await page.evaluate(() => window.__careState.savedNote), null);
    });
    await check('S05: không có nút bán thuốc kê đơn', async () => {
      await open('prescription'); await expectText('#customer', 'không bán thuốc kê đơn');
      const sellButtons = await page.getByRole('button', { name: /mua|đặt thuốc|bán thuốc/i }).count(); assert.equal(sellButtons, 0);
    });
    await check('S06: thiếu nguồn tồn kho được nói rõ', async () => {
      await open('inventory'); await expectText('#customer', 'không có công cụ hay dữ liệu tồn kho');
    });
    await check('Ca lạ: tin có dấu hiệu nguy hiểm chuyển ngay, tin ngoài hiểu biết không bịa', async () => {
      await open('ambiguous'); await page.fill('#message', 'Bố mình đau ngực, khó thở, có thuốc gì không?'); await page.locator('#message-form button').click();
      assert.equal(await page.locator('.warning').isVisible(), true);
      await open('ambiguous'); await page.fill('#message', '<img src=x onerror="window.hacked=true"> nội dung lạ'); await page.locator('#message-form button').click();
      await expectText('#customer', 'chưa hiểu đủ yêu cầu');
      assert.equal(await page.locator('.message img').count(), 0); assert.equal(await page.evaluate(() => window.hacked), undefined);
    });
    await check('Hai màn hình, điều hướng bàn phím và không tràn ngang trên điện thoại', async () => {
      await open('emergency'); await page.focus('#tab-customer'); await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#staff').isVisible(), true);
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      await page.click('#tab-customer'); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    });
    await check('Không có lỗi JavaScript hoặc yêu cầu mạng ngoài', async () => { assert.deepEqual(errors, []); assert.deepEqual(remoteRequests, []); });
    fs.writeFileSync(path.join(out, 'browser-results.json'), JSON.stringify({ checkedAt: new Date().toISOString(), browser: await browser.version(), checks: results, pageErrors: errors, externalRequests: remoteRequests }, null, 2));
    console.log(results.length + ' browser checks passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
