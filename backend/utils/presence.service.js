const presenceMap = new Map();

function setPresence(userId, { typing = false } = {}) {
  const now = Date.now();
  const existing = presenceMap.get(userId) || {};
  existing.lastSeen = now;
  if (typing) {
    existing.typingAt = now;
  }
  presenceMap.set(userId, existing);
}

function getPresence(userId) {
  const entry = presenceMap.get(userId);
  if (!entry) return { online: false, lastSeen: null, typing: false, typingAt: null };

  const now = Date.now();
  const online = entry.lastSeen && (now - entry.lastSeen) <= 30 * 1000; // 30s TTL
  const typing = entry.typingAt && (now - entry.typingAt) <= 5 * 1000; // 5s TTL
  return {
    online: Boolean(online),
    lastSeen: entry.lastSeen || null,
    typing: Boolean(typing),
    typingAt: entry.typingAt || null,
  };
}

module.exports = {
  setPresence,
  getPresence,
};
