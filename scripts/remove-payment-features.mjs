/**
 * remove-payment-features.mjs
 *
 * Removes ALL payment/money/premium-related features from the project
 * and backs them up to E:\HocTap\CT550-payment-backup\
 */

import fs from 'fs';
import path from 'path';

const PROJECT = 'E:/HocTap/CT550';
const BACKUP = 'E:/HocTap/CT550-payment-backup';

let copiedCount = 0;
let deletedCount = 0;
let modifiedCount = 0;
const errors = [];

function copyToBackup(relativePath) {
  const src = path.join(PROJECT, relativePath);
  const dest = path.join(BACKUP, relativePath);
  if (!fs.existsSync(src)) {
    console.log('  [SKIP] Not found: ' + relativePath);
    return false;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  copiedCount++;
  console.log('  [COPY] ' + relativePath);
  return true;
}

function copyDirToBackup(relativePath) {
  const src = path.join(PROJECT, relativePath);
  const dest = path.join(BACKUP, relativePath);
  if (!fs.existsSync(src)) {
    console.log('  [SKIP] Not found dir: ' + relativePath);
    return false;
  }
  function copyRecursive(s, d) {
    fs.mkdirSync(d, { recursive: true });
    for (const entry of fs.readdirSync(s, { withFileTypes: true })) {
      const sp = path.join(s, entry.name);
      const dp = path.join(d, entry.name);
      if (entry.isDirectory()) copyRecursive(sp, dp);
      else { fs.copyFileSync(sp, dp); copiedCount++; }
    }
  }
  copyRecursive(src, dest);
  console.log('  [COPY-DIR] ' + relativePath);
  return true;
}

function deleteFromProject(relativePath) {
  const fullPath = path.join(PROJECT, relativePath);
  if (!fs.existsSync(fullPath)) {
    console.log('  [SKIP] Not found for delete: ' + relativePath);
    return false;
  }
  fs.rmSync(fullPath, { recursive: true });
  deletedCount++;
  console.log('  [DELETE] ' + relativePath);
  return true;
}

function modifyFile(relativePath, transformFn, description) {
  const fullPath = path.join(PROJECT, relativePath);
  if (!fs.existsSync(fullPath)) {
    console.log('  [SKIP] Not found for modify: ' + relativePath);
    return false;
  }
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const original = content;
    content = transformFn(content);
    if (content !== original) {
      fs.writeFileSync(fullPath, content, 'utf8');
      modifiedCount++;
      console.log('  [MODIFY] ' + relativePath + ' (' + description + ')');
      return true;
    } else {
      console.log('  [NOCHG] ' + relativePath);
      return false;
    }
  } catch (err) {
    errors.push('Error modifying ' + relativePath + ': ' + err.message);
    console.log('  [ERROR] ' + relativePath + ': ' + err.message);
    return false;
  }
}

// ─── Step 0: Create backup directories ──────────────────────────────────────

console.log('');
console.log('=== Step 0: Creating backup directory structure ===');
fs.mkdirSync(BACKUP, { recursive: true });
['backend/models','backend/routes','backend/controllers','backend/utils','backend/tests',
 'frontend/src/views','frontend/src/components/admin','frontend/src/components/premium',
 'frontend/src/constants','docs/diagrams','docs/plan','docs/reports','scripts'
].forEach(d => fs.mkdirSync(path.join(BACKUP, d), { recursive: true }));

// ─── Step 1: Backend files ──────────────────────────────────────────────────

console.log('');
console.log('=== Step 1: Backend files ===');

['Payment.js','PaymentConfig.js','Invoice.js','Payout.js','PayoutMethod.js',
 'CreatorBalance.js','EscrowTransaction.js'
].forEach(f => { copyToBackup('backend/models/'+f); deleteFromProject('backend/models/'+f); });

copyToBackup('backend/routes/payment.routes.js'); deleteFromProject('backend/routes/payment.routes.js');
copyToBackup('backend/controllers/payment.controller.js'); deleteFromProject('backend/controllers/payment.controller.js');
copyToBackup('backend/utils/paymentValidation.js'); deleteFromProject('backend/utils/paymentValidation.js');
copyToBackup('backend/tests/paymentValidation.test.js'); deleteFromProject('backend/tests/paymentValidation.test.js');

// ─── Step 2: Frontend files ─────────────────────────────────────────────────

console.log('');
console.log('=== Step 2: Frontend files ===');

