/**
 * generate-erd.js — Generates a Mermaid ERD markdown file for the IlluWrl system.
 *
 * Analyzes all 19 Mongoose models and outputs a comprehensive Entity-Relationship
 * Diagram to docs/diagrams/erd.md.
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Entity definitions — each entry has: label, fields array, and comment
// ---------------------------------------------------------------------------
const entities = [
  {
    label: 'USER',
    comment: 'Core user account — central identity for the entire platform',
    fields: [
      'ObjectId _id PK',
      'string email UK "unique login email"',
      'string username UK "unique display handle"',
      'string displayName',
      'string avatar',
      'string coverImage',
      'string bio',
      'string gender',
      'string location',
      'date birthday',
      'string website',
      'json socialLinks "embedded {x,facebook,instagram}"',
      'string role "user | admin"',
      'string password "hashed"',
      'string googleId',
      'string facebookId',
      'string twitterId',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'FOLLOW',
    comment: 'User-to-user follow relationship',
    fields: [
      'ObjectId _id PK',
      'ObjectId follower FK "ref User — who follows"',
      'ObjectId following FK "ref User — being followed"',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'USER_BLOCK',
    comment: 'User-to-user block relationship',
    fields: [
      'ObjectId _id PK',
      'ObjectId blocker FK "ref User"',
      'ObjectId blocked FK "ref User"',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'SETTING',
    comment: 'Global system settings singleton — configuration flags for the entire platform',
    fields: [
      'string _id PK "singleton key: global"',
      'boolean aiDetectionEnabled',
      'number aiDetectionThreshold "0-100"',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'MESSAGE',
    comment: 'Direct messages between users',
    fields: [
      'ObjectId _id PK',
      'ObjectId sender FK "ref User"',
      'ObjectId recipient FK "ref User"',
      'string content',
      'array images',
      'boolean isRead',
      'datetime readAt',
      'array deletedFor "ref User[]"',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'NOTIFICATION',
    comment: 'User notifications for platform events',
    fields: [
      'ObjectId _id PK',
      'ObjectId user FK "ref User — recipient"',
      'ObjectId actor FK "ref User — trigger"',
      'ObjectId artwork FK "ref Artwork — optional context"',
      'string type "follow|like|bookmark|comment|request|system"',
      'string message',
      'boolean isRead',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'ARTWORK',
    comment: 'Primary content — illustrations, manga, GIFs, novels',
    fields: [
      'ObjectId _id PK',
      'ObjectId user FK "ref User — creator"',
      'string title',
      'string description',
      'string type "illust|manga|gif|novel"',
      'array images',
      'array tags "ref Tag[]"',
      'string ageRating "all|r-18|r-18g"',
      'number viewCount',
      'number likeCount',
      'number bookmarkCount',
      'number commentCount',
      'number reportCount',
      'string novelContent',
      'string novelFormat "oneshot|series"',
      'string novelSeriesName',
      'number chapterCount',
      'number wordCount',
      'boolean isHidden',
      'ObjectId hiddenBy FK "ref User — moderator"',
      'datetime hiddenAt',
      'string hiddenReason',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'TAG',
    comment: 'Content tags with multi-language translations',
    fields: [
      'ObjectId _id PK',
      'string name UK',
      'json translations "embedded {en,vi,ja}"',
      'number usageCount',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'COMMENT',
    comment: 'Comments on artworks (supports self-referencing replies)',
    fields: [
      'ObjectId _id PK',
      'ObjectId artwork FK "ref Artwork"',
      'ObjectId user FK "ref User — author"',
      'string content',
      'ObjectId parentComment FK "ref Comment — self for replies"',
      'string stickerUrl',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'LIKE',
    comment: 'Likes on artworks (unique per user+artwork)',
    fields: [
      'ObjectId _id PK',
      'ObjectId user FK "ref User"',
      'ObjectId artwork FK "ref Artwork"',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'BOOKMARK',
    comment: 'Bookmarks with folder categorization',
    fields: [
      'ObjectId _id PK',
      'ObjectId user FK "ref User"',
      'ObjectId artwork FK "ref Artwork"',
      'string folder',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'CHAPTER',
    comment: 'Novel chapters per artwork',
    fields: [
      'ObjectId _id PK',
      'ObjectId artwork FK "ref Artwork"',
      'string title',
      'string content',
      'number chapterNumber "unique per artwork"',
      'number wordCount',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'READING_PROGRESS',
    comment: 'Per-user reading progress on artwork chapters',
    fields: [
      'ObjectId _id PK',
      'ObjectId user FK "ref User"',
      'ObjectId artwork FK "ref Artwork"',
      'ObjectId chapter FK "ref Chapter"',
      'number progressPercent',
      'number scrollPosition',
      'datetime lastReadAt',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'ARTWORK_REPORT',
    comment: 'Moderation reports filed against artworks',
    fields: [
      'ObjectId _id PK',
      'ObjectId artwork FK "ref Artwork"',
      'ObjectId reportedBy FK "ref User"',
      'string reason "spam|inappropriate|copyright|harassment|nsfw|other"',
      'string description',
      'string status "pending|resolved|dismissed"',
      'ObjectId resolvedBy FK "ref User"',
      'datetime resolvedAt',
      'string resolutionNote',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'REQUEST_TERM',
    comment: 'Commission request terms set by creators',
    fields: [
      'ObjectId _id PK',
      'ObjectId creator FK "ref User"',
      'string title',
      'string tier',
      'number targetPrice',
      'string currency',
      'array acceptedWorkTypes',
      'number estimatedDays',
      'number maxOpenRequests',
      'array acceptedAgeRatings',
      'string rules',
      'array forbiddenTopics',
      'array preferredStyles',
      'array strengths',
      'json commercialUse "embedded {allowed,feeMultiplier,notes}"',
      'boolean isOpen',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'REQUEST',
    comment: 'Individual commission requests between users',
    fields: [
      'ObjectId _id PK',
      'ObjectId term FK "ref RequestTerm"',
      'ObjectId creator FK "ref User — provider"',
      'ObjectId requester FK "ref User — client"',
      'string title',
      'string description',
      'string workType',
      'array tags',
      'json specifics "embedded {pose,outfit,mood,lighting,angle,other}"',
      'number proposedAmount',
      'string currency',
      'string visibility',
      'boolean isAnonymous',
      'string ageRating',
      'string status "pending|accepted|in_progress|draft_submitted|revision|completed|rejected|cancelled"',
      'array referenceImages "embedded"',
      'array draftFiles "embedded"',
      'array finalFiles "embedded"',
      'array giftFiles "embedded"',
      'number revisionCount',
      'datetime autoCompleteAt',
      'datetime dueAt',
      'datetime extensionRequestedAt',
      'number extensionDays',
      'datetime chatClosedAt',
      'string licenseTier',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'REQUEST_CHAT_MESSAGE',
    comment: 'Chat messages within a commission request',
    fields: [
      'ObjectId _id PK',
      'ObjectId request FK "ref Request"',
      'ObjectId sender FK "ref User"',
      'string content',
      'array attachments "embedded"',
      'boolean isSystem',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'REQUEST_EVENT',
    comment: 'State-machine audit trail for commission requests',
    fields: [
      'ObjectId _id PK',
      'ObjectId request FK "ref Request"',
      'ObjectId actor FK "ref User"',
      'string type',
      'string fromStatus',
      'string toStatus',
      'json metadata "Mixed"',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
  {
    label: 'REQUEST_REVISION',
    comment: 'Revision requests on a commission (max 2 rounds)',
    fields: [
      'ObjectId _id PK',
      'ObjectId request FK "ref Request"',
      'ObjectId requester FK "ref User"',
      'number round "1|2 — unique per request"',
      'string notes',
      'datetime createdAt',
      'datetime updatedAt',
    ],
  },
];

// ---------------------------------------------------------------------------
// Relationship definitions — (from, to, cardinality, label)
// ---------------------------------------------------------------------------
const relationships = [
  // ── User ──────────────────────────────────────────────────────────────────
  ['USER', 'ARTWORK', '||--o{', 'creates'],
  ['USER', 'COMMENT', '||--o{', 'writes'],
  ['USER', 'LIKE', '||--o{', 'gives'],
  ['USER', 'BOOKMARK', '||--o{', 'creates'],
  ['USER', 'FOLLOW', '||--o{', 'follows as follower'],
  ['USER', 'FOLLOW', '||--o{', 'is followed as following'],
  ['USER', 'NOTIFICATION', '||--o{', 'receives'],
  ['USER', 'NOTIFICATION', '||--o{', 'triggers as actor'],
  ['USER', 'MESSAGE', '||--o{', 'sends'],
  ['USER', 'MESSAGE', '||--o{', 'receives'],
  ['USER', 'USER_BLOCK', '||--o{', 'blocks as blocker'],
  ['USER', 'USER_BLOCK', '||--o{', 'blocked as blocked'],
  ['USER', 'ARTWORK_REPORT', '||--o{', 'reports'],
  ['USER', 'ARTWORK_REPORT', '||--o{', 'resolves'],
  ['USER', 'ARTWORK', '||--o{', 'hides as moderator'],
  ['USER', 'REQUEST_TERM', '||--o{', 'creates'],
  ['USER', 'REQUEST', '||--o{', 'is creator/provider'],
  ['USER', 'REQUEST', '||--o{', 'is requester/client'],
  ['USER', 'REQUEST_CHAT_MESSAGE', '||--o{', 'sends'],
  ['USER', 'REQUEST_EVENT', '||--o{', 'acts'],
  ['USER', 'REQUEST_REVISION', '||--o{', 'requests as requester'],
  ['USER', 'READING_PROGRESS', '||--o{', 'tracks'],

  // ── Artwork ──────────────────────────────────────────────────────────────
  ['ARTWORK', 'COMMENT', '||--o{', 'has'],
  ['ARTWORK', 'LIKE', '||--o{', 'receives'],
  ['ARTWORK', 'BOOKMARK', '||--o{', 'gets'],
  ['ARTWORK', 'NOTIFICATION', '||--o{', 'triggers'],
  ['ARTWORK', 'ARTWORK_REPORT', '||--o{', 'reported in'],
  ['ARTWORK', 'CHAPTER', '||--o{', 'contains'],
  ['ARTWORK', 'READING_PROGRESS', '||--o{', 'tracks'],
  ['ARTWORK', 'TAG', '}o--o{', 'tagged with'],

  // ── Chapter ──────────────────────────────────────────────────────────────
  ['CHAPTER', 'READING_PROGRESS', '||--o{', 'tracks'],

  // ── RequestTerm ──────────────────────────────────────────────────────────
  ['REQUEST_TERM', 'REQUEST', '||--o{', 'defines'],

  // ── Request ──────────────────────────────────────────────────────────────
  ['REQUEST', 'REQUEST_CHAT_MESSAGE', '||--o{', 'has'],
  ['REQUEST', 'REQUEST_EVENT', '||--o{', 'logs'],
  ['REQUEST', 'REQUEST_REVISION', '||--o{', 'requests'],

  // ── Comment (self-referencing — skipped for simplicity, but noted) ───────
  // COMMENT -> COMMENT (self) would be: COMMENT ||--o{ COMMENT : "replies to"

  // ── Setting (singleton, no FK relationships) ──────────────────────────
];

// ---------------------------------------------------------------------------
// Build the markdown content
// ---------------------------------------------------------------------------
const now = new Date().toISOString().split('T')[0];

/** Format a single entity block for the Mermaid ERD. */
function formatEntity(entity) {
  const lines = [];
  lines.push(`  ${entity.label} {`);
  for (const field of entity.fields) {
    lines.push(`    ${field}`);
  }
  lines.push('  }');
  return lines.join('\n');
}

