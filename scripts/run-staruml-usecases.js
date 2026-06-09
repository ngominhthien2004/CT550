/**
 * run-staruml-usecases.js
 *
 * Complete workflow:
 * 1. Update StarUML settings.json to enable API server on port 58321
 * 2. Kill existing StarUML processes and restart
 * 3. Test API connection
 * 4. Generate 4 use case diagrams via StarUML API
 *
 * Run: node scripts/run-staruml-usecases.js
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync, spawn } = require('child_process');

// ─── Configuration ───────────────────────────────────────────────────────────
const SETTINGS_PATH = 'C:\\Users\\Lenovo\\AppData\\Roaming\\StarUML\\settings.json';
const STARUML_PATH = 'C:\\Program Files\\StarUML\\StarUML.exe';
const API_PORT = 58321;
const API_BASE = `http://localhost:${API_PORT}`;

// ─── Utility: Wait ────────────────────────────────────────────────────────────
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Utility: HTTP POST ──────────────────────────────────────────────────────
function postJSON(urlPath, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const parsed = new URL(urlPath.startsWith('http') ? urlPath : `http://localhost:${API_PORT}${urlPath}`);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || API_PORT,
        path: parsed.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      res => {
        let responseBody = '';
        res.on('data', chunk => (responseBody += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: responseBody }));
      },
    );
    req.on('error', err => reject(err));
    req.write(body);
    req.end();
  });
}

// ─── Step 1: Update settings.json ────────────────────────────────────────────
function step1_updateSettings() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  STEP 1: Update StarUML settings.json');
  console.log('═══════════════════════════════════════════════');

  if (!fs.existsSync(SETTINGS_PATH)) {
    console.error(`  Settings file not found at: ${SETTINGS_PATH}`);
    console.log('  Creating a new settings file...');
    const defaultSettings = { windowState: { main: { x: 0, y: 0, width: 1200, height: 816, isMaximized: false } } };
    defaultSettings.apiServer = true;
    defaultSettings.apiServerPort = API_PORT;
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(defaultSettings, null, 2), 'utf8');
    console.log('  Created new settings.json with API server enabled');
    return;
  }

  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
    const settings = JSON.parse(raw);
    settings.apiServer = true;
    settings.apiServerPort = API_PORT;
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8');
    console.log('  Updated settings.json:');
    console.log(`    ${JSON.stringify(settings)}`);
  } catch (err) {
    console.error(`  Failed to update settings: ${err.message}`);
    throw err;
  }
}

// ─── Step 2: Kill existing StarUML processes and restart ─────────────────────
function step2_killAndRestart() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  STEP 2: Kill existing StarUML & restart');
  console.log('═══════════════════════════════════════════════');
  // Kill all StarUML processes
  try {
    execSync('taskkill /F /IM StarUML.exe', { stdio: 'pipe' });
    console.log('  Killed existing StarUML processes');
  } catch (err) {
    // taskkill exits with non-zero if no process found — that's fine
    console.log('  No StarUML processes were running (or already killed)');
  }
}

async function step2b_restartStarUML() {
  console.log('  Waiting 2 seconds before restart...');
  await wait(2000);

  console.log(`  Starting StarUML from: ${STARUML_PATH}`);
  spawn(STARUML_PATH, [], { detached: true, stdio: 'ignore' }).unref();
  console.log('  StarUML launched. Waiting 12 seconds for API server to be ready...');
  await wait(12000);
}

// ─── Step 3: Verify API server ───────────────────────────────────────────────
async function step3_verifyAPI() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  STEP 3: Verify StarUML API server');
  console.log('═══════════════════════════════════════════════');

  const maxRetries = 6;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await postJSON('/generate_diagram', { code: 'actor Test' });
      console.log(`  API responded (attempt ${attempt}):`);
      console.log(`    Status: ${result.status}`);
      console.log(`    Body: ${result.body}`);
      console.log('  ✓ API server is ready!');
      return true;
    } catch (err) {
      if (attempt < maxRetries) {
        console.log(`  Attempt ${attempt}/${maxRetries}: Server not ready yet, waiting 3s...`);
        await wait(3000);
      } else {
        console.error(`  ✗ API server did not respond after ${maxRetries} attempts`);
        console.error(`    Last error: ${err.message}`);
        return false;
      }
    }
  }
  return false;
}

// ─── Step 4: Generate diagrams ──────────────────────────────────────────────
const DIAGRAMS = [
  // ── Diagram 1: Overall System ──────────────────────────────────────────────
  {
    name: 'Overall System - Sơ đồ Use Case Tổng Quát',
      code: `actor Guest as "Khách vãng lai"
actor Member as "Thành viên"
actor Admin as "Quản trị viên"
actor AISystem as "Hệ thống AI"

Guest <|-- Member
Member <|-- Admin

usecase UC01 as "Đăng ký tài khoản"
usecase UC02 as "Đăng nhập (Email + JWT)"
usecase UC03 as "Đăng nhập Google OAuth"
usecase UC04 as "Đăng xuất"
usecase UC05 as "Xem trang chủ"
usecase UC06 as "Xem danh sách tác phẩm"
usecase UC07 as "Xem chi tiết tác phẩm"
usecase UC08 as "Xem bảng xếp hạng"
usecase UC09 as "Xem trang khám phá"
usecase UC10 as "Xem hồ sơ người dùng"
usecase UC11 as "Tìm kiếm tác phẩm"
usecase UC12 as "Tìm kiếm theo thẻ"
usecase UC13 as "Tìm kiếm người dùng"
usecase UC14 as "Tìm kiếm AI"
usecase UC15 as "Chỉnh sửa hồ sơ"
usecase UC16 as "Quản lý avatar/ảnh bìa"
usecase UC17 as "Quản lý liên kết MXH"
usecase UC18 as "Đăng tải tác phẩm"
usecase UC19 as "Chỉnh sửa tác phẩm"
usecase UC20 as "Xóa tác phẩm"
usecase UC21 as "Quản lý chương (novel)"
usecase UC22 as "Xem Dashboard sáng tác"
usecase UC23 as "Thích/Bỏ thích"
usecase UC24 as "Bookmark tác phẩm"
usecase UC25 as "Bình luận"
usecase UC26 as "Trả lời bình luận"
usecase UC27 as "Xóa bình luận"
usecase UC28 as "Theo dõi/Hủy theo dõi"
usecase UC29 as "Xem feed following"
usecase UC30 as "Nhắn tin trực tiếp"
usecase UC31 as "Chặn người dùng"
usecase UC32 as "Xem thông báo"
usecase UC33 as "Tạo Request Term"
usecase UC34 as "Đặt hàng Request"
usecase UC35 as "Quản lý Request"
usecase UC36 as "Gửi Fan Letter"
usecase UC37 as "Chat trong Request"
usecase UC38 as "Chat với AI Assistant"
usecase UC39 as "Tìm kiếm bằng AI"
usecase UC40 as "Tóm tắt nội dung AI"
usecase UC41 as "Phát hiện AI"
usecase UC42 as "Vẽ online"
usecase UC43 as "Xuất ảnh"
usecase UC44 as "Xem Dashboard tổng quan"
usecase UC45 as "Quản lý người dùng"
usecase UC46 as "Kiểm duyệt tác phẩm"
usecase UC47 as "Kiểm duyệt bình luận"
usecase UC48 as "Quản lý thẻ (tag)"
usecase UC49 as "Xử lý báo cáo vi phạm"
usecase UC50 as "Cấu hình AI"

Guest --> UC01
Guest --> UC02
Guest --> UC03
Guest --> UC05
Guest --> UC06
Guest --> UC07
Guest --> UC08
Guest --> UC09
Guest --> UC10
Guest --> UC11
Guest --> UC12
Guest --> UC13
Member --> UC04
Member --> UC14
Member --> UC15
Member --> UC16
Member --> UC17
Member --> UC18
Member --> UC19
Member --> UC20
Member --> UC21
Member --> UC22
Member --> UC23
Member --> UC24
Member --> UC25
Member --> UC26
Member --> UC27
Member --> UC28
Member --> UC29
Member --> UC30
Member --> UC31
Member --> UC32
Member --> UC33
Member --> UC34
Member --> UC35
Member --> UC36
Member --> UC37
Member --> UC38
Member --> UC39
Member --> UC40
Member --> UC42
Member --> UC43
Admin --> UC44
Admin --> UC45
Admin --> UC46
Admin --> UC47
Admin --> UC48
Admin --> UC49
Admin --> UC50

AISystem <-- UC38
AISystem <-- UC39
AISystem <-- UC40
AISystem <-- UC41

UC18 ..> UC41 : <<extend>>`,
  },

  // ── Diagram 2: Guest ───────────────────────────────────────────────────────
  {
    name: 'Guest - Sơ đồ Use Case Khách vãng lai',
    code: `actor Guest as "Khách vãng lai"
actor Member as "Thành viên"

Guest <|-- Member

usecase UC01 as "Đăng ký tài khoản"
usecase UC02 as "Đăng nhập (Email + JWT)"
usecase UC03 as "Đăng nhập Google OAuth"
usecase UC04 as "Xem trang chủ"
usecase UC05 as "Xem danh sách tác phẩm"
usecase UC06 as "Xem chi tiết tác phẩm"
usecase UC07 as "Xem bảng xếp hạng"
usecase UC08 as "Xem trang khám phá"
usecase UC09 as "Xem hồ sơ người dùng"
usecase UC10 as "Tìm kiếm tác phẩm"
usecase UC11 as "Tìm kiếm theo thẻ"
usecase UC12 as "Tìm kiếm người dùng"

Guest --> UC01
Guest --> UC02
Guest --> UC03
Guest --> UC04
Guest --> UC05
Guest --> UC06
Guest --> UC07
Guest --> UC08
Guest --> UC09
Guest --> UC10
Guest --> UC11
Guest --> UC12`,
  },

  // ── Diagram 3: Member ──────────────────────────────────────────────────────
  {
    name: 'Member - Sơ đồ Use Case Thành viên',
      code: `actor Member as "Thành viên"
actor Guest as "Khách vãng lai"

Guest <|-- Member

usecase UC01 as "Đăng xuất"
usecase UC02 as "Chỉnh sửa hồ sơ"
usecase UC03 as "Quản lý avatar/ảnh bìa"
usecase UC04 as "Quản lý liên kết MXH"
usecase UC05 as "Đăng tải tác phẩm"
usecase UC06 as "Chỉnh sửa tác phẩm"
usecase UC07 as "Xóa tác phẩm"
usecase UC08 as "Quản lý chương (novel)"
usecase UC09 as "Xem Dashboard sáng tác"
usecase UC10 as "Thích/Bỏ thích"
usecase UC11 as "Bookmark tác phẩm"
usecase UC12 as "Bình luận"
usecase UC13 as "Trả lời bình luận"
usecase UC14 as "Xóa bình luận"
usecase UC15 as "Theo dõi/Hủy theo dõi"
usecase UC16 as "Xem feed following"
usecase UC17 as "Nhắn tin trực tiếp"
usecase UC18 as "Chặn người dùng"
usecase UC19 as "Xem thông báo"
usecase UC20 as "Tạo Request Term"
usecase UC21 as "Đặt hàng Request"
usecase UC22 as "Quản lý Request"
usecase UC23 as "Gửi Fan Letter"
usecase UC24 as "Chat trong Request"
usecase UC25 as "Chat với AI Assistant"
usecase UC26 as "Tìm kiếm bằng AI"
usecase UC27 as "Tóm tắt nội dung AI"
usecase UC28 as "Vẽ online"
usecase UC29 as "Xuất ảnh"

Member --> UC01
Member --> UC02
Member --> UC03
Member --> UC04
Member --> UC05
Member --> UC06
Member --> UC07
Member --> UC08
Member --> UC09
Member --> UC10
Member --> UC11
Member --> UC12
Member --> UC13
Member --> UC14
Member --> UC15
Member --> UC16
Member --> UC17
Member --> UC18
Member --> UC19
Member --> UC20
Member --> UC21
Member --> UC22
Member --> UC23
Member --> UC24
Member --> UC25
Member --> UC26
Member --> UC27
Member --> UC28
Member --> UC29`,
  },

  // ── Diagram 4: Admin ───────────────────────────────────────────────────────
  {
    name: 'Admin - Sơ đồ Use Case Quản trị viên',
      code: `actor Admin as "Quản trị viên"
actor Member as "Thành viên"
actor Guest as "Khách vãng lai"

Guest <|-- Member
Member <|-- Admin

usecase UC01 as "Xem Dashboard tổng quan"
usecase UC02 as "Quản lý người dùng"
usecase UC03 as "Kiểm duyệt tác phẩm"
usecase UC04 as "Kiểm duyệt bình luận"
usecase UC05 as "Quản lý thẻ (tag)"
usecase UC06 as "Xử lý báo cáo vi phạm"
usecase UC07 as "Cấu hình AI"

Admin --> UC01
Admin --> UC02
Admin --> UC03
Admin --> UC04
Admin --> UC05
Admin --> UC06
Admin --> UC07`,
  },
];

async function step4_generateDiagrams() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  STEP 4: Generate Use Case Diagrams via API');
  console.log('═══════════════════════════════════════════════');

  const results = [];

  for (let i = 0; i < DIAGRAMS.length; i++) {
    const diagram = DIAGRAMS[i];
    console.log(`\n  [${i + 1}/${DIAGRAMS.length}] Sending: ${diagram.name}`);

    try {
      const result = await postJSON('/generate_diagram', { code: diagram.code });
      results.push({
        index: i + 1,
        name: diagram.name,
        status: result.status,
        body: result.body,
        success: result.status >= 200 && result.status < 300,
      });
      console.log(`    Status: ${result.status}`);
      if (result.status >= 200 && result.status < 300) {
        console.log(`    ✓ Diagram generated successfully`);
      } else {
        console.log(`    Response: ${result.body}`);
      }
    } catch (err) {
      console.error(`    ✗ Failed: ${err.message}`);
      results.push({
        index: i + 1,
        name: diagram.name,
        status: 0,
        body: err.message,
        success: false,
      });
    }

    // Wait 2 seconds between requests to avoid overwhelming the API
    if (i < DIAGRAMS.length - 1) {
      console.log('  Waiting 2 seconds before next request...');
      await wait(2000);
    }
  }

  return results;
}

// ─── Report ──────────────────────────────────────────────────────────────────
function printReport(apiOk, diagramResults) {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  FINAL REPORT');
  console.log('═══════════════════════════════════════════════');

  console.log(`\n  API Server: ${apiOk ? '✓ Connected' : '✗ Not responding'}`);

  if (diagramResults && diagramResults.length > 0) {
    console.log(`\n  Diagrams:`);
    for (const r of diagramResults) {
      const icon = r.success ? '✓' : '✗';
      console.log(`    ${icon} [${r.index}] ${r.name}`);
      if (!r.success) {
        console.log(`       Error: ${r.body}`);
      }
    }
    const succeeded = diagramResults.filter(r => r.success).length;
    console.log(`\n  Result: ${succeeded}/${diagramResults.length} diagrams generated successfully`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  StarUML Use Case Diagram Generator         ║');
  console.log('║  IlluWrl — CT550 Software Engineering        ║');
  console.log('╚══════════════════════════════════════════════╝');

  try {
    // Step 1: Update settings
    step1_updateSettings();

    // Step 2: Kill and restart
    step2_killAndRestart();
    await step2b_restartStarUML();

    // Step 3: Verify API
    const apiOk = await step3_verifyAPI();

    // Step 4: Generate diagrams (only if API is ready)
    let diagramResults = null;
    if (apiOk) {
      diagramResults = await step4_generateDiagrams();
    } else {
      console.log('\n  ⚠ API server not available — skipping diagram generation');
    }

    // Print final report
    printReport(apiOk, diagramResults);

    // Summary
    const successCount = diagramResults ? diagramResults.filter(r => r.success).length : 0;
    const totalCount = DIAGRAMS.length;
    console.log(`\n  Summary: ${successCount}/${totalCount} diagrams succeeded`);

  } catch (err) {
    console.error('\n  ✗ Fatal error:', err.message);
    process.exit(1);
  }
}

main();
