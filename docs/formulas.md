# IlluWrl — Algorithms & Formulas

Reference document for all algorithmic logic, scoring formulas, state machines, and data processing pipelines used across the project.

---

## Table of Contents

1. [Follow-Graph User Recommendation](#1-follow-graph-user-recommendation)
2. [For You Feed Recommendation](#2-for-you-feed-recommendation)
3. [Weighted Jaccard Similarity (Similar Artworks)](#3-weighted-jaccard-similarity-similar-artworks)
4. [AI Detection](#4-ai-detection)
5. [Auto-Tagging](#5-auto-tagging)
6. [Request / Commission State Machine](#6-request--commission-state-machine)
7. [Browse History Cleanup](#7-browse-history-cleanup)
8. [Reading Time (Novels)](#8-reading-time-novels)
9. [Ranked Feed Sort Order](#9-ranked-feed-sort-order)
10. [Tag Normalization](#10-tag-normalization)
11. [Toast Auto-Dismiss](#11-toast-auto-dismiss)
12. [Pagination Standard](#12-pagination-standard)

---

## 1. Follow-Graph User Recommendation

Recommends creators based on who the people you follow also follow — collaborative filtering through the follow graph.

### Formula

```
mutualCount(user) = number of people I follow who also follow this user
```

### Pipeline

1. Fetch all users that the current user follows (`followingIds`)
2. Query the `Follow` collection for documents where `follower ∈ followingIds`
3. Exclude: the current user + already-followed users
4. Group by `following` (the target user) and count mutuals
5. Sort by `mutualCount` descending
6. Limit to top **9**
7. `$lookup` user details (username, displayName, avatar)

### Code

| Layer | File | Lines |
|-------|------|-------|
| Endpoint | `backend/controllers/user.controller.js` | 704–766 |
| Route | `GET /api/users/recommended` | — |
| Frontend consumers | `frontend/src/views/HomePage.vue`, `frontend/src/views/TypedHomeFeedView.vue` | — |

### Behavior

- Returns **empty array** if the user doesn't follow anyone
- Frontend falls back to artwork-based tag derivation if the response is empty

> 📖 Tài liệu đầy đủ: [`docs/ui-guide/features/user-recommendation.md`](ui-guide/features/user-recommendation.md)

---

## 2. For You Feed Recommendation

Personalized artwork recommendations driven by tag affinity from past interactions plus engagement signals.

### Formula

```
score = (tagScore × 5) + (likeCount × 2 + bookmarkCount × 3 + viewCount × 0.1)
```

Where:

- `tagScore` = sum of the user's weights for each tag present on the artwork
- `likeCount`, `bookmarkCount`, `viewCount` = artwork's raw counters

### Tag Weights

| Interaction | Weight per occurrence |
|-------------|----------------------|
| bookmark    | 3                    |
| like        | 2                    |
| browse      | 1                    |

### Tag Computation (`getPreferredTags`)

1. Collect the last **100** entries each from: `Bookmark`, `Like`, `BrowseHistory`
2. For each entry, accumulate `weight` onto each tag of the associated artwork
3. Merge all three sources into a single `Map<tagId, { tag, weight }>`
4. Sort descending by weight
5. Return top **10** tags

### Exclusion Set

Artworks are excluded if the user is the **author**, or has already **bookmarked** or **liked** them.

### Fallback

When no preferred tags exist (new user): return recent artworks sorted by `likeCount` desc, `createdAt` desc.

### Code

| File | Function |
|------|----------|
| `backend/services/recommendation.service.js` | `getPreferredTags()`, `getForYouArtworks()` |
| `backend/controllers/feed.controller.js:130` | `getForYou()` |

> 📖 Tài liệu đầy đủ: [`docs/ui-guide/features/feed.md`](ui-guide/features/feed.md)

---

## 3. Weighted Jaccard Similarity (Similar Artworks)

Item-to-item collaborative filtering that finds artworks similar to a given source artwork based on shared user interaction patterns.

### Formula

```
score(candidate) = sharedWeight / (weightA + weightB - sharedWeight)
```

Where:

- **weightA** = total interaction weight of all users on the source artwork
- **weightB** = total interaction weight of all users on the candidate artwork
- **sharedWeight** = sum of intersection weights (users who interacted with both)

### Interaction Weights

| Interaction | Weight |
|-------------|--------|
| bookmark    | 3      |
| like        | 2      |
| browse      | 0.5    |

### Algorithm Steps

1. Gather all users who interacted with the source artwork, summing their weights
2. If **fewer than 3 unique users** → fallback to tag-based sort
3. Fetch all interactions from those users across all artworks
4. Build co-occurrence map: `candidateArtworkId → sum of shared weights`
5. Compute total weight (**weightB**) for each candidate via aggregation
6. Calculate Jaccard score for each candidate
7. Sort descending, apply limit (default **24**), and return populated documents

### Fallback: Tag-Based Sort

Triggered when `< 3` users interacted with the source.

```
candidates sorted by:
  1. count of shared tags (descending)
  2. likeCount (descending)
```

Filtered to same artwork `type`, excluding self, with at least one shared tag.

### Code

| File | Function |
|------|----------|
| `backend/services/similarity.service.js` | `getSimilarArtworks()`, `getFallbackSimilarArtworks()`, `getInteractionUsers()`, `getUserInteractions()` |

---

## 4. AI Detection

Hybrid pipeline: primary detection via HuggingFace inference API with metadata-based heuristic fallback.

### Primary Detection (HuggingFace)

- **Model:** `umm-maybe/AI-image-detector`
- **API:** `https://router.huggingface.co/hf-inference/models/{model}`

```javascript
const aiIdx = labels.findIndex(l => l.includes('ai') || l.includes('generated') || ...)
const realIdx = labels.findIndex(l => l.includes('real') || l.includes('natural') || ...)

isAI = aiScore > realScore
confidence = Math.round(Math.max(aiScore, realScore) * 100)
```

### Fallback: Metadata Analysis

Used when `HF_TOKEN` is not configured or the API call fails.

| Indicator | Score contribution | Condition |
|-----------|------------------|-----------|
| Large file | +20 | size > 200 KB |
| Very large PNG | +25 | type === 'png' && size > 500 KB |
| JPEG artifacts | +15 | hex contains `ffd9` and `ffda` |
| Uniform patterns | +20 | byte variance < 500 |
| Very small file | −10 | size < 10 KB |

```javascript
isAI = aiScore > 30
confidence = Math.min(85, Math.max(30, 50 + aiScore))
```

### Threshold

AI detection uses HuggingFace model `umm-maybe/AI-image-detector` — artworks with `isAI=true` are auto-tagged with the `ai` tag.

### Code

| File | Function |
|------|----------|
| `backend/services/huggingface.service.js` | `detectAIWithHuggingFace()`, `processHFResults()`, `detectWithMetadataAnalysis()`, `analyzeCompressionPatterns()` |

---

## 5. Auto-Tagging

Generates tags from uploaded images using Google Cloud Vision API.

### Configuration

| Variable | Default |
|----------|---------|
| `GOOGLE_VISION_API_KEY` | — (required) |
| `GOOGLE_VISION_CONFIDENCE` | `0.6` |
| `AUTO_TAG_MAX_TAGS` | `10` |

### Label Cleaning

```javascript
label
  .toLowerCase()           // normalize case
  .replace(/\s+/g, '_')    // spaces → underscores
  .replace(/[^a-z0-9_]/g, '')  // strip special chars
  .replace(/^_+|_+$/g, '')     // trim leading/trailing underscores
  .substring(0, 50)        // safety length cap
```

### Pipeline

1. Call Google Cloud Vision LABEL_DETECTION API with the image
2. Filter results where `score >= GOOGLE_VISION_CONFIDENCE`
3. Clean each label
4. Deduplicate and collect up to `AUTO_TAG_MAX_TAGS`

### Code

| File | Function |
|------|----------|
| `backend/services/autoTag.service.js` | `autoTagImage()` |
| `backend/services/googleVision.service.js` | `detectLabels()`, `cleanLabel()` |

---

## 6. Request / Commission State Machine

### States

```
pending ──→ in_progress ──→ draft_submitted ──→ revision ──→ completed
   │                                                  │
   └──→ rejected                                      └──→ cancelled
```

### Transitions

| From | To |
|------|----|
| `pending` | `in_progress`, `rejected` |
| `in_progress` | `draft_submitted`, `cancelled` |
| `draft_submitted` | `revision`, `completed`, `cancelled` |
| `revision` | `draft_submitted`, `completed`, `cancelled` |
| `completed` | _(terminal)_ |
| `rejected` | _(terminal)_ |
| `cancelled` | _(terminal)_ |

### Active States (count toward capacity)

```
in_progress, draft_submitted, revision
```

### Revision Limit

```
maxRevisionRounds = 2
```

A request creator can only request up to **2** revision rounds. `canCreateRevision()` checks that the current status is `draft_submitted` or `revision` and that `revisionCount < 2`.

### Deadline Rules

| Rule | Value |
|------|-------|
| Acceptance due | `now + 60 days` |
| Auto-complete after acceptance | `now + 7 days` |
| Max extension | `+30 days`, once per request |

### Code

| File | Lines |
|------|-------|
| `backend/utils/requestValidation.js` | 1–160 (entire file) |
| Constants | `REQUEST_STATUSES`, `ACTIVE_REQUEST_STATUSES`, `TRANSITIONS` |
| Validators | `validateRequestTermPayload()`, `validateRequestSubmission()` |
| Guards | `canTransitionRequest()`, `canCreateRevision()` |

### Documentation

Full action flows documented in `docs/action-flow/request-action-flows.md`.

---

## 7. Browse History Cleanup

Keeps each user's browse history at a fixed maximum size to prevent unbounded growth.

### Rule

```
maxEntriesPerUser = 200

On each new view:
  1. Insert view entry
  2. Count total entries for this user
  3. If count > 200:
     a. Find the 200th newest entry
     b. Delete all entries older than that
```

### Code

| File | Lines |
|------|-------|
| `backend/controllers/artwork.controller.js` | 327–340 |

```javascript
// Cleanup: keep only last 200 entries per user
const count = await BrowseHistory.countDocuments({ user: req.user._id });
if (count > 200) {
    const oldestToKeep = await BrowseHistory.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(200)
        .limit(1);
    if (oldestToKeep.length > 0) {
        await BrowseHistory.deleteMany({
            user: req.user._id,
            createdAt: { $lt: oldestToKeep[0].createdAt },
        });
    }
}
```

---

## 8. Reading Time (Novels)

Estimated reading time computed from word count, displayed on novel artwork pages.

### Formula

```
readingTime = Math.ceil(wordCount / 200)
wordCount = novelContent.trim().split(/\s+/).filter(Boolean).length
```

- **Word count** is stored and calculated in a `pre('save')` hook on the `Artwork` model
- **Reading time** is a Mongoose virtual (not persisted) computed on access

### Code

| File | Lines |
|------|-------|
| `backend/models/Artwork.js` | 91–104 |

```javascript
// Pre-save hook
artworkSchema.pre('save', function () {
    if (this.type === 'novel' && this.novelContent) {
        const text = this.novelContent.trim();
        this.wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
    }
});

// Virtual
artworkSchema.virtual('readingTime').get(function () {
    const words = this.wordCount || 0;
    if (words === 0) return 0;
    return Math.ceil(words / 200);
});
```

---

## 9. Ranked Feed Sort Order

Used by the rankings endpoint for daily/weekly/monthly/rookie leaderboards.

### Sort

```javascript
{ likeCount: -1, bookmarkCount: -1, viewCount: -1, createdAt: -1 }
```

Breakdown priority:
1. Highest **like count**
2. Highest **bookmark count** (tiebreaker)
3. Highest **view count** (tiebreaker)
4. Most recent **created date** (final tiebreaker)

### Period Filters

| Period | Filter |
|--------|--------|
| `daily` | `createdAt >= now - 1 day` |
| `weekly` | `createdAt >= now - 7 days` |
| `monthly` | `createdAt >= now - 30 days` |
| `rookie` | `user ∈ users who joined within last 30 days` |

### Code

| File | Function | Lines |
|------|----------|-------|
| `backend/controllers/feed.controller.js` | `getRankings()` | 45–95 |

> 📖 Tài liệu đầy đủ: [`docs/ui-guide/features/feed.md`](ui-guide/features/feed.md)

---

## 10. Tag Normalization

Tags are normalized on both backend and frontend to ensure consistent matching and display.

### Backend (artwork creation & query)

```javascript
normalizeTagName = (rawTagName = '') =>
    String(rawTagName)
        .trim()                   // remove surrounding whitespace
        .replace(/^#+/, '')       // strip leading # characters
        .replace(/[\s-]+/g, '_')  // spaces and hyphens → underscores
        .toLowerCase()            // case-insensitive
```

Used in:
- Artwork creation — normalizes user-provided tag names before storage (line 123)
- Artwork search — normalizes query param before looking up `Tag` documents (line 247)
- AI detection tagging — normalizes the `ai` tag name constant (line 24)

### Frontend (TypedHomeFeedView.vue)

```javascript
function normalizeTags(artworks) {
    const tagMap = new Map()
    artworks.forEach((item) => {
        (item.tags || []).forEach((tag) => {
            const rawName = String(tag?.name || '').trim().toLowerCase()
            if (!rawName) return
            const count = tagMap.get(rawName) || 0
            tagMap.set(rawName, count + 1)
        })
    })
    liveTags.value = Array.from(tagMap.entries())
        .sort((a, b) => b[1] - a[1])   // sort by frequency descending
        .slice(0, 12)                     // keep top 12
        .map(([name]) => `#${name}`)      // prefix with #
}
```

### Code

| Layer | File | Lines |
|-------|------|-------|
| Backend | `backend/controllers/artwork.controller.js` | 17–22 |
| Frontend | `frontend/src/views/TypedHomeFeedView.vue` | 95–114 |

---

## 11. Toast Auto-Dismiss

Auto-dismiss timing for toast notifications.

### Durations

| Type | Duration |
|------|----------|
| `success` | 3000 ms |
| `error` | 5000 ms |
| `info` | 3000 ms |

Default (untyped `show()` call): **3000 ms**

### Code

| File | Lines |
|------|-------|
| `frontend/src/composables/useToast.js` | 1–28 |

```javascript
function show(message, type = 'success', duration = 3000) {
    // ...
    setTimeout(() => remove(id), duration)
}

showSuccess: (msg) => show(msg, 'success')
showError:   (msg) => show(msg, 'error', 5000)
showInfo:    (msg) => show(msg, 'info')
```

---

## 12. Pagination Standard

### Formula

```javascript
skip  = (page - 1) * limit
pages = Math.ceil(total / limit)
```

- `page` is 1-indexed (default: 1)
- `limit` varies by endpoint with optional max cap

### Default Limits & Max Caps

| Endpoint / Context | Default Limit | Max Cap |
|--------------------|---------------|---------|
| Artwork listing (`getArtworks`) | 48 | 200 |
| Artwork detail comments/replies | 20 | 100 |
| Feed (following, discovery) | 20 | 100 |
| Rankings | 50 | — |
| Creator requests listing (dashboard) | 80 | 200 |
| Creator requests dashboard (incoming) | 60 | 120 |
| Admin request management | 20 | 100 |
| User reports | 20 | 100 |
| Notifications | 20 | — |
| Messages | 20 | — |
| Creator request terms (public) | 24 | — |
| Tags | 20 | — |

### Code

Pagination logic is uniformly implemented across all controllers:

- `backend/controllers/artwork.controller.js` — lines 367, 752, 878
- `backend/controllers/feed.controller.js` — lines 13, 51, 102
- `backend/controllers/request.controller.js` — lines 733–734
- `backend/controllers/user.controller.js` — lines 351, 426, 577, 652
- `backend/controllers/comment.controller.js` — lines 117, 183, 245, 333
- `backend/controllers/notification.controller.js` — line 7
- `backend/controllers/message.controller.js` — line 11
- `backend/services/recommendation.service.js` — line 57