/** Build the full markdown file. */
function buildMarkdown() {
  const parts = [];

  // ── Header ───────────────────────────────────────────────────────────────
  parts.push('# IlluWrl — Entity-Relationship Diagram');
  parts.push('');
  parts.push(`> **Generated:** ${now}`);
  parts.push('> **Entities:** 19 Mongoose models across 5 domain groups');
  parts.push('> **Description:** Comprehensive ERD of the IlluWrl (Pixiv-clone) data model');
  parts.push('');
  parts.push('---');
  parts.push('');

  // ── Mermaid erDiagram ────────────────────────────────────────────────────
  parts.push('```mermaid');
  parts.push('erDiagram');

  // Entity definitions
  for (const entity of entities) {
    parts.push(formatEntity(entity));
    parts.push('');
  }

  // Relationships
  for (const [from, to, card, label] of relationships) {
    parts.push(`  ${from} ${card} ${to} : "${label}"`);
  }

  parts.push('```');
  parts.push('');

  // ── Legend / Glossary ────────────────────────────────────────────────────
  parts.push('---');
  parts.push('## Legend');
  parts.push('');
  parts.push('### Entity Groups');
  parts.push('');
  parts.push('| Group | Entities | Description |');
  parts.push('|-------|----------|-------------|');
  parts.push('| **Core User System** | USER, FOLLOW, USER_BLOCK, MESSAGE, NOTIFICATION | Identity, social graph, messaging, alerts |');
  parts.push('| **Content System** | ARTWORK, TAG, COMMENT, LIKE, BOOKMARK, CHAPTER, READING_PROGRESS | Primary creative content and engagement |');
  parts.push('| **Reporting & Moderation** | ARTWORK_REPORT | Content flagging and resolution |');
  parts.push('| **Commission System** | REQUEST_TERM, REQUEST, REQUEST_CHAT_MESSAGE, REQUEST_EVENT, REQUEST_REVISION | Commission marketplace and state machine |');
  parts.push('| **Core System Config** | SETTING | Singleton global system configuration |');
  parts.push('');
  parts.push('### Cardinality Notation');
  parts.push('');
  parts.push('| Symbol | Meaning |');
  parts.push('|--------|---------|');
  parts.push('| `||--o{` | One to Zero-or-More (most common — parent to child) |');
  parts.push('| `||--||` | One to One |');
  parts.push('| `}o--||` | Zero-or-More to One (inverse) |');
  parts.push('| `}o--o{` | Zero-or-More to Zero-or-More (many-to-many) |');
  parts.push('| `||--o{` | One to One-or-More |');
  parts.push('');
  parts.push('### Field Annotations');
  parts.push('');
  parts.push('| Suffix | Meaning |');
  parts.push('|--------|---------|');
  parts.push('| `PK` | Primary Key (`_id`) |');
  parts.push('| `UK` | Unique Key (unique index) |');
  parts.push('| `FK` | Foreign Key (Mongoose `ref`) |');
  parts.push('');

  // ── Summary Table ────────────────────────────────────────────────────────
  parts.push('---');
  parts.push('## Entity Summary');
  parts.push('');
  parts.push('| # | Entity | Fields | Key Relationships | Group |');
  parts.push('|---|--------|--------|-------------------|-------|');
  const groupMap = {
    USER: 'Core User System',
    FOLLOW: 'Core User System',
    USER_BLOCK: 'Core User System',
    MESSAGE: 'Core User System',
    NOTIFICATION: 'Core User System',
    ARTWORK: 'Content System',
    TAG: 'Content System',
    COMMENT: 'Content System',
    LIKE: 'Content System',
    BOOKMARK: 'Content System',
    CHAPTER: 'Content System',
    READING_PROGRESS: 'Content System',
    ARTWORK_REPORT: 'Reporting & Moderation',
    REQUEST_TERM: 'Commission System',
    REQUEST: 'Commission System',
    REQUEST_CHAT_MESSAGE: 'Commission System',
    REQUEST_EVENT: 'Commission System',
    REQUEST_REVISION: 'Commission System',
    SETTING: 'Core System Config',
  };
  let idx = 0;
  for (const entity of entities) {
    idx++;
    const relCount = relationships.filter(
      (r) => r[0] === entity.label || r[1] === entity.label,
    ).length;
    const group = groupMap[entity.label] || '—';
    parts.push(
      `| ${idx} | **${entity.label}** | ${entity.fields.length} | ${relCount} relationships | ${group} |`,
    );
  }
  parts.push('');

  // ── Footer ───────────────────────────────────────────────────────────────
  parts.push('---');
  parts.push(`*Generated by \`scripts/generate-erd.js\` on ${now} — ${entities.length} entities, ${relationships.length} relationships.*`);

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------
if (require.main === module) {
  const outputPath = path.resolve(__dirname, '..', 'docs', 'diagrams', 'erd.md');
  const content = buildMarkdown();
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`✅ ERD generated successfully: ${outputPath}`);
  console.log(`   • Entities: ${entities.length}`);
  console.log(`   • Relationships: ${relationships.length}`);
  console.log(`   • File size: ${(Buffer.byteLength(content) / 1024).toFixed(1)} KB`);
}

module.exports = { entities, relationships, buildMarkdown, formatEntity };