copyToBackup('frontend/src/views/PaymentSandboxView.vue'); deleteFromProject('frontend/src/views/PaymentSandboxView.vue');
copyToBackup('frontend/src/views/PremiumView.vue'); deleteFromProject('frontend/src/views/PremiumView.vue');
copyToBackup('frontend/src/components/admin/AdminPaymentManagementPanel.vue');
deleteFromProject('frontend/src/components/admin/AdminPaymentManagementPanel.vue');
copyDirToBackup('frontend/src/components/premium'); deleteFromProject('frontend/src/components/premium');
copyToBackup('frontend/src/constants/premium.js'); deleteFromProject('frontend/src/constants/premium.js');

// ─── Step 3: Docs files (copy to backup, keep in project where noted) ──────

console.log('');
console.log('=== Step 3: Docs files ===');

copyToBackup('docs/request-payment-prd.md');
copyDirToBackup('docs/plan/premium-ui-20260428');
copyToBackup('docs/reports/auth-test-accounts-2026-04-05.md');
copyToBackup('scripts/staruml-usecase-diagrams.mjs'); deleteFromProject('scripts/staruml-usecase-diagrams.mjs');
// IlluWrl-UseCase.mdj may not exist in diagrams
copyToBackup('docs/diagrams/IlluWrl-UseCase.mdj'); deleteFromProject('docs/diagrams/IlluWrl-UseCase.mdj');


// ─── Step 4a: backend/server.js ─────────────────────────────────────────────

console.log('');
console.log('=== Step 4: Modifying files ===');

modifyFile('backend/server.js', (content) => {
  let r = content;
  r = r.replace("const paymentRoutes = require('./routes/payment.routes');\n", '');
  r = r.replace("app.use('/api/payments', paymentRoutes);\n", '');
  return r;
}, 'remove payment route imports');

// ─── Step 4b: backend/models/Request.js ─────────────────────────────────────

modifyFile('backend/models/Request.js', (content) => {
  let r = content;
  // Remove escrowSchema
  const escStart = r.indexOf('const escrowSchema = mongoose.Schema({');
  if (escStart >= 0) {
    const escEnd = r.indexOf('}, { _id: false });', escStart);
    if (escEnd >= 0) {
      let after = escEnd + 19;
      while (after < r.length && (r[after] === '\n' || r[after] === '\r')) after++;
      r = r.slice(0, escStart) + r.slice(after);
    }
  }
  // Remove escrow field
  r = r.replace(/    escrow: \{\s*\n\s+type: escrowSchema,\s*\n\s+default: \(\) => \(\{\}\),\s*\n    \},\s*\n/g, '');
  // Remove payment field
  r = r.replace(/    payment: \{\s*\n\s+type: mongoose\.Schema\.Types\.ObjectId,\s*\n\s+ref: 'Payment',\s*\n\s+default: null,\s*\n    \},\s*\n/g, '');
  // Remove paymentStatus field
  r = r.replace(/    paymentStatus: \{\s*\n\s+type: String,\s*\n\s+enum: \['unpaid', 'requires_action', 'held', 'refunded', 'released', 'failed'\],\s*\n\s+default: 'unpaid',\s*\n\s+index: true,\s*\n    \},\s*\n/g, '');
  return r;
}, 'remove escrow/payment/paymentStatus from Request model');


// ─── Step 4c: backend/controllers/request.controller.js ──────────────────────

