/**
 * generate-mdj-via-api.js
 *
 * Uses StarUML MCP Extension API (port 58322) to create use case diagrams
 * and save the .mdj project file.
 *
 * Prerequisites: StarUML must be running with the MCP extension loaded.
 *
 * Run: node scripts/generate-mdj-via-api.js
 */
const http = require('http');
const API = 'http://localhost:58322';

function post(endpoint, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const url = new URL(API + endpoint);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(responseBody));
          } catch {
            resolve({ success: false, error: responseBody });
          }
        });
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Diagram definitions ──────────────────────────────────────────────────────

// Diagram 1: Overall System
const overall = {
  name: 'Overall System - Sơ đồ Use Case Tổng Quát',
  actors: [
    { name: 'Khách vãng lai', x: 50, y: 180 },
    { name: 'Thành viên', x: 50, y: 360 },
    { name: 'Quản trị viên', x: 50, y: 540 },
    { name: 'Hệ thống AI', x: 50, y: 100 },
  ],
  usecases: [
    // Re-numbered to avoid long
    { name: 'Đăng ký tài khoản', x: 350, y: 30 },
    { name: 'Đăng nhập (Email + JWT)', x: 350, y: 90 },
    { name: 'Đăng nhập Google OAuth', x: 350, y: 150 },
    { name: 'Đăng xuất', x: 350, y: 210 },
    { name: 'Xem trang chủ', x: 350, y: 270 },
    { name: 'Xem danh sách tác phẩm', x: 350, y: 330 },
    { name: 'Xem chi tiết tác phẩm', x: 350, y: 390 },
    { name: 'Xem bảng xếp hạng', x: 350, y: 450 },
    { name: 'Xem trang khám phá', x: 350, y: 510 },
    { name: 'Xem hồ sơ người dùng', x: 350, y: 570 },
    { name: 'Tìm kiếm tác phẩm', x: 700, y: 30 },
    { name: 'Tìm kiếm theo thẻ', x: 700, y: 90 },
    { name: 'Tìm kiếm người dùng', x: 700, y: 150 },
    { name: 'Tìm kiếm AI', x: 700, y: 210 },
    { name: 'Chỉnh sửa hồ sơ', x: 700, y: 270 },
    { name: 'Quản lý avatar/ảnh bìa', x: 700, y: 330 },
    { name: 'Quản lý liên kết MXH', x: 700, y: 390 },
    { name: 'Đăng tải tác phẩm', x: 700, y: 450 },
    { name: 'Chỉnh sửa tác phẩm', x: 700, y: 510 },
    { name: 'Xóa tác phẩm', x: 700, y: 570 },
    { name: 'Quản lý chương (novel)', x: 1050, y: 30 },
    { name: 'Xem Dashboard sáng tác', x: 1050, y: 90 },
    { name: 'Thích/Bỏ thích', x: 1050, y: 150 },
    { name: 'Bookmark tác phẩm', x: 1050, y: 210 },
    { name: 'Bình luận', x: 1050, y: 270 },
    { name: 'Trả lời bình luận', x: 1050, y: 330 },
    { name: 'Xóa bình luận', x: 1050, y: 390 },
    { name: 'Theo dõi/Hủy theo dõi', x: 1050, y: 450 },
    { name: 'Xem feed following', x: 1050, y: 510 },
    { name: 'Nhắn tin trực tiếp', x: 1050, y: 570 },
    { name: 'Chặn người dùng', x: 1400, y: 30 },
    { name: 'Xem thông báo', x: 1400, y: 90 },
    { name: 'Tạo Request Term', x: 1400, y: 150 },
    { name: 'Đặt hàng Request', x: 1400, y: 210 },
    { name: 'Quản lý Request', x: 1400, y: 270 },
    { name: 'Gửi Fan Letter', x: 1400, y: 330 },
    { name: 'Chat trong Request', x: 1400, y: 390 },
    { name: 'Chat với AI Assistant', x: 1400, y: 450 },
    { name: 'Tìm kiếm bằng AI', x: 1400, y: 510 },
    { name: 'Tóm tắt nội dung AI', x: 1400, y: 570 },
    { name: 'Phát hiện AI', x: 1750, y: 30 },
    { name: 'Vẽ online', x: 1750, y: 90 },
    { name: 'Xuất ảnh', x: 1750, y: 150 },
    { name: 'Xem Dashboard tổng quan', x: 1750, y: 210 },
    { name: 'Quản lý người dùng', x: 1750, y: 270 },
    { name: 'Kiểm duyệt tác phẩm', x: 1750, y: 330 },
    { name: 'Kiểm duyệt bình luận', x: 1750, y: 390 },
    { name: 'Quản lý thẻ (tag)', x: 1750, y: 450 },
    { name: 'Xử lý báo cáo vi phạm', x: 1750, y: 510 },
    { name: 'Cấu hình AI', x: 1750, y: 570 },
  ],
  // Each edge: [actorIndex or "actor:name", useCaseIndex or "uc:name", type]
  // type: "assoc" = association, "general" = generalization, "extend" = extend
  edges: [
    // Generalizations
    { from: 0, to: 1, type: 'general' },
    { from: 1, to: 2, type: 'general' },
    // Guest -> use cases
    { from: 0, to: 0, type: 'assoc' },
    { from: 0, to: 1, type: 'assoc' },
    { from: 0, to: 2, type: 'assoc' },
    { from: 0, to: 4, type: 'assoc' },
    { from: 0, to: 5, type: 'assoc' },
    { from: 0, to: 6, type: 'assoc' },
    { from: 0, to: 7, type: 'assoc' },
    { from: 0, to: 8, type: 'assoc' },
    { from: 0, to: 9, type: 'assoc' },
    { from: 0, to: 10, type: 'assoc' },
    { from: 0, to: 11, type: 'assoc' },
    { from: 0, to: 12, type: 'assoc' },
    // Member -> use cases
    { from: 1, to: 3, type: 'assoc' },
    { from: 1, to: 13, type: 'assoc' },
    { from: 1, to: 14, type: 'assoc' },
    { from: 1, to: 15, type: 'assoc' },
    { from: 1, to: 16, type: 'assoc' },
    { from: 1, to: 17, type: 'assoc' },
    { from: 1, to: 18, type: 'assoc' },
    { from: 1, to: 19, type: 'assoc' },
    { from: 1, to: 20, type: 'assoc' },
    { from: 1, to: 21, type: 'assoc' },
    { from: 1, to: 22, type: 'assoc' },
    { from: 1, to: 23, type: 'assoc' },
    { from: 1, to: 24, type: 'assoc' },
    { from: 1, to: 25, type: 'assoc' },
    { from: 1, to: 26, type: 'assoc' },
    { from: 1, to: 27, type: 'assoc' },
    { from: 1, to: 28, type: 'assoc' },
    { from: 1, to: 29, type: 'assoc' },
    { from: 1, to: 30, type: 'assoc' },
    { from: 1, to: 31, type: 'assoc' },
    { from: 1, to: 32, type: 'assoc' },
    { from: 1, to: 33, type: 'assoc' },
    { from: 1, to: 34, type: 'assoc' },
    { from: 1, to: 35, type: 'assoc' },
    { from: 1, to: 36, type: 'assoc' },
    { from: 1, to: 37, type: 'assoc' },
    { from: 1, to: 38, type: 'assoc' },
    { from: 1, to: 39, type: 'assoc' },
    { from: 1, to: 41, type: 'assoc' },
    { from: 1, to: 42, type: 'assoc' },
    // Admin -> use cases
    { from: 2, to: 43, type: 'assoc' },
    { from: 2, to: 44, type: 'assoc' },
    { from: 2, to: 45, type: 'assoc' },
    { from: 2, to: 46, type: 'assoc' },
    { from: 2, to: 47, type: 'assoc' },
    { from: 2, to: 48, type: 'assoc' },
    { from: 2, to: 49, type: 'assoc' },
    // AI System <- use cases (reverse direction)
    { from: 37, to: 3, type: 'assoc' },
    { from: 38, to: 3, type: 'assoc' },
    { from: 39, to: 3, type: 'assoc' },
    { from: 40, to: 3, type: 'assoc' },
    // Extend: Đăng tải tác phẩm ..> Phát hiện AI
    { from: 17, to: 40, type: 'extend' },
  ],
};

