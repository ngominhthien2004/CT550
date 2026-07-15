# Feed — Hệ thống nguồn cấp dữ liệu nghệ thuật

## 1. Tổng quan

**Feed System** là hệ thống nguồn cấp dữ liệu trung tâm của IlluWrl, cung cấp bốn chế độ khám phá artwork khác nhau:

- **Following Feed** (`/api/feed`) — Artwork từ người dùng đang follow, auth required.
- **Discovery** (`/api/feed/discovery`) — Duyệt tất cả artwork công khai, không cần auth.
- **For You** (`/api/feed/for-you`) — Gợi ý cá nhân hoá dựa trên sở thích người dùng, auth required.
- **Rankings** (`/api/feed/rankings`) — Bảng xếp hạng theo kỳ (daily/weekly/monthly/rookie), public.

Hệ thống sử dụng cơ chế **tag affinity scoring** cho For You và **sort đa tầng** cho Rankings, đảm bảo nội dung hiển thị phù hợp với từng ngữ cảnh người dùng.

## 2. Giao diện người dùng

### 2.1. HomePage (`/`)

Trang chủ có bố cục ba cột:

```
┌──────────────────────────────────────────────────────┐
│ ┌────────────┐ ┌──────────────────┐ ┌───────────────┐│
│ │ For You    │ │ Main Artwork Grid│ │ Recommended   ││
│ │ (column)   │ │ (spotlight 12 +  │ │ Users (sidebar)││
│ │            │ │  feed 14 items)  │ │              ││
│ │ Chỉ hiển thị│ │                  │ │ Gợi ý follow ││
│ │ khi đăng   │ │ Pagination qua   │ │              ││
│ │ nhập       │ │ API /artworks    │ │              ││
│ └────────────┘ └──────────────────┘ └───────────────┘│
└──────────────────────────────────────────────────────┘
```

| Thành phần | Mô tả |
|------------|-------|
| **For You column** | Chỉ hiển thị khi người dùng đã đăng nhập (`authStore.isAuthenticated`). Gọi `/feed/for-you?limit=14`. Nếu không có dữ liệu hoặc chưa đăng nhập, fallback về feed mặc định (recent popular). |
| **Main Artwork Grid** | Hiển thị 48 artwork từ `/artworks`, chia làm spotlight (12 đầu) và feed (14 tiếp theo). Lọc bỏ novel — novel chỉ hiển thị ở tab riêng. |
| **Recommended Users sidebar** | Gợi ý người dùng để follow. Lấy từ `userApi.getRecommended()` (follow graph) hoặc fallback từ danh sách artwork hiện tại. Sticky ở desktop. |

- **Feed column** chứa `HomeFeedColumn` component — hiển thị artwork từ `displayFeedWorks`.
- Khi đã đăng nhập và có for-you data, `displayFeedWorks` = `forYouWorks`.
- Khi chưa đăng nhập hoặc không có for-you data, `displayFeedWorks` = `feedWorks` (recent popular).

### 2.2. FollowingNewestView (`/newest_by_followed`)

```
┌─────────────────────────────────────────────┐
│  [Tab bar: Recommended / Following / ...]   │
│  [Tag strip]                                │
│                                              │
│  ┌──────────────────┐  ┌──────────────────┐ │
│  │ Artwork Card     │  │ Artwork Card     │ │
│  │ (spotlight 12)   │  │                  │ │
│  └──────────────────┘  └──────────────────┘ │
│  ┌──────────────────┐  ┌──────────────────┐ │
│  │ Artwork Card     │  │ Artwork Card     │ │
│  │ (feed 14+)       │  │                  │ │
│  └──────────────────┘  └──────────────────┘ │
│                                              │
│  Khi không có follow:                        │
│  "No artworks from followed users yet"       │
└─────────────────────────────────────────────┘
```