modifyFile('backend/controllers/request.controller.js', (content) => {
  let r = content;

  // Remove escrow creation in createRequest
  r = r.replace(/,\s*\n\s+escrow: \{\s*\n\s+status: 'held',\s*\n\s+platformFeeRate: 0\.12,\s*\n\s+\}/g, '');

  // Remove escrow metadata in createRequest event log
  r = r.replace(/,\s*metadata:\s*\{ escrowStatus: 'held' \}/, '');

  // Remove escrow lines from rejectRequest
  r = r.replace(/\s*\n\s+request\.escrow\.status = 'refunded';\s*\n\s+request\.escrow\.refundedAt = new Date\(\);/g, '');

  // Remove escrow lines from cancelRequest
  const cancelLines = /(\s*\n\s+request\.escrow\.status = 'refunded';\s*\n\s+request\.escrow\.refundedAt = new Date\(\);\s*\n\s+request\.chatClosedAt = new Date\(\);)/g;
  r = r.replace(cancelLines, '\n    request.chatClosedAt = new Date();');

  // Remove escrow release in completeRequest (fee calc + escrow assignments)
  r = r.replace(/\s*\n\s+const fee = Math\.round\(request\.proposedAmount \* request\.escrow\.platformFeeRate \* 100\) \/ 100;/g, '');
  r = r.replace(/\s*\n\s+request\.escrow\.platformFeeAmount = fee;/g, '');
  r = r.replace(/\s*\n\s+request\.escrow\.creatorPayoutAmount = Math\.max\(request\.proposedAmount - fee, 0\);/g, '');
  r = r.replace(/\s*\n\s+request\.escrow\.status = 'released';/g, '');
  r = r.replace(/\s*\n\s+request\.escrow\.releasedAt = new Date\(\);/g, '');

  // Remove escrow release in approveRequest
  const approveBlock = /(\s*\n\s+const fee = Math\.round\(request\.proposedAmount \* request\.escrow\.platformFeeRate \* 100\) \/ 100;\s*\n\s+request\.escrow\.platformFeeAmount = fee;\s*\n\s+request\.escrow\.creatorPayoutAmount = Math\.max\(request\.proposedAmount - fee, 0\);\s*\n\s+request\.escrow\.status = 'released';\s*\n\s+request\.escrow\.releasedAt = new Date\(\);)/g;
  r = r.replace(approveBlock, '');

  // Remove metadata from completeRequest transition
  r = r.replace(/,\s*\n\s+metadata: \{ platformFeeAmount: fee \}/, '');

  // Update notification message in rejectRequest
  r = r.replace(/Your Request "\$\{request\.title\}" was declined and refunded\./, 'Your Request "" was declined.');

  return r;
}, 'remove escrow logic from request controller');


// ─── Step 4d: frontend/src/services/api.js ──────────────────────────────────

modifyFile('frontend/src/services/api.js', (content) => {
  let r = content;

  // Remove adminApi.getPayments block (including comment)
  r = r.replace(/  \/\/ Payment management\s*\n\s+getPayments: \(params = \{\}\) => api\.get\('\/payments\/admin\/list', \{ params \}\),\s*\n/g, '');

  // Remove paymentApi object
  const payApiStart = r.indexOf("export const paymentApi = {");
  if (payApiStart >= 0) {
    const payApiEnd = r.indexOf("};", payApiStart);
    if (payApiEnd >= 0) {
      let endLine = payApiEnd + 2;
      while (endLine < r.length && (r[endLine] === '\n' || r[endLine] === '\r')) endLine++;
      r = r.slice(0, payApiStart) + r.slice(endLine);
    }
  }

  // Remove exported wrapper functions for payment
  r = r.replace(/export const createPaymentIntent = \(payload\) => paymentApi\.createIntent\(payload\);\s*\n/g, '');
  r = r.replace(/export const createQrPaymentIntent = \(payload\) => paymentApi\.createQrIntent\(payload\);\s*\n/g, '');
  r = r.replace(/export const getMyPayments = \(params = \{\}\) => paymentApi\.getMine\(params\);\s*\n/g, '');
  r = r.replace(/export const getCreatorBalance = \(\) => paymentApi\.getBalance\(\);\s*\n/g, '');

  return r;
}, 'remove payment API references');

// ─── Step 4e: frontend/src/router/index.js ──────────────────────────────────

modifyFile('frontend/src/router/index.js', (content) => {
  let r = content;
  r = r.replace("import PremiumView from '../views/PremiumView.vue'\n", '');
  r = r.replace("import PaymentSandboxView from '../views/PaymentSandboxView.vue'\n", '');
  r = r.replace("  { path: '/premium', name: 'premium', component: PremiumView },\n", '');
  r = r.replace("  { path: '/payments/sandbox', name: 'payment-sandbox', component: PaymentSandboxView, meta: { requiresAuth: true } },\n", '');
  return r;
}, 'remove premium/payment routes');


// ─── Step 4f: frontend/src/views/AdminManagementView.vue ────────────────────