// Diagram 2: Guest
const guest = {
  name: 'Guest - Sơ đồ Use Case Khách vãng lai',
  actors: [
    { name: 'Khách vãng lai', x: 50, y: 150 },
    { name: 'Thành viên', x: 50, y: 300 },
  ],
  usecases: [
    { name: 'Đăng ký tài khoản', x: 350, y: 30 },
    { name: 'Đăng nhập (Email + JWT)', x: 350, y: 90 },
    { name: 'Đăng nhập Google OAuth', x: 350, y: 150 },
    { name: 'Xem trang chủ', x: 350, y: 210 },
    { name: 'Xem danh sách tác phẩm', x: 350, y: 270 },
    { name: 'Xem chi tiết tác phẩm', x: 350, y: 330 },
    { name: 'Xem bảng xếp hạng', x: 350, y: 390 },
    { name: 'Xem trang khám phá', x: 350, y: 450 },
    { name: 'Xem hồ sơ người dùng', x: 350, y: 510 },
    { name: 'Tìm kiếm tác phẩm', x: 700, y: 100 },
    { name: 'Tìm kiếm theo thẻ', x: 700, y: 200 },
    { name: 'Tìm kiếm người dùng', x: 700, y: 300 },
  ],
  edges: [
    { from: 0, to: 1, type: 'general' },
    { from: 0, to: 0, type: 'assoc' },
    { from: 0, to: 1, type: 'assoc' },
    { from: 0, to: 2, type: 'assoc' },
    { from: 0, to: 3, type: 'assoc' },
    { from: 0, to: 4, type: 'assoc' },
    { from: 0, to: 5, type: 'assoc' },
    { from: 0, to: 6, type: 'assoc' },
    { from: 0, to: 7, type: 'assoc' },
    { from: 0, to: 8, type: 'assoc' },
    { from: 0, to: 9, type: 'assoc' },
    { from: 0, to: 10, type: 'assoc' },
    { from: 0, to: 11, type: 'assoc' },
  ],
};

