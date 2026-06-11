/**
 * generate-data-dictionary.js — Sinh tài liệu Data Dictionary cho IlluWrl.
 *
 * Đọc định nghĩa entity từ generate-erd.js và xuất file markdown
 * mô tả chi tiết từng trường cùng các quan hệ giữa các entity.
 */

const fs = require('fs');
const path = require('path');
const { entities, relationships } = require('./generate-erd.js');

// ---------------------------------------------------------------------------
// Bản dịch comment entity (tiếng Việt)
// ---------------------------------------------------------------------------
const entityCommentsVI = {
  USER: 'Tài khoản người dùng — định danh trung tâm của toàn bộ nền tảng',
  FOLLOW: 'Quan hệ theo dõi giữa người dùng với người dùng',
  USER_BLOCK: 'Quan hệ chặn giữa người dùng với người dùng',
  MESSAGE: 'Tin nhắn trực tiếp giữa các người dùng',
  NOTIFICATION: 'Thông báo cho người dùng về các sự kiện trên nền tảng',
  ARTWORK: 'Nội dung chính — tranh minh hoạ, manga, GIF, tiểu thuyết',
  TAG: 'Thẻ nội dung với bản dịch đa ngôn ngữ',
  COMMENT: 'Bình luận trên tác phẩm (hỗ trợ trả lời lồng nhau)',
  LIKE: 'Lượt thích trên tác phẩm (duy nhất theo người dùng + tác phẩm)',
  BOOKMARK: 'Đánh dấu với phân loại theo thư mục',
  CHAPTER: 'Chương tiểu thuyết theo từng tác phẩm',
  READING_PROGRESS: 'Tiến độ đọc của người dùng trên các chương tác phẩm',
  ARTWORK_REPORT: 'Báo cáo kiểm duyệt đối với tác phẩm',
  REQUEST_TERM: 'Điều khoản ủy thác do người sáng tạo thiết lập',
  REQUEST: 'Yêu cầu ủy thác cá nhân giữa người dùng',
  REQUEST_CHAT_MESSAGE: 'Tin nhắn trò chuyện trong một yêu cầu ủy thác',
  REQUEST_EVENT: 'Nhật ký kiểm tra state machine cho yêu cầu ủy thác',
  REQUEST_REVISION: 'Yêu cầu chỉnh sửa trên một ủy thác (tối đa 2 vòng)',
};

// ---------------------------------------------------------------------------
// Bản dịch tên entity thành tiếng Việt (dùng cho entity sections)
// ---------------------------------------------------------------------------
function entityLabelVI(label) {
  const map = {
    USER: 'Người dùng',
    FOLLOW: 'Theo dõi',
    USER_BLOCK: 'Chặn người dùng',
    MESSAGE: 'Tin nhắn',
    NOTIFICATION: 'Thông báo',
    ARTWORK: 'Tác phẩm',
    TAG: 'Thẻ',
    COMMENT: 'Bình luận',
    LIKE: 'Lượt thích',
    BOOKMARK: 'Đánh dấu',
    CHAPTER: 'Chương',
    READING_PROGRESS: 'Tiến độ đọc',
    ARTWORK_REPORT: 'Báo cáo tác phẩm',
    REQUEST_TERM: 'Điều khoản ủy thác',
    REQUEST: 'Yêu cầu ủy thác',
    REQUEST_CHAT_MESSAGE: 'Tin nhắn ủy thác',
    REQUEST_EVENT: 'Sự kiện ủy thác',
    REQUEST_REVISION: 'Chỉnh sửa ủy thác',
  };
  return map[label] || label;
}