| Thành phần | Mô tả |
|------------|-------|
| **Following tab** | Tab active trong `HomeTabs` khi ở route `/newest_by_followed` |
| **Spotlight works** | 12 artwork đầu tiên từ feed |
| **Feed works** | Các artwork còn lại (sau spotlight) |
| **Empty state** | Khi chưa follow ai, API trả về `{ artworks: [], total: 0 }` — view hiển thị thông báo "No artworks from followed users yet" |

- Dữ liệu lấy từ `getFeed({ limit: 48 })`.
- Artwork được populate với thông tin user (`username`, `displayName`, `avatar`) và tags (`name`).

### 2.3. DiscoveryView (`/discovery`)

```
┌─────────────────────────────────────────────────┐
│  Page Title: "Discovery"                         │
│                                                   │
│  [Tab bar: All / Illustrations & Manga / GIF / Novel] │
│                                                   │
│  [Date Range Picker]  [R18 Filter: All / R18]    │
│                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Artwork  │ │ Artwork  │ │ Artwork  │          │
│  │ Card     │ │ Card     │ │ Card     │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Artwork  │ │ Artwork  │ │ Artwork  │          │
│  │ Card     │ │ Card     │ │ Card     │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│                                                   │
│  [Pagination: < 1 2 3 4 5 ... >]                  │
└─────────────────────────────────────────────────┘
```

| Tab | Query param `type` | Mô tả |
|-----|-------------------|-------|
| **Illustrations** | `illust` | Chỉ artwork loại illustration |
| **Manga** | `manga` | Chỉ artwork loại manga |
| **GIF** | `gif` | Chỉ artwork loại GIF |
| **Novels** | `novel` | Chỉ artwork loại novel |

| Bộ lọc | Mô tả |
|--------|-------|
| **Date range picker** | Chọn khoảng thời gian (from/to), truyền qua query params `from` và `to` cho `buildDateFilter()` |
| **R18 filter** | Lọc theo age rating: `all` (mặc định, ẩn R18) hoặc `r18` |

- `limit = 30` artwork mỗi trang.
- Pagination qua router push (`/discovery?type=illust&page=2`).
- Sắp xếp theo `createdAt: -1` (mới nhất trước).

### 2.4. RankingsView (`/rankings`)

```
┌──────────────────────────────────────────────────────┐
│  Page Title: "Rankings"                               │
│                                                        │
│  [Period tabs: Daily / Weekly / Monthly / Rookie]      │
│  [Type tabs: Overall / Illustrations / Manga / Novels] │
│                                                        │
│  ┌── #1 ──────────────────────────────────────────┐   │
│  │ [Artwork Card]  Like ♥ 1.2K  Bookmark 🔖 856   │   │
│  │                 View 👁 15.3K                   │   │
│  └────────────────────────────────────────────────┘   │
│  ┌── #2 ──────────────────────────────────────────┐   │
│  │ [Artwork Card]  Like ♥ 980   Bookmark 🔖 612   │   │
│  │                 View 👁 10.1K                   │   │
│  └────────────────────────────────────────────────┘   │
│  ...                                                  │
│                                                        │
│  [Load more button — infinite scroll]                  │
└──────────────────────────────────────────────────────┘
```

| Period | Query param | Khoảng thời gian |
|--------|-------------|------------------|
| **Daily** | `daily` | 24 giờ qua |
| **Weekly** | `weekly` | 7 ngày qua |
| **Monthly** | `monthly` | 30 ngày qua |
| **Rookie** | `rookie` | Artwork từ user tạo trong 30 ngày qua |

| Type | Query param `type` | Mô tả |
|------|-------------------|-------|
| **Overall** | `all` (hoặc undefined) | Tất cả loại |
| **Illustrations** | `illust` | Chỉ illustration |
| **Manga** | `manga` | Chỉ manga |
| **Novels** | `novel` | Chỉ novel |

- Sort order: `likeCount: -1` → `bookmarkCount: -1` → `viewCount: -1` → `createdAt: -1`.
- `limit = 50` artwork mỗi trang, hỗ trợ load more (append mode).
- Mỗi artwork card hiển thị: rank number, like count, bookmark count, view count.