modifyFile('frontend/src/views/AdminManagementView.vue', (content) => {
  let r = content;
  // Remove AdminPaymentManagementPanel from import
  r = r.replace(',\n  AdminPaymentManagementPanel', '');
  r = r.replace(', AdminPaymentManagementPanel', '');
  // Remove payment tab
  r = r.replace("  { id: 'payments', label: 'Payment management' },\n", '');
  // Remove payment state declarations and functions
  r = r.replace(/const loadingPayments = ref\(false\)\s*\n/, '');
  r = r.replace(/\/\/ Payment management state[\s\S]*?const paymentPagination = ref\(\{ page: 1, pages: 1, total: 0 \}\);\s*\n\s*/g, '');
  // Remove Payment management functions block
  r = r.replace(/\/\/ --- Payment management ---[\s\S]*?async function goToPaymentPage\(nextPage\) \{\s*\n\s+if \(nextPage < 1 \|\| nextPage > paymentPagination\.value\.pages \|\| loadingPayments\.value\) return\s*\n\s+await loadPayments\(nextPage\)\s*\n\s+\}\s*\n/g, '');
  // Remove template component
  r = r.replace(/      <AdminPaymentManagementPanel[\s\S]*?\/>\s*\n/g, '');
  return r;
}, 'remove payment tab from AdminManagementView');

// ─── Step 4g: frontend/src/components/admin/AdminSectionTabs.vue ───────────

modifyFile('frontend/src/components/admin/AdminSectionTabs.vue', (content) => {
  return content.replace("      { id: 'payments', label: 'Payment management' },\n", '');
}, 'remove payments tab from defaults');

// ─── Step 4h: frontend/src/components/admin/index.js ────────────────────────

modifyFile('frontend/src/components/admin/index.js', (content) => {
  return content.replace("export { default as AdminPaymentManagementPanel } from './AdminPaymentManagementPanel.vue'\n", '');
}, 'remove payment panel from barrel');

// ─── Step 4i: frontend/src/components/admin/AdminUserManagementPanel.vue ───

modifyFile('frontend/src/components/admin/AdminUserManagementPanel.vue', (content) => {
  let r = content;
  r = r.replace("  'toggle-premium',\n", '');
  r = r.replace("            <th>Premium</th>\n", '');
  r = r.replace(/            <td>\s*\n\s+<span class="badge" :class="row\.isPremium \? 'bg-warning-subtle text-warning-emphasis' : 'bg-light text-dark'">\s*\n\s+{{ row\.isPremium \? 'Premium' : 'Standard' }}\s*\n\s+<\/span>\s*\n\s+<\/td>\s*\n/g, '');
  r = r.replace(/              <button class="btn btn-sm btn-outline-warning" :disabled="mutating" @click="emit\('toggle-premium', row\)">\s*\n\s+{{ row\.isPremium \? 'Remove premium' : 'Grant premium' }}\s*\n\s+<\/button>\s*\n/g, '');
  r = r.replace('<td colspan="6"', '<td colspan="5"');
  return r;
}, 'remove premium toggle from user management');


// ─── Step 4j: CreatorDashboardTabs.vue ──────────────────────────────────────

modifyFile('frontend/src/components/dashboard/CreatorDashboardTabs.vue', (content) => {
  let r = content;
  r = r.replace("  { key: 'analytics', label: 'Access analytics', premium: true },\n", "  { key: 'analytics', label: 'Access analytics' },\n");
  r = r.replace("  { key: 'ranking', label: 'Ranking report', premium: true },\n", "  { key: 'ranking', label: 'Ranking report' },\n");
  r = r.replace("      <span v-if=\"tab.premium\" class=\"premium-chip\" aria-hidden=\"true\">P</span>\n", '');
  // Remove premium-chip CSS
  const cssStart = r.indexOf('.premium-chip {');
  if (cssStart >= 0) {
    const cssEnd1 = r.indexOf('}', cssStart);
    if (cssEnd1 >= 0) r = r.slice(0, cssStart) + r.slice(cssEnd1 + 1);
  }
  return r;
}, 'remove premium chips from dashboard tabs');

// ─── Step 4k: AppTopBarSearchControls.vue ───────────────────────────────────

modifyFile('frontend/src/components/layout/AppTopBar/AppTopBarSearchControls.vue', (content) => {
  let r = content;
  r = r.replace("    <router-link to=\"/premium\" class=\"premium-pill\">Premium Free Trial</router-link>\n", '');
  // Remove premium pill CSS section
  const cssPillStart = r.indexOf('/* --- Premium Link (less prominent) --- */');
  if (cssPillStart >= 0) {
    const cssPillEnd = r.indexOf('}\n\n', cssPillStart);
    if (cssPillEnd >= 0) r = r.slice(0, cssPillStart) + r.slice(cssPillEnd + 3);
    else {
      const cssPillEnd2 = r.indexOf('}\n', cssPillStart);
      const nextAt = r.indexOf('@media', cssPillEnd2);
      if (nextAt >= 0) r = r.slice(0, cssPillStart) + r.slice(nextAt);
      else r = r.slice(0, cssPillStart) + r.slice(cssPillEnd2 + 2);
    }
  }
  return r;
}, 'remove premium CTA from top bar');