// Diagram 3: Member
const member = {
  name: 'Member - Sơ đồ Use Case Thành viên',
  actors: [
    { name: 'Thành viên', x: 50, y: 200 },
    { name: 'Khách vãng lai', x: 50, y: 50 },
  ],
  usecases: [
    { name: 'Đăng xuất', x: 350, y: 30 },
    { name: 'Chỉnh sửa hồ sơ', x: 350, y: 90 },
    { name: 'Quản lý avatar/ảnh bìa', x: 350, y: 150 },
    { name: 'Quản lý liên kết MXH', x: 350, y: 210 },
    { name: 'Đăng tải tác phẩm', x: 350, y: 270 },
    { name: 'Chỉnh sửa tác phẩm', x: 350, y: 330 },
    { name: 'Xóa tác phẩm', x: 350, y: 390 },
    { name: 'Quản lý chương (novel)', x: 350, y: 450 },
    { name: 'Xem Dashboard sáng tác', x: 350, y: 510 },
    { name: 'Thích/Bỏ thích', x: 700, y: 30 },
    { name: 'Bookmark tác phẩm', x: 700, y: 90 },
    { name: 'Bình luận', x: 700, y: 150 },
    { name: 'Trả lời bình luận', x: 700, y: 210 },
    { name: 'Xóa bình luận', x: 700, y: 270 },
    { name: 'Theo dõi/Hủy theo dõi', x: 700, y: 330 },
    { name: 'Xem feed following', x: 700, y: 390 },
    { name: 'Nhắn tin trực tiếp', x: 700, y: 450 },
    { name: 'Chặn người dùng', x: 700, y: 510 },
    { name: 'Xem thông báo', x: 1050, y: 30 },
    { name: 'Tạo Request Term', x: 1050, y: 90 },
    { name: 'Đặt hàng Request', x: 1050, y: 150 },
    { name: 'Quản lý Request', x: 1050, y: 210 },
    { name: 'Gửi Fan Letter', x: 1050, y: 270 },
    { name: 'Chat trong Request', x: 1050, y: 330 },
    { name: 'Chat với AI Assistant', x: 1050, y: 390 },
    { name: 'Tìm kiếm bằng AI', x: 1050, y: 450 },
    { name: 'Tóm tắt nội dung AI', x: 1050, y: 510 },
    { name: 'Vẽ online', x: 1400, y: 150 },
    { name: 'Xuất ảnh', x: 1400, y: 250 },
  ],
  edges: [
    { from: 1, to: 0, type: 'general' },
    { from: 0, to: 0, type: 'assoc' },
    { from: 0, to: 1, type: 'assoc' },
    { from: 0, to: 2, type: 'assoc' },
    { from: 0, to: 3, type: 'assoc' },
    { from: 0, to: 4, type: 'assoc' },
    { from: 0, to: 5, type: 'assoc' },
    { from: 0, to: 6, type: 'assoc' },
    { from: 0, to: 7, type: 'assoc' },
    { from: 0, to: 8, type: 'assoc' },
    { from: 0, to: 9, type: 'assoc' },
    { from: 0, to: 10, type: 'assoc' },
    { from: 0, to: 11, type: 'assoc' },
    { from: 0, to: 12, type: 'assoc' },
    { from: 0, to: 13, type: 'assoc' },
    { from: 0, to: 14, type: 'assoc' },
    { from: 0, to: 15, type: 'assoc' },
    { from: 0, to: 16, type: 'assoc' },
    { from: 0, to: 17, type: 'assoc' },
    { from: 0, to: 18, type: 'assoc' },
    { from: 0, to: 19, type: 'assoc' },
    { from: 0, to: 20, type: 'assoc' },
    { from: 0, to: 21, type: 'assoc' },
    { from: 0, to: 22, type: 'assoc' },
    { from: 0, to: 23, type: 'assoc' },
    { from: 0, to: 24, type: 'assoc' },
    { from: 0, to: 25, type: 'assoc' },
    { from: 0, to: 26, type: 'assoc' },
    { from: 0, to: 27, type: 'assoc' },
    { from: 0, to: 28, type: 'assoc' },
  ],
};