## 3. Kiến trúc kỹ thuật

### 3.1. Tổng quan

```
Frontend (Vue 3 / Pinia)                    Backend (Express 5)
────────────────────────                    ─────────────────

HomePage.vue
  │ GET /feed/for-you (auth)
  └─→ feed.controller.getForYou()
        └─→ recommendation.service.getForYouArtworks()
              ├─→ getPreferredTags()
              │     ├─→ Bookmark.find (weight 3)
              │     ├─→ Like.find (weight 2)
              │     └─→ BrowseHistory.find (weight 1)
              ├─→ Score: (tagScore × 5) + engagementScore
              ├─→ Exclude: user's own + bookmarked + liked
              └─→ Fallback: recent popular (likeCount desc)

FollowingNewestView.vue
  │ GET /feed (auth)
  └─→ feed.controller.getFeed()
        ├─→ Follow.find({ follower: userId })
        └─→ Artwork.find({ user: { $in: followingIds } })
              .sort({ createdAt: -1 })

DiscoveryView.vue
  │ GET /feed/discovery
  └─→ feed.controller.getDiscovery()
        ├─→ buildDateFilter(req.query)
        └─→ Artwork.find(filter).sort({ createdAt: -1 })

RankingsView.vue
  │ GET /feed/rankings
  └─→ feed.controller.getRankings()
        ├─→ Period filter (daily/weekly/monthly/rookie)
        └─→ Artwork.find(filter)
              .sort({ likeCount: -1, bookmarkCount: -1,
                      viewCount: -1, createdAt: -1 })
```

### 3.2. Xác thực và phân quyền

| Endpoint | Middleware | Mô tả |
|----------|-----------|-------|
| `GET /api/feed` | `protect` | Yêu cầu JWT — lấy following list của user |
| `GET /api/feed/discovery` | Không | Public — không cần auth |
| `GET /api/feed/for-you` | `protect` | Yêu cầu JWT — cá nhân hoá theo userId |
| `GET /api/feed/rankings` | Không | Public — không cần auth |

- Các endpoint có `protect` sẽ trả về `401 Unauthorized` nếu không có token hợp lệ.
- `getForYou()` kiểm tra `req.user` và trả về 401 nếu không tồn tại.

### 3.3. API Endpoints

| Method | Endpoint | Auth | Query params | Response |
|--------|----------|------|-------------|----------|
| `GET` | `/api/feed` | ✅ | `page`, `limit` (mặc định 20) | `{ artworks[], total, page, pages }` |
| `GET` | `/api/feed/discovery` | ❌ | `type`, `page`, `limit` (mặc định 20), `from`, `to` | `{ artworks[], total, page, pages }` |
| `GET` | `/api/feed/for-you` | ✅ | `page`, `limit` (mặc định 20) | `{ artworks[], total, page, pages }` |
| `GET` | `/api/feed/rankings` | ❌ | `period`, `type`, `page`, `limit` (mặc định 50) | `{ period, type, artworks[], total, page, pages }` |

### 3.4. Lưu trữ dữ liệu

#### Artwork (MongoDB — schema `Artwork`)

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `user` | ObjectId (ref: User) | Tác giả |
| `type` | String (`illust`/`manga`/`gif`/`novel`) | Loại artwork |
| `tags` | [ObjectId] (ref: Tag) | Danh sách tag |
| `images` | [String] | Đường dẫn ảnh |
| `likeCount` | Number | Số lượt thích |
| `bookmarkCount` | Number | Số lượt bookmark |
| `viewCount` | Number | Số lượt xem |
| `isHidden` | Boolean | Ẩn artwork (lọc trong rankings/discovery) |
| `createdAt` | Date | Ngày tạo |

#### Follow (MongoDB)

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `follower` | ObjectId (ref: User) | Người follow |
| `following` | ObjectId (ref: User) | Người được follow |

#### Bookmark / Like / BrowseHistory (MongoDB)

Các model này được `recommendation.service.js` sử dụng để tính tag preference:

