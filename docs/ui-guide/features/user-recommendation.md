# Gợi ý người dùng (User Recommendation) — Gợi ý người dùng theo dõi

## 1. Tổng quan

**Gợi ý người dùng** là hệ thống đề xuất người dùng khác mà bạn có thể muốn theo dõi, sử dụng phương pháp **follow-graph collaborative filtering**:

- **Thuật toán chính (Backend):** Đề xuất người dùng dựa trên những người mà bạn đang theo dõi cũng theo dõi họ.
  - Nếu User A follow User X và User Y
  - Và cả User X lẫn User Y đều follow User Z
  - Thì User Z được đề xuất cho User A
  - Điểm số = `mutualCount` (số lượng người dùng chung)

- **Fallback (Frontend):** Khi API trả về danh sách rỗng (người dùng chưa follow ai), frontend tự suy luận người dùng đề xuất từ dữ liệu artwork — đếm số lượng tác phẩm theo từng user từ kết quả feed chính.

## 2. Giao diện người dùng

### 2.1. Vị trí hiển thị

```
Trang chủ (/) / Trang feed theo loại (/illustrations, /manga, /gifs)
              │
              └── Sidebar (cột phải, sticky)
                  └── HomeRecommendedUsers.vue
                      ├── Heading: "Recommended users"
                      │   + "Artists you may want to follow"
                      │
                      └── Danh sách card (tối đa 9)
                          ├── Avatar người dùng (32×32px)
                          ├── Display name + @username
                          ├── Số lượng artwork
                          └── Nút Follow / Following
```

Hình 1: Vị trí widget gợi ý người dùng ở sidebar phải trên trang chủ và trang feed.

### 2.2. Cấu trúc Card