// Diagram 4: Admin
const admin = {
  name: 'Admin - Sơ đồ Use Case Quản trị viên',
  actors: [
    { name: 'Quản trị viên', x: 50, y: 250 },
    { name: 'Thành viên', x: 50, y: 100 },
    { name: 'Khách vãng lai', x: 50, y: 30 },
  ],
  usecases: [
    { name: 'Xem Dashboard tổng quan', x: 350, y: 50 },
    { name: 'Quản lý người dùng', x: 350, y: 140 },
    { name: 'Kiểm duyệt tác phẩm', x: 350, y: 230 },
    { name: 'Kiểm duyệt bình luận', x: 350, y: 320 },
    { name: 'Quản lý thẻ (tag)', x: 350, y: 410 },
    { name: 'Xử lý báo cáo vi phạm', x: 350, y: 500 },
    { name: 'Cấu hình AI', x: 350, y: 590 },
  ],
  edges: [
    { from: 2, to: 1, type: 'general' },
    { from: 1, to: 0, type: 'general' },
    { from: 0, to: 0, type: 'assoc' },
    { from: 0, to: 1, type: 'assoc' },
    { from: 0, to: 2, type: 'assoc' },
    { from: 0, to: 3, type: 'assoc' },
    { from: 0, to: 4, type: 'assoc' },
    { from: 0, to: 5, type: 'assoc' },
    { from: 0, to: 6, type: 'assoc' },
  ],
};