| Model | Weight | Mô tả |
|-------|--------|-------|
| `Bookmark` | 3 | Trọng số cao nhất — hành động bookmark thể hiện sở thích mạnh |
| `Like` | 2 | Trọng số trung bình — lượt thích |
| `BrowseHistory` | 1 | Trọng số thấp — chỉ xem qua |

## 4. Chi tiết xử lý từng endpoint

### 4.1. Following Feed (`GET /api/feed`)

```
Request (có JWT)
  │
  ▼
Lấy page, limit từ query params (mặc định page=1, limit=20)
  │
  ▼
Follow.find({ follower: req.user._id })
  → followingIds = [list of userIds]
  │
  ├── Nếu followingIds rỗng → trả về { artworks: [], total: 0, page, pages: 0 }
  │
  ▼
Artwork.find({ user: { $in: followingIds } })
  .populate('user', 'username displayName avatar')
  .populate('tags', 'name')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  │
  ▼
Trả về { artworks, total, page, pages }
```

- Sắp xếp theo `createdAt: -1` — artwork mới nhất từ người dùng đang follow lên đầu.
- Populate đầy đủ thông tin user và tag để hiển thị card.

### 4.2. Discovery (`GET /api/feed/discovery`)

```
Request (không auth)
  │
  ▼
Parse params: page, limit, type
  │
  ▼
Xây dựng filter:
  ├── Nếu type hợp lệ (khác 'all' / 'undefined') → { type }
  └── Object.assign(filter, buildDateFilter(req.query))
      ├── Nếu có query.from và query.to → filter.createdAt = { $gte, $lte }
      └── Nếu không → không giới hạn ngày
  │
  ▼
Artwork.find(filter)
  .populate('user', 'username displayName avatar')
  .populate('tags', 'name')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  │
  ▼
Trả về { artworks, total, page, pages }
```

### 4.3. For You (`GET /api/feed/for-you`)

Xem công thức tính điểm đầy đủ tại `docs/formulas.md`.

```
Request (có JWT)
  │
  ▼
getForYouArtworks(userId, page, limit)
  │
  ▼─ getPreferredTags(userId, limit=10)
  │   │
  │   ├── Bookmark.find({ user: userId })
  │   │     → populate artwork.tags → mỗi tag +3
  │   │
  │   ├── Like.find({ user: userId })
  │   │     → populate artwork.tags → mỗi tag +2
  │   │
  │   ├── BrowseHistory.find({ user: userId })
  │   │     → populate artwork.tags → mỗi tag +1
  │   │
  │   └── Sort tags by weight desc → top 10 tags
  │
  ├── Nếu preferredTagIds rỗng:
  │     → Fallback: Artwork.find().sort({ likeCount: -1, createdAt: -1 })
  │       (popular recent — không có cá nhân hoá)
  │
  ├── Loại trừ artwork:
  │     ├── Artwork của user (Artwork.find({ user: userId }))
  │     ├── Đã bookmark (Bookmark.find({ user: userId }))
  │     └── Đã like (Like.find({ user: userId }))
  │
  ├── Tìm artwork khớp tag:
  │     Artwork.find({
  │       _id: { $nin: excludeIds },
  │       tags: { $in: preferredTagIds },
  │       isHidden: { $ne: true }
  │     })
  │
  ├── Tính điểm từng artwork:
  │     const tagWeightMap = new Map(tagId → weight)
  │
  │     for (artwork in artworks) {
  │       tagScore = sum(tagWeightMap[tag._id])  // tổng weight các tag khớp
  │       engagementScore = likeCount × 2 + bookmarkCount × 3 + viewCount × 0.1
  │       totalScore = tagScore × 5 + engagementScore
  │     }
  │
  ├── Sort by totalScore desc
  │
  └── Áp dụng pagination: scored.slice(skip, skip + limit)
      Trả về { artworks: paginated, total, page, pages }
```

**Công thức điểm:**

