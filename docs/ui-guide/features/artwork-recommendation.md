# Artwork Recommendations — Hệ thống gợi ý tác phẩm

## 1. Tổng quan

IlluWrl có **4 hệ thống gợi ý artwork** hoạt động độc lập, mỗi hệ thống dùng thuật toán và nguồn dữ liệu khác nhau:

| Hệ thống | Thuật toán | Nguồn dữ liệu | Hiển thị | Max items |
|----------|-----------|---------------|----------|-----------|
| **For You feed** | Tag affinity + engagement score | Bookmarks, Likes, BrowseHistory | Trang chủ (main feed) | 14 |
| **Similar artworks** | Weighted Jaccard similarity | Likes, Bookmarks, BrowseHistory | Chi tiết artwork "Recommended Works" | 24 |
| **AI recommendations** | Tag frequency + Ollama LLM | Bookmarks | AI chatbot | 10 |
| **Novel recommended** | Engagement score sorting | All novels data | Novel Top Page | 6 |

---

## 2. Hệ thống For You Feed

### 2.1. Thuật toán

**Content-based filtering** kết hợp tag affinity scoring và engagement bonus:

**Bước 1: Xác định tag ưa thích của user**

Thu thập 100 tương tác gần nhất từ 3 nguồn, mỗi nguồn có trọng số riêng:

| Nguồn tương tác | Trọng số mỗi lần |
|-----------------|-------------------|
| Bookmark | 3 |
| Like | 2 |
| Browse | 1 |

Tổng trọng số mỗi tag = sum(weight × count) trên tất cả bookmark + like + browse.

Lấy top 10 tag có trọng số cao nhất → `preferredTags`.

**Bước 2: Tính điểm cho mỗi artwork**

```
score = (tagScore × 5) + (likeCount × 2 + bookmarkCount × 3 + viewCount × 0.1)
```

Trong đó:
- `tagScore` = sum trọng số của user cho các tag mà artwork sở hữu
- Loại trừ artwork của chính user và artwork đã like/bookmark

**Bước 3: Sắp xếp theo score giảm dần, phân trang**

### 2.2. Giao diện

```
Trang chủ (/) — Authenticated
  │
  └── Main feed column (cột đầu tiên)
      └── Heading: "For You"
          └── Grid artworks (tối đa 14)
              ├── Thumbnail (4:3 aspect ratio)
              ├── Title
              ├── Author avatar + name
              └── Like count
```

### 2.3. Trạng thái

| Trạng thái | Hiển thị |
|-----------|----------|
| **Loading** | Skeleton placeholders |
| **Empty (user mới)** | Fallback: recent artworks sorted by likeCount |
| **Có dữ liệu** | Grid artwork cards |
| **Lỗi API** | Fallback về recent artworks |

### 2.4. API

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| `GET` | `/api/feed/for-you?limit=14&page=1` | ✅ | For You personalized feed |

### 2.5. Backend Implementation

**File:** `backend/services/recommendation.service.js`

```javascript
// getPreferredTags(userId, limit=10)
// 1. Lấy 100 bookmark gần nhất → aggregate tag weights (bookmark=3)
// 2. Lấy 100 like gần nhất → aggregate tag weights (like=2)
// 3. Lấy 100 browse gần nhất → aggregate tag weights (browse=1)
// 4. Merge all weights, sort descending, return top 10 tags

// getForYouArtworks(userId, page, limit)
// 1. preferredTags = getPreferredTags(userId)
// 2. Query artworks matching preferred tags
// 3. Exclude user's own + already liked/bookmarked
// 4. Score each: (tagScore × 5) + engagementBonus
// 5. Sort by score descending, paginate
```

**Fallback khi không có preferred tags:**
```javascript
// Return recent artworks sorted by likeCount desc, then createdAt desc
```

---

## 3. Hệ thống Similar Artworks

### 3.1. Thuật toán

**Item-to-item collaborative filtering** sử dụng weighted Jaccard similarity trên sự đồng xuất hiện của user interactions.

**Trọng số tương tác:**

| Tương tác | Trọng số |
|-----------|----------|
| Bookmark | 3 |
| Like | 2 |
| Browse | 0.5 |

**Công thức Jaccard:**

```
score(candidate) = sharedWeight / (weightA + weightB - sharedWeight)
```

Trong đó:
- `weightA` = tổng trọng số của tất cả user đã tương tác với source artwork
- `weightB` = tổng trọng số của tất cả user đã tương tác với candidate artwork
- `sharedWeight` = tổng trọng số của user xuất hiện ở cả hai artwork

**Pipeline:**

1. Lấy tất cả user đã tương tác với source artwork (với accumulated weights = `weightA`)
2. Nếu < 3 unique users → fallback tag-based similarity
3. Batch-fetch tất cả interactions từ các user đó trên mọi artwork
4. Build co-occurrence map: `candidateId → sum shared weights`
5. Tính `weightB` cho mỗi candidate
6. Tính Jaccard score
7. Sort descending, limit top 24