// ---------------------------------------------------------------------------
// Mô tả thực thể dạng đoạn văn (tiếng Việt)
// ---------------------------------------------------------------------------
const entityDescriptionsVI = {
  USER: 'Thực thể **USER** là thực thể trung tâm của toàn bộ nền tảng, lưu trữ tất cả thông tin liên quan đến tài khoản người dùng như tên đăng nhập, email, mật khẩu đã mã hoá, vai trò (người dùng/quản trị viên), tiểu sử, avatar và các thiết lập cá nhân.',
  FOLLOW: 'Thực thể **FOLLOW** lưu trữ mối quan hệ theo dõi giữa các người dùng, cho biết ai đang theo dõi ai trên nền tảng.',
  USER_BLOCK: 'Thực thể **USER_BLOCK** lưu trữ mối quan hệ chặn giữa các người dùng, cho biết ai chặn ai và lý do chặn nhằm kiểm soát tương tác.',
  MESSAGE: 'Thực thể **MESSAGE** lưu trữ các tin nhắn trực tiếp giữa người dùng với người dùng, bao gồm nội dung văn bản và tệp đính kèm.',
  NOTIFICATION: 'Thực thể **NOTIFICATION** lưu trữ các thông báo gửi đến người dùng khi có sự kiện xảy ra như thích, bình luận, theo dõi hoặc tin nhắn mới.',
  ARTWORK: 'Thực thể **ARTWORK** là thực thể nội dung chính, lưu trữ tất cả các tác phẩm bao gồm tranh minh hoạ, manga, ảnh động GIF và tiểu thuyết, với đầy đủ thông tin như tiêu đề, mô tả, tập tin, thể loại và trạng thái kiểm duyệt.',
  TAG: 'Thực thể **TAG** lưu trữ các thẻ nội dung với bản dịch đa ngôn ngữ, giúp phân loại và tìm kiếm tác phẩm theo chủ đề.',
  COMMENT: 'Thực thể **COMMENT** lưu trữ các bình luận của người dùng trên tác phẩm, hỗ trợ trả lời lồng nhau với cấu trúc bình luận cha-con.',
  LIKE: 'Thực thể **LIKE** lưu trữ các lượt thích của người dùng trên tác phẩm, đảm bảo mỗi người dùng chỉ thích một tác phẩm một lần.',
  BOOKMARK: 'Thực thể **BOOKMARK** lưu trữ các đánh dấu tác phẩm của người dùng, được phân loại theo thư mục (public, private, v.v.).',
  CHAPTER: 'Thực thể **CHAPTER** lưu trữ các chương của tác phẩm dạng tiểu thuyết, bao gồm nội dung văn bản, số thứ tự chương và các tập tin đính kèm hình ảnh.',
  READING_PROGRESS: 'Thực thể **READING_PROGRESS** theo dõi tiến độ đọc của người dùng trên từng chương, ghi nhận vị trí đọc hiện tại và trạng thái hoàn thành.',
  ARTWORK_REPORT: 'Thực thể **ARTWORK_REPORT** lưu trữ các báo cáo kiểm duyệt đối với tác phẩm, bao gồm lý do báo cáo, người báo cáo và trạng thái xử lý.',
  REQUEST_TERM: 'Thực thể **REQUEST_TERM** lưu trữ các điều khoản ủy thác do người sáng tạo thiết lập, bao gồm loại dịch vụ, giá cả và thời gian thực hiện.',
  REQUEST: 'Thực thể **REQUEST** lưu trữ các yêu cầu ủy thác cá nhân giữa người dùng, bao gồm trạng thái, mô tả công việc và thông tin thanh toán.',
  REQUEST_CHAT_MESSAGE: 'Thực thể **REQUEST_CHAT_MESSAGE** lưu trữ các tin nhắn trao đổi trong quá trình thực hiện yêu cầu ủy thác.',
  REQUEST_EVENT: 'Thực thể **REQUEST_EVENT** lưu trữ nhật ký các sự kiện trên yêu cầu ủy thác, bao gồm thay đổi trạng thái, gia hạn và báo cáo.',
  REQUEST_REVISION: 'Thực thể **REQUEST_REVISION** lưu trữ các yêu cầu chỉnh sửa trên một ủy thác, giới hạn tối đa 2 vòng chỉnh sửa.',
};