```
totalScore = (tagScore × 5) + (likeCount × 2 + bookmarkCount × 3 + viewCount × 0.1)
```

- **tagScore**: Tổng weight của các tag artwork khớp với preferred tags. Weight từ bookmark (3), like (2), browse (1).
- **engagementScore**: likeCount × 2 + bookmarkCount × 3 + viewCount × 0.1.
- Hệ số **×5** cho tagScore đảm bảo tag affinity đóng vai trò chính.
- **Fallback**: Khi user chưa có bookmark/like/browse history, trả về recent popular artwork.

### 4.4. Rankings (`GET /api/feed/rankings`)

```
Request (không auth)
  │
  ▼
Parse params: period, type, page, limit
  │
  ▼
Xác định startDate và filter:
  │
  ├── period = 'daily'   → startDate.setDate(startDate.getDate() - 1)
  ├── period = 'weekly'  → startDate.setDate(startDate.getDate() - 7)
  ├── period = 'monthly' → startDate.setMonth(startDate.getMonth() - 1)
  ├── period = 'rookie'  → 
  │     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  │     rookieUsers = User.find({ createdAt: { $gte: thirtyDaysAgo } })
  │     filter.user = { $in: rookieUserIds }
  │
  filter.isHidden = { $ne: true }
  Nếu type !== 'all' → filter.type = type
  │
  ▼
Artwork.find(filter)
  .populate('user', 'username displayName avatar')
  .populate('tags', 'name')
  .sort({ likeCount: -1, bookmarkCount: -1, viewCount: -1, createdAt: -1 })
  .skip(skip)
  .limit(limit)
  │
  ▼
Trả về { period, type, artworks, total, page, pages }
```

**Sort order (đa tầng):**

| Thứ tự ưu tiên | Trường | Hướng |
|---------------|--------|-------|
| 1 | `likeCount` | Giảm dần |
| 2 | `bookmarkCount` | Giảm dần |
| 3 | `viewCount` | Giảm dần |
| 4 | `createdAt` | Giảm dần |

## 5. Các tệp liên quan

| Tệp | Hàm / Thành phần | Mô tả |
|-----|------------------|-------|
| `backend/controllers/feed.controller.js` | `getFeed()`, `getDiscovery()`, `getForYou()`, `getRankings()` | Xử lý tất cả feed endpoints |
| `backend/routes/feed.routes.js` | — | Định nghĩa route: `/` (protect), `/discovery`, `/for-you` (protect), `/rankings` |
| `backend/services/recommendation.service.js` | `getPreferredTags()`, `getForYouArtworks()` | Tính tag preference và scoring cho For You |
| `backend/utils/dateFilter.js` | `buildDateFilter()` | Xây dựng MongoDB date range filter từ query params |
| `backend/models/Artwork.js` | — | Schema artwork — likeCount, bookmarkCount, viewCount, isHidden |
| `frontend/src/stores/feed.store.js` | `fetchFeed()`, `fetchRankings()` | Pinia store — state feedItems, rankings, loading, error |
| `frontend/src/views/HomePage.vue` | — | Trang chủ — For You column + artwork grid + recommended users |
| `frontend/src/views/FollowingNewestView.vue` | — | Following feed — artwork từ user đã follow |
| `frontend/src/views/DiscoveryView.vue` | — | Discovery — tabs + date range + pagination |
| `frontend/src/views/RankingsView.vue` | — | Rankings — period/type tabs + load more |
| `frontend/src/services/api.js` | `getFeed()`, `getDiscovery()`, `getRankings()` | API client functions |
| `frontend/src/components/home/HomeFeedColumn.vue` | — | Column hiển thị feed artwork trên HomePage |
| `frontend/src/components/home/HomeArtworkGrid.vue` | — | Grid artwork chính |
| `frontend/src/components/home/HomeRecommendedUsers.vue` | — | Sidebar gợi ý người dùng |
| `frontend/src/components/common/DateRangeFilter.vue` | — | Date range picker cho Discovery |
| `frontend/src/components/rankings/RankingFilters.vue` | — | Period + type tabs cho Rankings |
| `frontend/src/components/rankings/RankingItem.vue` | — | Card artwork trong Rankings (kèm rank + stats) |
| `frontend/src/components/rankings/RankingEmptyState.vue` | — | Empty state khi không có artwork |
| `docs/formulas.md` | — | Công thức tính điểm For You đầy đủ |