// ─── Step 4l: ProfileRequestsSection.vue ────────────────────────────────────

modifyFile('frontend/src/components/profile/ProfileRequestsSection.vue', (content) => {
  let r = content;

  // Remove escrow-related JS consts
  r = r.replace("const platformFeeRate = 0.12\n", '');
  r = r.replace("const proposedAmountValue = computed(() => Number.parseFloat(form.proposedAmount) || 0)\n", '');
  r = r.replace("const estimatedFeeAmount = computed(() => proposedAmountValue.value * platformFeeRate)\n", '');
  r = r.replace("const estimatedPayoutAmount = computed(() => Math.max(proposedAmountValue.value - estimatedFeeAmount.value, 0))\n", '');

  // Remove formatMoney function
  r = r.replace(/function formatMoney\(amount, currency\) \{\s*\n[\s\S]*?\n\}/g, '');

  // Update submit success message
  r = r.replace(
    "submitMessage.value = 'Request submitted. Your payment is marked as held in escrow while the creator reviews it.';",
    "submitMessage.value = 'Request submitted successfully. The creator will review it shortly.';"
  );

  // Remove escrow-summary div block from template (including inner divs)
  const escrowTemplateStart = r.indexOf('<div class="escrow-summary">');
  if (escrowTemplateStart >= 0) {
    // Find the third closing </div>
    let idx = escrowTemplateStart;
    let closeCount = 0;
    let closeIdx = -1;
    while (closeCount < 3 && idx < r.length) {
      idx = r.indexOf('</div>', idx);
      if (idx === -1) break;
      closeCount++;
      if (closeCount === 3) closeIdx = idx + 6;
      idx = idx + 6;
    }
    if (closeIdx >= 0) {
      r = r.slice(0, escrowTemplateStart) + r.slice(closeIdx);
    }
  }

  // Remove escrow CSS classes (entire blocks)
  // Remove .escrow-summary CSS
  const cssSumStart = r.indexOf('.escrow-summary {');
  if (cssSumStart >= 0) {
    let depth = 1, idx2 = cssSumStart + 18;
    while (depth > 0 && idx2 < r.length) {
      if (r[idx2] === '{') depth++;
      if (r[idx2] === '}') depth--;
      idx2++;
    }
    r = r.slice(0, cssSumStart) + r.slice(idx2);
  }

  // Remove .escrow-title, .escrow-note, .escrow-values
  ['.escrow-title', '.escrow-note', '.escrow-values'].forEach(cls => {
    const start = r.indexOf(cls + ' {');
    if (start >= 0) {
      let depth = 1, idx3 = start + cls.length + 3;
      while (depth > 0 && idx3 < r.length) {
        if (r[idx3] === '{') depth++;
        if (r[idx3] === '}') depth--;
        idx3++;
      }
      r = r.slice(0, start) + r.slice(idx3);
    }
  });

  // Remove @media section referencing escrow-values
  const mediaStart = r.indexOf('@media (max-width: 720px)');
  if (mediaStart >= 0) {
    let depth = 1, idx4 = mediaStart + 23;
    while (depth > 0 && idx4 < r.length) {
      if (r[idx4] === '{') depth++;
      if (r[idx4] === '}') depth--;
      idx4++;
    }
    r = r.slice(0, mediaStart) + r.slice(idx4);
  }

  return r;
}, 'remove escrow estimate from profile requests');


// ─── Step 4m: docs/diagrams/usecase-overall.md ──────────────────────────────