const DIAGRAMS = [overall, guest, member, admin];

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  StarUML Use Case .mdj Generator            ║');
  console.log('║  IlluWrl — CT550                            ║');
  console.log('╚══════════════════════════════════════════════╝');

  const OUTPUT_PATH = 'E:/HocTap/CT550/docs/diagrams/IlluWrl-UseCase.mdj';
  const totalDiagrams = DIAGRAMS.length;

  // Step 1: Create new project
  console.log('\n--- Step 1: Create new project ---');
  let r = await post('/new_project', {});
  if (!r.success) throw new Error('Failed to create new project: ' + r.error);
  console.log('✓ New project created');

  // Step 2: Get project root
  r = await post('/find_elements', {});
  if (!r.success || !r.data.elements.length) throw new Error('No project root found');
  const rootId = r.data.elements[0]._id;
  console.log(`✓ Project root: ${rootId}`);

  // Step 3: Create Model element
  r = await post('/create_element', { type: 'UMLModel', parentId: rootId, name: 'Model' });
  if (!r.success) throw new Error('Failed to create Model: ' + r.error);
  const modelId = r.data._id;
  console.log(`✓ Model created: ${modelId}`);

  // Step 4: Process each diagram
  for (let d = 0; d < totalDiagrams; d++) {
    const diagram = DIAGRAMS[d];
    console.log(`\n--- Diagram ${d + 1}/${totalDiagrams}: ${diagram.name} ---`);

    // Create diagram
    r = await post('/create_diagram', { type: 'UMLUseCaseDiagram', parentId: modelId, name: diagram.name });
    if (!r.success) throw new Error(`Failed to create diagram: ${r.error}`);
    const diagramId = r.data._id;
    console.log(`✓ Diagram created: ${diagramId}`);

    // Create actors
    const actorViews = [];
    for (let a = 0; a < diagram.actors.length; a++) {
      const actor = diagram.actors[a];
      r = await post('/create_element_with_view', {
        type: 'UMLActor',
        parentId: modelId,
        diagramId: diagramId,
        name: actor.name,
        x: actor.x,
        y: actor.y,
        x2: actor.x + 120,
        y2: actor.y + 60,
      });
      if (!r.success) {
        console.error(`  ✗ Failed to create actor "${actor.name}": ${r.error}`);
        actorViews.push(null);
      } else {
        actorViews.push(r.data.view._id);
        console.log(`  ✓ Actor: ${actor.name} -> view ${r.data.view._id}`);
      }
      await wait(100);
    }

    // Create use cases
    const ucViews = [];
    for (let u = 0; u < diagram.usecases.length; u++) {
      const uc = diagram.usecases[u];
      r = await post('/create_element_with_view', {
        type: 'UMLUseCase',
        parentId: modelId,
        diagramId: diagramId,
        name: uc.name,
        x: uc.x,
        y: uc.y,
        x2: uc.x + 160,
        y2: uc.y + 45,
      });
      if (!r.success) {
        console.error(`  ✗ Failed to create use case "${uc.name}": ${r.error}`);
        ucViews.push(null);
      } else {
        ucViews.push(r.data.view._id);
        console.log(`  ✓ Use Case: ${uc.name} -> view ${r.data.view._id}`);
      }
      await wait(100);
    }

    // Create edges
    let edgeSuccess = 0;
    let edgeFail = 0;
    for (let e = 0; e < diagram.edges.length; e++) {
      const edge = diagram.edges[e];
      let tailId, headId;

      // Resolve from/to indices to view IDs
      if (typeof edge.from === 'number') {
        tailId = actorViews[edge.from] || (actorViews[edge.from] === undefined ? null : null);
        // If from is an actor index that's null, skip
        if (!tailId) {
          // Try use case views for edge.from
          tailId = ucViews[edge.from];
        }
      } else {
        tailId = edge.from;
      }

      if (typeof edge.to === 'number') {
        headId = ucViews[edge.to];
        if (!headId) {
          headId = actorViews[edge.to];
        }
      } else {
        headId = edge.to;
      }

      if (!tailId || !headId) {
        edgeFail++;
        continue;
      }

      let edgeType;
      switch (edge.type) {
        case 'general':
          edgeType = 'UMLGeneralization';
          break;
        case 'extend':
          edgeType = 'UMLExtend';
          break;
        default:
          edgeType = 'UMLAssociation';
      }

      r = await post('/create_edge_with_view', {
        type: edgeType,
        parentId: modelId,
        diagramId: diagramId,
        tailViewId: tailId,
        headViewId: headId,
      });
      if (r.success) {
        edgeSuccess++;
      } else {
        edgeFail++;
      }
      await wait(80);
    }
    console.log(`  Edges: ${edgeSuccess} success, ${edgeFail} failed`);
  }

  // Step 5: Save project
  console.log('\n--- Saving project ---');
  r = await post('/save_project_as', { filename: OUTPUT_PATH });
  if (r.success) {
    console.log(`✓ Project saved to: ${OUTPUT_PATH}`);
  } else {
    console.error(`✗ Failed to save: ${r.error}`);
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Diagrams: ${totalDiagrams}`);
  let totalActors = 0, totalUCs = 0, totalEdges = 0;
  for (const d of DIAGRAMS) {
    totalActors += d.actors.length;
    totalUCs += d.usecases.length;
    totalEdges += d.edges.length;
  }
  console.log(`  Actors: ${totalActors}`);
  console.log(`  Use Cases: ${totalUCs}`);
  console.log(`  Edges: ${totalEdges}`);
  console.log(`  Output: ${OUTPUT_PATH}`);
  console.log('═══════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('\n✗ Fatal:', err.message);
  process.exit(1);
});