## 6. Kịch bản sử dụng mẫu

### Xem feed từ người đang follow

```
User vào `/newest_by_followed`
  → FollowingNewestView gọi getFeed({ limit: 48 })
  → Backend lấy danh sách following → tìm artwork
  → Hiển thị grid artwork sort newest first
  → Nếu chưa follow ai: artworks = [], hiển thị empty state
  → "No artworks from followed users yet"
```

### Khám phá artwork mới

```
User vào `/discovery`
  → Mặc định tab "Illustrations" active (type=illust)
  → Click tab "GIF" → router.push(/discovery?type=gif&page=1)
  → Chọn date range "7 days" → dateRange thay đổi → watch trigger reload
  → getDiscovery({ type: 'gif', page: 1, from: '...', to: '...' })
  → Backend buildDateFilter() thêm $gte/$lte vào filter
  → Hiển thị grid artwork GIF mới nhất trong 7 ngày
```

### For You cá nhân hoá

```
User đã bookmark 5 artwork tag "fantasy" (weight 3 mỗi cái → tagScore = 15)
User đã like 3 artwork tag "fantasy" (weight 2 mỗi cái → tagScore = 6)
  → getPreferredTags trả về fantasy với weight = 15 + 6 = 21
  →
  Tìm artwork fantasy chưa bookmark/like:
  Artwork A: tag fantasy (khớp 1 tag → tagScore = 21), likeCount=100, bookmarkCount=50
    → totalScore = (21 × 5) + (100 × 2 + 50 × 3 + 0) = 105 + 350 = 455
  Artwork B: tag fantasy (khớp 1 tag → tagScore = 21), likeCount=50, bookmarkCount=20
    → totalScore = (21 × 5) + (50 × 2 + 20 × 3 + 0) = 105 + 160 = 265
  →
  Hiển thị Artwork A trước (score cao hơn)
```

### Xem bảng xếp hạng

```
User vào `/rankings`
  → Mặc định period=daily, type=all
  → Click "Weekly" → period = 'weekly'
  → Click "Illustrations" → type = 'illust'
  → loadRankings() gọi fetchRankings({ period: 'weekly', type: 'illust' })
  → Backend:
      startDate = new Date() - 7 days
      filter = { isHidden: { $ne: true }, type: 'illust', createdAt: { $gte: startDate } }
      Artwork.find(filter).sort({ likeCount: -1, bookmarkCount: -1, viewCount: -1, createdAt: -1 })
  → Hiển thị top artwork illustrations trong tuần
  → Scroll xuống cuối → load more (page + 1, append mode)
```

### Fallback For You khi chưa có sở thích

```
User mới đăng ký, chưa bookmark/like/browse artwork nào
  → getPreferredTags trả về mảng rỗng
  → getForYouArtworks fallback:
      Artwork.find({ isHidden: { $ne: true } })
        .sort({ likeCount: -1, createdAt: -1 })
  → Hiển thị artwork phổ biến nhất (theo lượt thích) gần đây
  → Khi user bắt đầu tương tác (bookmark/like), tag preference dần được xây dựng
```

### Rookie rankings

```
User vào `/rankings` → chọn period "Rookie"
  → Backend:
      thirtyDaysAgo = Date.now() - 30 days
      rookieUsers = User.find({ createdAt: { $gte: thirtyDaysAgo } })
      filter.user = { $in: rookieUserIds }
  → Chỉ lấy artwork từ user mới tạo trong 30 ngày qua
  → Sort theo likeCount → bookmarkCount → viewCount → createdAt
  → Tạo sân chơi riêng cho nghệ sĩ mới
```