modifyFile('docs/diagrams/usecase-overall.md', (content) => {
  let r = content;

  // Remove Premium package block (lines 174-181+)
  const lines = r.split('\n');
  let premiumStart = -1;
  let premiumEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('%% === PACKAGE: Premium ===')) premiumStart = i;
    if (premiumStart >= 0 && lines[i].includes('Member --> UC_SUBSCRIBE_PREMIUM')) {
      premiumEnd = i + 1;
      break;
    }
  }
  if (premiumStart >= 0 && premiumEnd > premiumStart) {
    lines.splice(premiumStart, premiumEnd - premiumStart);
  }
  r = lines.join('\n');

  // Remove UC36 Payment from Commission package
  r = r.replace(/  usecase "UC36" as UC_PAYMENT\s*\n/, '');
  r = r.replace(/Member --> UC_PAYMENT\s*\n/, '');

  // Remove UC52 Manage Payment from Administration
  r = r.replace(/  usecase "UC52" as UC_MANAGE_PAYMENT\s*\n/, '');
  r = r.replace(/Admin --> UC_MANAGE_PAYMENT\s*\n/, '');

  // Renumber
  const ucMap = {
    'UC37':'UC36','UC38':'UC37','UC39':'UC38','UC40':'UC39',
    'UC41':'UC40','UC43':'UC41','UC44':'UC42',
    'UC47':'UC43','UC48':'UC44','UC49':'UC45','UC50':'UC46',
    'UC51':'UC47','UC53':'UC48','UC54':'UC49',
  };
  for (const [old, neu] of Object.entries(ucMap)) {
    r = r.replace(new RegExp('\\b' + old + '\\b', 'g'), neu);
  }

  // Remove UC36, UC45, UC46, UC52 from table
  const tLines = r.split('\n');
  r = tLines.filter(line => {
    return !line.startsWith('| UC36 |') && !line.startsWith('| UC45 |') && !line.startsWith('| UC46 |') && !line.startsWith('| UC52 |');
  }).join('\n');

  // Fix package name
  r = r.replace('Ủy thác & Thanh toán (Commission & Payment)', 'Ủy thác (Commission)');

  return r;
}, 'remove payment/premium from overall diagram');


// ─── Step 4n: docs/diagrams/usecase-member.md ───────────────────────────────

modifyFile('docs/diagrams/usecase-member.md', (content) => {
  let r = content;

  // Remove UC36 from Commission
  r = r.replace(/  usecase "UC36" as "Thanh toán \(Escrow\/Refund\)"\s*\n/, '');
  r = r.replace(/Member --> UC36\s*\n/, '');
  r = r.replace("UC34 ..> UC36 : <<include>>\n", '');

  // Remove Premium rectangle block
  const lines = r.split('\n');
  let premStart = -1, premEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('%% === Premium ===')) premStart = i;
    if (premStart >= 0 && lines[i].includes('Member --> UC46')) { premEnd = i + 1; break; }
  }
  if (premStart >= 0 && premEnd > premStart) lines.splice(premStart, premEnd - premStart);
  r = lines.join('\n');

  // Renumber
  const ucMap = { 'UC37':'UC36','UC38':'UC37','UC39':'UC38','UC40':'UC39','UC41':'UC40','UC43':'UC41','UC44':'UC42' };
  for (const [old, neu] of Object.entries(ucMap)) {
    r = r.replace(new RegExp('\\b' + old + '\\b', 'g'), neu);
  }

  // Remove UC36, UC45, UC46 from table
  const tLines = r.split('\n');
  r = tLines.filter(line => {
    return !line.startsWith('| UC36 |') && !line.startsWith('| UC45 |') && !line.startsWith('| UC46 |');
  }).join('\n');

  // Fix names
  r = r.replace('tương tác xã hội, ủy thác & thanh toán, tính năng AI, công cụ vẽ và Premium.',
    'tương tác xã hội, ủy thác, tính năng AI và công cụ vẽ.');
  r = r.replace('Nhóm Ủy thác & Thanh toán', 'Nhóm Ủy thác');

  return r;
}, 'remove payment/premium from member diagram');


// ─── Step 4o: docs/diagrams/usecase-admin.md ────────────────────────────────

modifyFile('docs/diagrams/usecase-admin.md', (content) => {
  let r = content;
  r = r.replace(/  usecase "UC52" as "Quản lý thanh toán"\s*\n/, '');
  r = r.replace(/Admin --> UC52\s*\n/, '');

  const ucMap = { 'UC53':'UC52', 'UC54':'UC53' };
  for (const [old, neu] of Object.entries(ucMap)) {
    r = r.replace(new RegExp('\\b' + old + '\\b', 'g'), neu);
  }

  const tLines = r.split('\n');
  r = tLines.filter(line => !line.startsWith('| UC52 |')).join('\n');

  for (const [old, neu] of Object.entries(ucMap)) {
    r = r.replace(new RegExp('\\b' + old + '\\b', 'g'), neu);
  }

  r = r.replace('quản lý thanh toán, cấu hình AI', 'cấu hình AI');
  r = r.replace('doanh thu, request, báo cáo', 'request, báo cáo');
  return r;
}, 'remove payment UC from admin diagram');