**Fallback (tag-based):**
Khi < 3 users tương tác với source artwork:
- Tìm artwork cùng type, chia sẻ ít nhất 1 tag
- Sort theo số tag chung (desc), rồi likeCount (desc)

### 3.2. Giao diện

```
Trang chi tiết artwork (/artworks/:id)
  │
  └── Below artwork detail card
      └── ArtworkDetailRelatedGrid.vue
          ├── Heading: "Recommended Works"
          └── Grid 3 columns (tối đa 24 items)
              ├── Thumbnail (4:3)
              ├── Title (router-link)
              └── Author name
```

### 3.3. API

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| `GET` | `/api/artworks/:id/similar` | Optional | Similar artworks via Jaccard similarity |

### 3.4. Backend Implementation

**File:** `backend/services/similarity.service.js`

```javascript
// getSimilarArtworks(artworkId, limit=24)
// 1. Source artwork interactions: Like + Bookmark + BrowseHistory
// 2. Group by userId, accumulate weights (bookmark=3, like=2, browse=0.5)
// 3. If uniqueUsers < 3 → fallback to tag-based similarity
// 4. Batch-fetch all interactions from those users
// 5. Build co-occurrence: candidateId → sharedWeight
// 6. Compute weightB for each candidate
// 7. Jaccard score = sharedWeight / (weightA + weightB - sharedWeight)
// 8. Sort descending, return top 24
```

---

## 4. Hệ thống AI Recommendations

### 4.1. Thuật toán

**Tag frequency analysis** kết hợp **Ollama LLM** để tạo response tự nhiên:

**Pipeline (executeRecommendTool):**

1. Query user's bookmarked artworks (up to 20), populate tags
2. Count tag frequencies across all bookmarked artworks
3. Extract top 5 most frequent tags
4. Find up to 10 artworks matching those tags (excluding user's own)
5. Sort by likeCount descending
6. Pass results to Ollama LLM → generates Vietnamese response

**Intent detection:**
Messages chứa keywords: "gợi ý", "đề xuất", "recommend", "suggest", "giới thiệu" → trigger recommend tool.

### 4.2. API

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| `POST` | `/api/ai/recommend` | ✅ | Non-streaming, takes `{ favoriteGenres, description }` |
| `POST` | `/api/ai/agent-chat` | ✅ | Streaming SSE, detects recommend intent |

### 4.3. Hiển thị

```
AI Chat (/ai)
  │
  └── Chatbot interface
      └── User: "Gợi ý cho mình vài bức tranh đẹp"
          └── AI: "Dựa trên sở thích của bạn, mình gợi ý..."
              ├── Artwork 1: Title - Author (link)
              ├── Artwork 2: Title - Author (link)
              └── ... (tối đa 10)
```

---

## 5. Hệ thống Novel Recommended

### 5.1. Thuật toán

**Engagement score sorting** (client-side):

```javascript
// novel.recommendScore = likeCount + bookmarkCount + viewCount × 0.1
// Sort descending, exclude featured novel, take top 6
```

### 5.2. Hiển thị

```
Novel Top Page (/novels)
  │
  └── Section: "Recommended works"
      └── Grid (tối đa 6 novels)
          ├── Cover image
          ├── Title
          └── Author
```

---

## 6. Các tệp liên quan

| Tệp | Mô tả |
|-----|-------|
| `backend/services/recommendation.service.js` | For You feed engine (tag affinity + engagement) |
| `backend/services/similarity.service.js` | Similar artworks engine (Jaccard similarity) |
| `backend/controllers/feed.controller.js` | For You feed endpoint |
| `backend/controllers/artwork.controller.js` | Similar artworks endpoint |
| `backend/controllers/ai.controller.js` | AI recommendations (tool + LLM) |
| `frontend/src/views/HomePage.vue` | For You feed display |
| `frontend/src/views/ArtworkDetailView.vue` | Similar artworks grid |
| `frontend/src/components/artwork/detail/ArtworkDetailRelatedGrid.vue` | Related works UI component |
| `frontend/src/views/AIView.vue` | AI chatbot interface |
| `frontend/src/views/NovelTopPageView.vue` | Novel recommended section |
| `frontend/src/services/api.js` | API client (getSimilarArtworks, etc.) |

---

## 7. So sánh các hệ thống

| Tiêu chí | For You | Similar | AI | Novel |
|----------|---------|---------|-----|-------|
| **Algorithm** | Content-based (tag affinity) | Collaborative (Jaccard) | Hybrid (tags + LLM) | Engagement sort |
| **Personalization** | ✅ Theo user history | ⚠️ Theo artwork context | ✅ Theo bookmark tags | ❌ Global |
| **Backend计算** | ✅ | ✅ | ✅ | ❌ (client-side) |
| **Auth required** | ✅ | Optional | ✅ | ❌ |
| **Real-time** | ✅ (tính mỗi request) | ✅ | ✅ | ❌ (static data) |
| **Fallback** | Recent by likes | Tag-based similarity | — | — |
