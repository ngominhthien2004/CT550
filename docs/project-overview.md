# Tổng quan dự án: Hệ thống Chia sẻ Tranh minh họa & Truyện tranh (Pixiv Clone)

Xây dựng hệ thống website chuyên biệt để chia sẻ, lưu trữ và khám phá các tác phẩm minh họa (illustrations), truyện tranh (manga/comic) và tiểu thuyết (novels) trực tuyến, tích hợp các tính năng xã hội và công nghệ AI hiện đại.

## 1. Công nghệ sử dụng
- **Front-end:** Vue.js (Vite, Pinia, Vue Router)
- **Back-end:** Node.js + Express.js
- **Database:** MongoDB (Mongoose)
- **Công nghệ bổ trợ:** CDN cho lưu trữ ảnh, WebGL cho các công cụ vẽ online (nếu có).

## 2. Phân quyền người dùng
- **Khách vãng lai (Guest):** Xem nội dung công khai, tìm kiếm cơ bản, không thể tương tác sâu (like, comment, upload).
- **Người dùng thành viên (Member):** Đăng tải tác phẩm, tương tác đầy đủ (like, bookmark, follow, comment), quản lý gallery cá nhân.
- **Thành viên Premium:** Hưởng các đặc quyền như tìm kiếm nâng cao (lọc theo lượt bookmark), ẩn quảng cáo, xem lịch sử duyệt web chi tiết.
- **Quản trị viên (Admin):** Kiểm duyệt nội dung, quản lý người dùng, theo dõi thống kê hệ thống và xử lý báo cáo vi phạm.

## 3. Danh sách chức năng chi tiết

### A. Quản lý Người dùng (User Management)
- **Đăng ký/Đăng nhập:** Hỗ trợ Email và định hướng tích hợp OAuth (Google, Facebook, Twitter).
- **Hồ sơ Cá nhân (Artist Profile):**
    - Tùy chỉnh Avatar, Cover image, Bio.
    - Liên kết mạng xã hội và Portfolio cá nhân.
    - Thống kê lượt bài đăng, lượt yêu thích và danh sách tác phẩm.
- **Hệ thống Theo dõi (Follow System):** Theo dõi họa sĩ để cập nhật bài đăng mới trên Feed tin tức cá nhân.

### B. Quản lý Tác phẩm (Artwork Management)
- **Đăng tải đa dạng nội dung:**
    - **Illustrations:** Ảnh đơn hoặc bộ sưu tập ảnh (Gallery).
    - **Manga/Comic:** Hỗ trợ xem dạng cuộn hoặc lật trang.
    - **Ugoira:** Định dạng ảnh động dựa trên chuỗi khung hình.
    - **Novels:** Trình soạn thảo và đọc truyện chữ với giao diện tùy chỉnh.
- **Hệ thống Tags nâng cao:**
    - Gắn thẻ đa ngôn ngữ, gợi ý thẻ thông minh.
    - Khóa thẻ (Tag lock) để bảo vệ tính chính xác của dữ liệu.
- **Cài đặt hiển thị & Bảo mật:**
    - Chế độ Công khai/Riêng tư.
    - Phân loại độ tuổi (All ages, R-18, R-18G).
    - Quản lý bản quyền cơ bản cho tác giả.

### C. Tính năng AI tích hợp
- **Auto-tagging & Captioning:** Tự động phân tích hình ảnh để gợi ý tag và tạo mô tả ngắn.
- **AI Recommendation:** Hệ thống "For You" dựa trên embedding hình ảnh và hành vi người dùng.
- **AI Enhancement:** Công cụ nâng cấp độ phân giải (Upscaling) và làm nét ảnh.
- **AI Detection:** Tự động phát hiện và gắn nhãn các tác phẩm được tạo bởi AI (AI-generated labeling).
- **AI Art Assistant:** Chatbot hỗ trợ gợi ý ý tưởng, pose tranh, hoặc phối màu.

### D. Tương tác và Cộng đồng
- **Yêu thích & Lưu trữ:** Bookmark tác phẩm vào các thư mục công khai hoặc riêng tư.
- **Bình luận & Phản hồi:** Tương tác dưới mỗi bài đăng bằng văn bản hoặc emoji.
- **Bảng xếp hạng (Ranking):** Tính toán top tác phẩm theo ngày, tuần, tháng (Daily/Weekly/Monthly).
- **Ủy thác (Commission/Requests):** Hệ thống cho phép người dùng đặt hàng họa sĩ vẽ theo yêu cầu.

### E. Tìm kiếm & Khám phá
- **Bộ lọc nâng cao:** Tìm kiếm theo thẻ, tỉ lệ khung hình, số lượt bookmark (vd: 100+, 500+ users), và thời gian.
- **Khám phá (Discovery):** Thuật toán hiển thị các tác phẩm tương tự (Related Works) dựa trên tag và nội dung.

### F. Quản trị & Kỹ thuật
- **Dashboard quản trị:** Kiểm duyệt nội dung, quản lý người dùng và thống kê lưu lượng.
- **Báo cáo (Report):** Hệ thống xử lý báo cáo vi phạm bản quyền hoặc nội dung không phù hợp.
- **Tối ưu hóa:** Sử dụng CDN để tải ảnh chất lượng cao tốc độ cao.
- **Sự kiện/Cuộc thi (Contests):** Trang chuyên biệt cho các cuộc thi vẽ theo chủ đề.

## 4. Gợi ý Cấu trúc Cơ sở Dữ liệu (Sơ lược)

| Table/Collection | Các trường chính (Fields) |
|---|---|
| **Users** | id, username, email, password_hash, bio, avatar_url, role, isPremium |
| **Artworks** | id, user_id, title, description, type (illust/manga/ugoira), view_count, age_rating |
| **Images** | id, artwork_id, image_path, page_order (cho manga) |
| **Tags** | id, tag_name, usage_count, translations |
| **Bookmarks** | user_id, artwork_id, folder_name, is_private |
| **Follows** | follower_id, following_id |
| **Comments** | id, artwork_id, user_id, content, created_at |