// ─── Step 4p: docs/diagrams/usecase-report.md ───────────────────────────────

modifyFile('docs/diagrams/usecase-report.md', (content) => {
  let r = content;

  // Remove rows from matrix table
  const tLines = r.split('\n');
  r = tLines.filter(line => {
    return !line.startsWith('| UC36 |') && !line.startsWith('| UC45 |') && !line.startsWith('| UC46 |') && !line.startsWith('| UC52 |');
  }).join('\n');

  // Renumber
  const ucMapOverall = {
    'UC37':'UC36','UC38':'UC37','UC39':'UC38','UC40':'UC39',
    'UC41':'UC40','UC43':'UC41','UC44':'UC42',
    'UC47':'UC43','UC48':'UC44','UC49':'UC45','UC50':'UC46',
    'UC51':'UC47','UC53':'UC48','UC54':'UC49',
  };
  for (const [old, neu] of Object.entries(ucMapOverall)) {
    r = r.replace(new RegExp('\\b' + old + '\\b', 'g'), neu);
  }

  // Update section 4.7 name
  r = r.replace('### 4.7 Nhóm: Ủy thác & Thanh toán (Commission & Payment)', '### 4.7 Nhóm: Ủy thác (Commission)');

  // Remove Premium section 4.10 entirely
  const sec410Start = r.indexOf('### 4.10 Nhóm: Premium');
  if (sec410Start >= 0) {
    const sec411Start = r.indexOf('### 4.11 Nhóm: Quản trị', sec410Start);
    if (sec411Start >= 0) {
      r = r.slice(0, sec410Start) + r.slice(sec411Start);
    }
  }

  // Fix the remaining section number 4.11 -> 4.10
  r = r.replace('### 4.11 Nhóm: Quản trị (Administration)', '### 4.10 Nhóm: Quản trị (Administration)');

  // Remove UC36 row from section 4.7 table
  const sec47Lines = r.split('\n');
  r = sec47Lines.filter(line => !line.startsWith('| UC36 |') && !line.startsWith('| UC35 | UC36')).join('\n');

  // Update relationship descriptions
  r = r.replace('| UC34 (Đặt hàng Request) | UC36 (Thanh toán) | Đặt hàng yêu cầu thanh toán escrow |', '');
  r = r.replace('| UC33 (Tạo Request Term) | UC34 (Đặt hàng Request) | Term là tiền đề để tạo order |\n', '');
  r = r.replace('| UC34 (Đặt hàng Request) | UC36 (Thanh toán) | Đặt hàng yêu cầu thanh toán escrow |\n', '');

  // Update relationship diagram
  r = r.replace('UC34 (Order) --include--> UC36 (Payment)\n', '');

  // Update summary counts
  r = r.replace('| Use cases | **54** |', '| Use cases | **50** |');
  r = r.replace('| Nhóm chức năng | **11** (Authentication, Browse, Search, Profile, Artwork, Social, Commission, AI, Drawing, Premium, Admin) |',
    '| Nhóm chức năng | **10** (Authentication, Browse, Search, Profile, Artwork, Social, Commission, AI, Drawing, Admin) |');

  // Update implementation stats
  r = r.replace('| ✅ **Đã triển khai** | 52 | Hầu hết các use case đã được implement |',
    '| ✅ **Đã triển khai** | 49 | Hầu hết các use case đã được implement |');
  r = r.replace('| ⚠️ **Triển khai một phần** | 1 | UC36 (Thanh toán Escrow) — chức năng cốt lõi nhưng chưa đầy đủ |',
    '| ⚠️ **Triển khai một phần** | 0 | — |');
  r = r.replace('| ❌ **Chưa triển khai** | 1 | UC46 (Đăng ký Premium) — đã lên kế hoạch |',
    '| ❌ **Chưa triển khai** | 0 | — |');

  // Update conclusions (should have 50 use cases, 10 groups)
  r = r.replace('**54 use case**', '**50 use case**');
  r = r.replace('1. **Bao phủ toàn diện**: 54 use case', '1. **Bao phủ toàn diện**: 50 use case');

  // Remove hướng phát triển payment/premium
  r = r.replace('- **UC46 (Đăng ký Premium)**: Cần tích hợp cổng thanh toán (PayPal/VNPay/Momo)\n', '');
  r = r.replace('- **UC36 (Thanh toán Escrow)**: Hoàn thiện quy trình escrow, dispute resolution\n', '');
  r = r.replace('- **Bổ sung**: Có thể mở rộng thêm use case cho mobile app hoặc API third-party', '');

  // Update section 4.7 detailed table - remove UC36 row
  const section4_7 = r.indexOf('### 4.7');
  if (section4_7 >= 0) {
    // Find the table and remove UC36 rows
    const tableInSection = r.substring(section4_7);
    const updatedSection = tableInSection.split('\n').filter(l => !l.includes('UC36')).join('\n');
    r = r.substring(0, section4_7) + updatedSection;
  }

  return r;
}, 'remove payment/premium from report diagram');