| Thành phần          | Mô tả                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| **Avatar**          | Ảnh đại diện người dùng, fallback về`no_profile.png` nếu không có                                       |
| **Display name**    | Tên hiển thị (ưu tiên`displayName`, fallback `username`)                                                |
| **Handle**          | `@username`, fallback `@member`                                                                         |
| **Artwork count**   | Số lượng tác phẩm (`item.artworkCount                                                                   |
| **Follow button**   | Nút bo tròn`border-radius: 999px` — trạng thái `not-following` (nền accent) / `following` (nền surface) |
| **Link to profile** | Click vào avatar/name →`/account?user={userId}`                                                         |

### 2.3. Trạng thái và phản hồi

| Trạng thái                   | Hiển thị                                                  |
| ---------------------------- | --------------------------------------------------------- |
| **Loading**                  | Không có skeleton — danh sách rỗng cho đến khi API trả về |
| **Empty (chưa follow ai)**   | Fallback artwork-based: đếm user từ feed                  |
| **Empty (không có artwork)** | `"No recommended users available yet."`                   |
| **Có dữ liệu**               | Grid card với nút Follow/Following                        |
| **Toggling follow**          | Nút bị disable (`:disabled="item._isToggling"`)           |
| **Chưa đăng nhập**           | Nút "Follow" là link đến`/login`                          |

## 3. Kiến trúc kỹ thuật

### 3.1. Tổng quan

```
Frontend (Vue 3 / Pinia)                     Backend (Express 5)
────────────────────────                     ────────────────────

HomePage.vue / TypedHomeFeedView.vue
  │
  ├─→ Khởi tạo: loadHomeArtworks() / loadTypedArtworks()
  │
  ├─→ Gọi API: userApi.getRecommended()
  │     GET /api/users/recommended (JWT)
  │                                  │
  │                                  ▼
  │                        user.controller.getRecommendedUsers()
  │                                  │
  │                           ├─→ Follow.find({follower: userId})
  │                           ├─→ followingIds = myFollows.map(f => f.following)
  │                           │
  │                           ├─→ Nếu followingIds.length === 0 → return []
  │                           │
  │                           ├─→ Aggregate pipeline:
  │                           │     $match: { follower: { $in: followingIds } }
  │                           │     $match: { following: { $nin: [...followingIds, userId] } }
  │                           │     $group: { _id: '$following', mutualCount: { $sum: 1 } }
  │                           │     $sort: { mutualCount: -1 }
  │                           │     $limit: 9
  │                           │     $lookup: users → { username, displayName, avatar }
  │                           │     $project: { _id, username, displayName, avatar, mutualCount }
  │                           │
  │                           └─→ Return [{_id, username, displayName, avatar, mutualCount}]
  │                                  │
  │                                  ▼
  │                           response.json(recommendations)
  │                                  │
  │                                  ▼
  ├─→ Nếu data.length > 0:
  │     recommendedUsers = recRes.data
  │     fetchFollowStatus() cho từng user
  │
  └─→ Nếu data.length === 0 (hoặc lỗi):
        normalizeRecommendedUsers(filteredWorks)
          ├─→ Map<userId, {_id, username, displayName, avatar, artworkCount}>
          ├─→ Loại trừ user hiện tại
          ├─→ Sort by artworkCount descending
          └─→ Slice top 9

Hiển thị:
  ┌─────────────────────────────────────┐
  │ Recommended users                   │
  │ Artists you may want to follow      │
  │                                     │
  │ ┌─────────┬──────────────────────┐  │
  │ │  Avatar │ Display name       F │  │
  │ │  32×32  │ @username    ollow  │  │
  │ │         │ 12 works            │  │
  │ └─────────┴──────────────────────┘  │
  │ ┌─────────┬──────────────────────┐  │
  │ │  Avatar │ Display name       F │  │
  │ │  32×32  │ @username    ollow  │  │
  │ │         │ 8 works             │  │
  │ └─────────┴──────────────────────┘  │
  │ ┌─────────┬──────────────────────┐  │
  │ │  Avatar │ Display name  Followi│  │
  │ │  32×32  │ @username    ng     │  │
  │ │         │ 5 works             │  │
  │ └─────────┴──────────────────────┘  │
  └─────────────────────────────────────┘
```

### 3.2. Xác thực và phân quyền

- API `GET /api/users/recommended` yêu cầu JWT token hợp lệ (`protect` middleware).
- Fallback artwork-based vẫn hoạt động cho user chưa đăng nhập (chỉ dùng dữ liệu feed công khai).
- Khi chưa đăng nhập, nút Follow redirect sang `/login`.

### 3.3. Luồng dữ liệu fallback

```
userApi.getRecommended() → [] hoặc lỗi
              │
              ▼
normalizeRecommendedUsers(artworks)
              │
              ▼
Bước 1: Duyệt từng artwork, lấy trường item.user
Bước 2: Nếu user._id === authStore.user._id → bỏ qua
Bước 3: Gom nhóm theo user._id, tăng artworkCount
Bước 4: Chuyển Map → Array
Bước 5: Sort theo artworkCount giảm dần
Bước 6: Lấy top 9 → recommendedUsers
              │
              ▼
Nếu đã đăng nhập:
  fetchFollowStatus() cho từng user trong danh sách
```

### 3.4. API Endpoints

| Method   | Endpoint                       | Auth | Mô tả                                    |
| -------- | ------------------------------ | ---- | ---------------------------------------- |
| `GET`    | `/api/users/recommended`       | ✅   | Top 9 user đề xuất dựa trên follow graph |
| `POST`   | `/api/users/:id/follow`        | ✅   | Follow một user                          |
| `DELETE` | `/api/users/:id/follow`        | ✅   | Unfollow một user                        |
| `GET`    | `/api/users/:id/follow-status` | ✅   | Kiểm tra trạng thái follow               |
| `GET`    | `/api/users/:id/following`     | ❌   | Danh sách user mà`:id` đang follow       |
| `GET`    | `/api/users/:id/followers`     | ❌   | Danh sách follower của user`:id`         |

## 4. Công thức tương tác

```
mutualCount(user) = số người mà tôi follow cũng follow người này

Ví dụ:
  User A follow: [User X, User Y]
  User X follow: [User Z, User W]
  User Y follow: [User Z, User V]

  → mutualCount(User Z) = 2  (cả User X và User Y)
  → mutualCount(User W) = 1  (chỉ User X)
  → mutualCount(User V) = 1  (chỉ User Y)

  → Kết quả: User Z (điểm cao nhất) → User W / User V
```

Công thức đầy đủ được ghi trong `docs/formulas.md` mục 1.

### Pipeline Backend chi tiết

```javascript
// Step 1: Lấy danh sách user đang follow
const myFollows = await Follow.find({ follower: userId }).select("following");
const followingIds = myFollows.map((f) => f.following);

// Step 2: Nếu không follow ai → return []
if (followingIds.length === 0) return res.json([]);

// Step 3: Aggregate pipeline
const pipeline = [
  { $match: { follower: { $in: followingIds } } },
  { $match: { following: { $nin: [...followingIds, userId] } } },
  { $group: { _id: "$following", mutualCount: { $sum: 1 } } },
  { $sort: { mutualCount: -1 } },
  { $limit: 9 },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "user",
    },
  },
  { $unwind: "$user" },
  {
    $project: {
      _id: "$user._id",
      username: "$user.username",
      displayName: "$user.displayName",
      avatar: "$user.avatar",
      mutualCount: 1,
    },
  },
];
```

### Fallback Frontend chi tiết

```javascript
function normalizeRecommendedUsers(artworks) {
  const userMap = new Map();

  artworks.forEach((item) => {
    const user = item?.user;
    if (!user?._id) return;
    if (authStore.user?._id && user._id === authStore.user._id) return;

    if (!userMap.has(user._id)) {
      userMap.set(user._id, {
        _id: user._id,
        username: user.username || "",
        displayName: user.displayName || user.username || "Unknown user",
        avatar: user.avatar || "",
        artworkCount: 0,
      });
    }

    const current = userMap.get(user._id);
    current.artworkCount += 1;
  });

  recommendedUsers.value = Array.from(userMap.values())
    .sort((a, b) => b.artworkCount - a.artworkCount)
    .slice(0, 9);
}
```

## 5. Các tệp liên quan

| Tệp                                                     | Hàm / Thành phần                                                                         | Mô tả                                                 |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `backend/controllers/user.controller.js`                | `getRecommendedUsers()` (dòng 711)                                                       | Thuật toán follow-graph recommendation                |
| `backend/routes/user.routes.js`                         | Route dòng 83                                                                            | `GET /api/users/recommended` với `protect` middleware |
| `backend/models/Follow.js`                              | —                                                                                        | Mongoose schema cho quan hệ follow                    |
| `frontend/src/components/home/HomeRecommendedUsers.vue` | —                                                                                        | Component UI hiển thị danh sách user đề xuất          |
| `frontend/src/views/HomePage.vue`                       | `normalizeRecommendedUsers()`, `loadHomeArtworks()`, `toggleFollowFromHome()`            | Trang chủ — tích hợp recommend ở sidebar              |
| `frontend/src/views/TypedHomeFeedView.vue`              | `normalizeRecommendedUsers()`, `loadTypedArtworks()`, `toggleFollowFromHome()`           | Feed theo loại — tích hợp recommend ở sidebar         |
| `frontend/src/services/api.js`                          | `userApi.getRecommended()` (dòng 147)                                                    | API client cho endpoint recommended                   |
| `frontend/src/stores/follow.store.js`                   | `fetchFollowStatus()`, `toggleFollowByUser()`, `isFollowingUser()`, `isTogglingFollow()` | Pinia store quản lý trạng thạng follow                |
| `docs/formulas.md`                                      | Mục 1                                                                                    | Công thức và pipeline đầy đủ                          |

## 6. Kịch bản sử dụng mẫu

### Follow-graph recommendation

```
User A follow User X (vẽ fantasy)
User A follow User Y (vẽ sci-fi)
User X follow User Z (cũng vẽ fantasy)
User Y cũng follow User Z