// ---------------------------------------------------------------------------
// Parse field string thành cấu trúc
// ---------------------------------------------------------------------------
function parseField(fieldStr) {
  const tokens = [];
  let current = '';
  let inQuote = false;
  for (const ch of fieldStr) {
    if (ch === '"') {
      inQuote = !inQuote;
      if (!inQuote && current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }
    if (ch === ' ' && !inQuote) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }
    current += ch;
  }
  if (current) tokens.push(current);

  if (tokens.length < 2) return { type: '—', name: tokens[0] || '—', constraints: '—', description: '—' };

  const type = tokens[0];
  const name = tokens[1];
  const rest = tokens.slice(2);

  const constraints = [];
  const descParts = [];

  for (const token of rest) {
    if (/^[A-Z]{2,}$/.test(token)) {
      constraints.push(token);
    } else {
      descParts.push(token);
    }
  }

  // Dịch description FK
  let description = descParts.length > 0 ? descParts.join(' ') : '—';
  description = description
    .replace(/^ref User/, 'Tham chiếu User')
    .replace(/^ref Artwork/, 'Tham chiếu Artwork')
    .replace(/^ref Request/, 'Tham chiếu Request')
    .replace(/^ref Comment/, 'Tham chiếu Comment')
    .replace(/^ref Chapter/, 'Tham chiếu Chapter')
    .replace(/^ref Tag(\[\])?/, 'Tham chiếu Tag$1')
    .replace(/^ref RequestTerm/, 'Tham chiếu RequestTerm')
    .replace(/^embedded/, 'Nhúng')
    .replace(/^mixed/, 'Linh hoạt')
    .replace(/--/, '—')
    .replace(/unique per artwork/, 'duy nhất trong tác phẩm')
    .replace(/unique \(login email\)/, 'duy nhất (email đăng nhập)')
    .replace(/unique \(display handle\)/, 'duy nhất (tên hiển thị)')
    .replace(/hashed/, 'đã mã hoá')
    .replace(/user \| admin/, 'người dùng | quản trị viên')
    .replace(/all\^Hr-18\^Hr-18g/, 'tất cả | r-18 | r-18g')
    .replace(/1\|2/, '1 | 2');

  return { type, name, constraints: constraints.length > 0 ? constraints.join(', ') : '—', description };
}