// ─── Step 4q: docs/project-overview.md ──────────────────────────────────────

modifyFile('docs/project-overview.md', (content) => {
  let r = content;

  // Remove premium mention in section 2
  r = r.replace('- **Thành viên Premium:** ⚠️ Giao diện PremiumView.vue và dữ liệu hằng số đã có, nhưng **chưa có luồng thanh toán subscription** và chưa có logic gating feature ở backend.\n', '');

  // Remove payment system line in section F
  r = r.replace('- ✅ **Hệ thống Thanh toán (Payments):** Mock payment với Stripe intent/bank QR, escrow, refund, payout, invoice — đầy đủ sandbox\n', '');

  // Remove payment from new features list
  r = r.replace('- ✅ **Payment System:** Thanh toán mô phỏng (Stripe + QR), escrow, refund, payout, invoice\n', '');
  r = r.replace('- ✅ **Premium UI:** Trang giới thiệu premium + giao diện so sánh\n', '');

  // Remove payment-related models from model list (Payment, PaymentConfig, Invoice, Payout, etc.)
  const modelLines = r.split('\n');
  r = modelLines.filter(line => {
    return !line.startsWith('| **Payment** |') && !line.startsWith('| **PaymentConfig** |') && 
           !line.startsWith('| **Invoice** |') && !line.startsWith('| **Payout** |') &&
           !line.startsWith('| **PayoutMethod** |') && !line.startsWith('| **EscrowTransaction** |') &&
           !line.startsWith('| **CreatorBalance** |');
  }).join('\n');

  // Update model count
  r = r.replace('> Cơ sở dữ liệu thực tế đã phát triển vượt xa thiết kế ban đầu. Dưới đây là danh sách đầy đủ 25 models Mongoose đã được code:',
    '> Cơ sở dữ liệu thực tế đã phát triển vượt xa thiết kế ban đầu. Dưới đây là danh sách đầy đủ 18 models Mongoose đã được code:');

  // Remove escrow reference from Request model
  r = r.replace('| **Request** | term, creator, requester, title, description, status, escrow, payment, revisionCount |',
    '| **Request** | term, creator, requester, title, description, status, revisionCount |');

  return r;
}, 'remove payment/premium from project overview');

// ─── Step 4r: docs/tasks/feature-tracker.md ─────────────────────────────────

modifyFile('docs/tasks/feature-tracker.md', (content) => {
  let r = content;
  // Remove Request Payment / Escrow Expansion row
  const lines = r.split('\n');
  r = lines.filter(line => !line.includes('Request Payment / Escrow Expansion')).join('\n');
  return r;
}, 'remove payment from feature tracker');

// ─── Step 4s: docs/PRD.yaml ─────────────────────────────────────────────────

modifyFile('docs/PRD.yaml', (content) => {
  let r = content;
  // Remove premium section (lines 1-41)
  const premSectionEnd = r.indexOf('\npublic_user_search:');
  if (premSectionEnd >= 0) {
    r = r.slice(premSectionEnd + 1);
  }
  return r;
}, 'remove premium from PRD.yaml');

// ─── Final report ──────────────────────────────────────────────────────────

console.log('');
console.log('========================================');
console.log('          REMOVAL COMPLETE');
console.log('========================================');
console.log('Files copied to backup: ' + copiedCount);
console.log('Files deleted from project: ' + deletedCount);
console.log('Files modified: ' + modifiedCount);
if (errors.length > 0) {
  console.log('Errors:');
  errors.forEach(e => console.log('  - ' + e));
}
console.log('');