→ GET /api/users/recommended
→ followingIds = [UserX._id, UserY._id]
→ Follow.aggregate:
    $match: { follower: { $in: [UserX._id, UserY._id] } }
    → tìm được: { follower: UserX, following: UserZ }
                  { follower: UserY, following: UserZ }
                  { follower: UserX, following: UserW }
    $group: { UserZ → mutualCount: 2,
              UserW → mutualCount: 1 }
→ UserZ có mutualCount = 2 (cả X và Y đều follow)
→ UserZ xuất hiện đầu danh sách recommend
→ User A thấy "Recommended users"
   Card UserZ: avatar + "User Z" + "@userz" + "15 works" + [Follow]
```

### Empty state — chưa follow ai

```
User A chưa follow ai
→ GET /api/users/recommended
→ followingIds = [] → return []
→ Frontend: nhận data = []
→ Fallback: normalizeRecommendedUsers(filteredWorks)
→ Đếm artwork theo user từ feed (48 artworks)
→ Lấy top 9 users có nhiều artwork nhất
→ Hiển thị danh sách card
```

### Tương tác Follow

```
User A thấy User Z trong recommend list
→ Click "Follow"
→ emit('toggle-follow', UserZ._id)
→ followStore.toggleFollowByUser(UserZ._id)
    ├─→ POST /api/users/UserZ._id/follow (JWT)
    ├─→ Cập nhật followingByUser[UserZ._id] = true
    └─→ Button chuyển từ "Follow" → "Following"
→ User Z vẫn ở trong recommend list (nhưng button đã đổi)

User A click "Following" lần nữa
→ emit('toggle-follow', UserZ._id)
→ followStore.toggleFollowByUser(UserZ._id)
    ├─→ DELETE /api/users/UserZ._id/follow (JWT)
    ├─→ Cập nhật followingByUser[UserZ._id] = false
    └─→ Button chuyển từ "Following" → "Follow"
→ Lần sau load lại trang, User Z vẫn có thể xuất hiện nếu còn mutualCount
```

## 7. Ghi chú kỹ thuật

- **Giới hạn tối đa**: Luôn trả về/và hiển thị tối đa **9** user.
- **Loại trừ**: API tự động loại trừ user hiện tại và những user đã follow.
- **Fallback chỉ dùng dữ liệu có sẵn**: Không gọi API riêng — dùng lại kết quả `getArtworks()` đã gọi cho feed.
- **Follow status tracking**: Sau khi nhận danh sách recommend, frontend gọi `fetchFollowStatus()` cho từng user để hiển thị đúng trạng thái nút Follow/Following.
- **Toggling state**: Khi đang xử lý follow/unfollow, nút bị disable để tránh double-click.
- **Component stateless**: `HomeRecommendedUsers.vue` là pure presentational component — nhận props và emit events, không quản lý state riêng.
- **Không caching**: Danh sách recommend được tính toán lại mỗi lần load trang.