// ---------------------------------------------------------------------------
// Xây dựng đoạn văn mô tả quan hệ (tiếng Việt, dạng hardcoded)
// ---------------------------------------------------------------------------
function buildRelationshipParagraphs() {
  const lines = [];

  lines.push('## Các quan hệ');
  lines.push('');
  lines.push('Mô hình dữ liệu mức quan niệm gồm có 18 thực thể. Trong đó, thực thể **USER** (Người dùng) là thực thể trung tâm, với khoá chính là `_id`.');
  lines.push('');

  // ── USER relationships ──
  lines.push('- **USER — ARTWORK**: Thực thể USER liên kết với thực thể ARTWORK (Tác phẩm) để cho biết người dùng tạo ra những tác phẩm nào. Một người dùng có thể tạo nhiều tác phẩm, và mỗi tác phẩm thuộc về một người dùng. Ngoài ra, người dùng có vai trò kiểm duyệt có thể ẩn tác phẩm.');
  lines.push('- **USER — COMMENT**: Thực thể USER liên kết với thực thể COMMENT (Bình luận) để cho biết ai là người viết bình luận. Một người dùng có thể viết nhiều bình luận.');
  lines.push('- **USER — LIKE**: Thực thể USER liên kết với thực thể LIKE (Lượt thích) để cho biết người dùng thích những tác phẩm nào.');
  lines.push('- **USER — BOOKMARK**: Thực thể USER liên kết với thực thể BOOKMARK (Đánh dấu) để cho biết người dùng đánh dấu những tác phẩm nào.');
  lines.push('- **USER — FOLLOW**: Thực thể USER liên kết với thực thể FOLLOW (Theo dõi) để cho biết người dùng theo dõi những ai và được ai theo dõi. Quan hệ này có hai chiều: follows as follower (người dùng là người theo dõi) và is followed as following (người dùng là người được theo dõi).');
  lines.push('- **USER — NOTIFICATION**: Thực thể USER liên kết với thực thể NOTIFICATION (Thông báo) để cho biết người dùng nhận thông báo và là tác nhân kích hoạt thông báo.');
  lines.push('- **USER — MESSAGE**: Thực thể USER liên kết với thực thể MESSAGE (Tin nhắn) để cho biết người dùng gửi và nhận tin nhắn trực tiếp.');
  lines.push('- **USER — USER_BLOCK**: Thực thể USER liên kết với thực thể USER_BLOCK (Chặn người dùng) để cho biết người dùng chặn ai và bị ai chặn.');
  lines.push('- **USER — ARTWORK_REPORT**: Thực thể USER liên kết với thực thể ARTWORK_REPORT (Báo cáo tác phẩm) để cho biết người dùng báo cáo hoặc xử lý báo cáo tác phẩm.');
  lines.push('- **USER — REQUEST_TERM**: Thực thể USER liên kết với thực thể REQUEST_TERM (Điều khoản ủy thác) để cho biết người dùng tạo ra các điều khoản nhận ủy thác.');
  lines.push('- **USER — REQUEST**: Thực thể USER liên kết với thực thể REQUEST (Yêu cầu ủy thác) theo hai vai trò: là người sáng tạo/cung cấp dịch vụ hoặc là người yêu cầu/khách hàng.');
  lines.push('- **USER — REQUEST_CHAT_MESSAGE**: Thực thể USER liên kết với thực thể REQUEST_CHAT_MESSAGE (Tin nhắn ủy thác) để cho biết người dùng gửi tin nhắn trong quá trình ủy thác.');
  lines.push('- **USER — REQUEST_EVENT**: Thực thể USER liên kết với thực thể REQUEST_EVENT (Sự kiện ủy thác) để ghi lại các thao tác của người dùng trên yêu cầu ủy thác.');
  lines.push('- **USER — REQUEST_REVISION**: Thực thể USER liên kết với thực thể REQUEST_REVISION (Chỉnh sửa ủy thác) để cho biết người dùng yêu cầu chỉnh sửa.');
  lines.push('- **USER — READING_PROGRESS**: Thực thể USER liên kết với thực thể READING_PROGRESS (Tiến độ đọc) để theo dõi tiến độ đọc tác phẩm của người dùng.');
  lines.push('');

  // ── ARTWORK relationships ──
  lines.push('- **ARTWORK — TAG**: Thực thể ARTWORK (Tác phẩm) liên kết với thực thể TAG (Thẻ) qua quan hệ nhiều-nhiều tagged with để cho biết tác phẩm được gắn những thẻ nào và ngược lại.');
  lines.push('- **ARTWORK — COMMENT**: Thực thể ARTWORK liên kết với thực thể COMMENT (Bình luận) để cho biết tác phẩm có những bình luận nào.');
  lines.push('- **ARTWORK — LIKE**: Thực thể ARTWORK liên kết với thực thể LIKE (Lượt thích) để cho biết tác phẩm nhận được những lượt thích nào.');
  lines.push('- **ARTWORK — BOOKMARK**: Thực thể ARTWORK liên kết với thực thể BOOKMARK (Đánh dấu) để cho biết tác phẩm được người dùng đánh dấu như thế nào.');
  lines.push('- **ARTWORK — NOTIFICATION**: Thực thể ARTWORK liên kết với thực thể NOTIFICATION (Thông báo) để kích hoạt các thông báo liên quan đến tác phẩm.');
  lines.push('- **ARTWORK — ARTWORK_REPORT**: Thực thể ARTWORK liên kết với thực thể ARTWORK_REPORT (Báo cáo tác phẩm) để cho biết tác phẩm bị báo cáo vì những lý do gì.');
  lines.push('- **ARTWORK — CHAPTER**: Thực thể ARTWORK liên kết với thực thể CHAPTER (Chương) để cho biết tác phẩm (tiểu thuyết) gồm có những chương nào.');
  lines.push('- **ARTWORK — READING_PROGRESS**: Thực thể ARTWORK liên kết với thực thể READING_PROGRESS (Tiến độ đọc) để theo dõi tiến độ đọc của người dùng trên tác phẩm.');
  lines.push('');

  // ── CHAPTER relationships ──
  lines.push('- **CHAPTER — READING_PROGRESS**: Thực thể CHAPTER (Chương) liên kết với thực thể READING_PROGRESS (Tiến độ đọc) để cho biết mỗi chương có tiến độ đọc tương ứng của từng người dùng.');
  lines.push('');

  // ── REQUEST / COMMISSION relationships ──
  lines.push('- **REQUEST_TERM — REQUEST**: Thực thể REQUEST_TERM (Điều khoản ủy thác) liên kết với thực thể REQUEST (Yêu cầu ủy thác) để định nghĩa các yêu cầu dựa trên điều khoản đó. Một điều khoản có thể có nhiều yêu cầu.');
  lines.push('- **REQUEST — REQUEST_CHAT_MESSAGE**: Thực thể REQUEST liên kết với thực thể REQUEST_CHAT_MESSAGE (Tin nhắn ủy thác) để cho biết yêu cầu ủy thác có những tin nhắn trao đổi nào.');
  lines.push('- **REQUEST — REQUEST_EVENT**: Thực thể REQUEST liên kết với thực thể REQUEST_EVENT (Sự kiện ủy thác) để ghi lại nhật ký các sự kiện (thay đổi trạng thái, gia hạn, báo cáo) trên yêu cầu ủy thác.');
  lines.push('- **REQUEST — REQUEST_REVISION**: Thực thể REQUEST liên kết với thực thể REQUEST_REVISION (Chỉnh sửa ủy thác) để cho biết yêu cầu ủy thác có những lần chỉnh sửa nào (tối đa 2 vòng).');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Xây dựng nội dung markdown
// ---------------------------------------------------------------------------
function buildDataDictionary() {
  const parts = [];
  const now = new Date().toISOString().split('T')[0];

  // ── Header ──
  parts.push('# IlluWrl — Data Dictionary (Tiếng Việt)');
  parts.push('');
  parts.push(`> **Ngày tạo:** ${now}`);
  parts.push(`> **Số thực thể:** ${entities.length}`);
  parts.push(`> **Số quan hệ:** ${relationships.length}`);
  parts.push('> **Mô tả:** Tài liệu tham chiếu chi tiết tất cả trường (field) của các Mongoose model');
  parts.push('');
  parts.push('---');
  parts.push('');

  // ── Mục lục ──
  parts.push('## Mục lục');
  parts.push('');
  parts.push('### Thực thể');
  for (const entity of entities) {
    const viName = entityLabelVI(entity.label);
    parts.push(`- [${entity.label} — ${viName}](#${entity.label.toLowerCase()})`);
  }
  parts.push('');
  parts.push('### Quan hệ');
  parts.push('- [Các quan hệ](#các-quan-hệ)');
  parts.push('');
  parts.push('---');
  parts.push('');

  // ── Entity ──
  for (const entity of entities) {
    const viName = entityLabelVI(entity.label);
    const viComment = entityCommentsVI[entity.label] || entity.comment;
    const viDescription = entityDescriptionsVI[entity.label] || '';
    parts.push(`## ${entity.label} — ${viName}`);
    parts.push('');
    parts.push(`> ${viComment}`);
    parts.push('');
    if (viDescription) {
      parts.push(viDescription);
      parts.push('');
    }
    parts.push('| Trường | Kiểu | Ràng buộc | Mô tả |');
    parts.push('|--------|------|-----------|-------|');

    for (const field of entity.fields) {
      const { type, name, constraints, description } = parseField(field);
      parts.push(`| \`${name}\` | ${type} | ${constraints} | ${description} |`);
    }
    parts.push('');
  }

  // ── Quan hệ ──
  parts.push('---');
  parts.push('');
  parts.push(buildRelationshipParagraphs());

  // ── Footer ──
  parts.push('---');
  parts.push(`*Được tạo bởi \`scripts/generate-data-dictionary.js\` vào ${now} — ${entities.length} thực thể, ${relationships.length} quan hệ.*`);
  parts.push('');

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Build MongoDB Schema (CSV-like table for each collection)
// ---------------------------------------------------------------------------
function buildMongoDBSchema() {
  const parts = [];
  const now = new Date().toISOString().split('T')[0];

  parts.push('# IlluWrl — MongoDB Schema (Tiếng Việt)');
  parts.push('');
  parts.push(`> **Ngày tạo:** ${now}`);
  parts.push(`> **Số collection:** ${entities.length}`);
  parts.push('> **Mô tả:** Chi tiết các collection trong MongoDB, bao gồm kiểu dữ liệu, khoá chính, khoá ngoại, ràng buộc Not Null và diễn giải.');
  parts.push('');
  parts.push('---');
  parts.push('');

  // Map type abbreviations
  const typeMap = {
    ObjectId: 'objectId',
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    date: 'date',
    datetime: 'date',
    array: 'array',
    json: 'object',
  };

  for (const entity of entities) {
    const viName = entityLabelVI(entity.label);
    parts.push(`## ${entity.label} — ${viName}`);
    parts.push('');
    parts.push('| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |');
    parts.push('|----------------|-------------|:----------:|:----------:|:--:|-----------|');

    for (const field of entity.fields) {
      const { type, name, constraints, description } = parseField(field);
      const mongoType = typeMap[type] || type;
      const isPK = constraints.includes('PK') ? 'X' : '';
      const isFK = constraints.includes('FK') ? 'X' : '';
      // NN: all fields are essentially required in Mongoose unless explicitly nullable
      // _id is always required, FK fields are typically required
      const isNN = (name === '_id' || isFK) ? 'X' : '';
      
      // Clean up description: translate remaining English descriptions to Vietnamese
      // Order matters: more specific patterns BEFORE generic ones.
      // NOTE: parseField() already did /^ref User/ -> 'Tham chiếu User', so
      // we match the ALREADY-TRANSLATED prefix here.
      let viDesc = description
        // Specific FK descriptions first (match after parseField's generic translation)
        .replace('Tham chiếu User — who follows', 'Người theo dõi')
        .replace('Tham chiếu User — being followed', 'Người được theo dõi')
        .replace('Tham chiếu User — recipient', 'Người nhận thông báo')
        .replace('Tham chiếu User — trigger', 'Người kích hoạt thông báo')
        .replace('Tham chiếu Artwork — optional context', 'Tác phẩm liên quan (tuỳ chọn)')
        .replace('Tham chiếu User — creator', 'Người sáng tạo')
        .replace('Tham chiếu User — moderator', 'Người kiểm duyệt')
        .replace('Tham chiếu User — author', 'Tác giả bình luận')
        .replace('Tham chiếu User — provider', 'Người cung cấp dịch vụ')
        .replace('Tham chiếu User — client', 'Khách hàng')
        // Then other descriptions (non-FK)
        .replace('unique login email', 'Email đăng nhập duy nhất')
        .replace('unique display handle', 'Tên hiển thị duy nhất')
        .replace('hashed', 'Đã mã hoá')
        .replace('user | admin', 'Người dùng | Quản trị viên')
        .replace('embedded', 'Nhúng')
        .replace('Mixed', 'Linh hoạt')
        .replace('all|r-18|r-18g', 'Tất cả | R-18 | R-18G')
        .replace('1|2 — unique per artwork', '1 | 2 — duy nhất trong tác phẩm')
        .replace('1|2 — unique per request', '1 | 2 — duy nhất trong yêu cầu')
        .replace('unique per artwork', 'Duy nhất trong tác phẩm')
        .replace('unique per request', 'Duy nhất trong yêu cầu');

      if (viDesc === '—' || viDesc === '') {
        viDesc = '—';
      }

      parts.push(`| \`${name}\` | ${mongoType} | ${isPK} | ${isFK} | ${isNN} | ${viDesc} |`);
    }
    parts.push('');
  }

  parts.push('---');
  parts.push(`*Được tạo bởi \`scripts/generate-data-dictionary.js\` vào ${now} — ${entities.length} collection.*`);
  parts.push('');

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Ghi file
// ---------------------------------------------------------------------------
const outputPath = path.resolve(__dirname, '..', 'docs', 'data-dictionary.md');
const content = buildDataDictionary();

fs.writeFileSync(outputPath, content, 'utf-8');
console.log(`✅ Data dictionary (Tiếng Việt) generated: ${outputPath}`);
console.log(`   • Entities: ${entities.length}`);
console.log(`   • Relationships: ${relationships.length}`);
console.log(`   • File size: ${(Buffer.byteLength(content) / 1024).toFixed(1)} KB`);

// ── Write MongoDB schema file ──
const schemaOutputPath = path.resolve(__dirname, '..', 'docs', 'mongodb-schema.md');
const schemaContent = buildMongoDBSchema();

fs.writeFileSync(schemaOutputPath, schemaContent, 'utf-8');
console.log(`✅ MongoDB Schema generated: ${schemaOutputPath}`);
console.log(`   • Collections: ${entities.length}`);
console.log(`   • File size: ${(Buffer.byteLength(schemaContent) / 1024).toFixed(1)} KB`);
