# Mô tả Use Case — IlluWrl

## Actor: Khách vãng lai (Guest)

- Xem tác phẩm công khai — Khách vãng lai có thể xem tất cả tác phẩm công khai thuộc bốn loại nội dung: illust, manga, gif và novel, mà không cần đăng nhập.
- Tìm kiếm tác phẩm — Khách vãng lai có thể tìm kiếm tác phẩm theo từ khoá, lọc theo thẻ (tags), theo loại nội dung (illust/manga/gif/novel) và theo độ tuổi (sfw/nsfw).
- Xem hồ sơ nghệ sĩ — Khách vãng lai có thể xem thông tin hồ sơ công khai của nghệ sĩ, bao gồm bio, avatar, cover và danh sách tác phẩm đã đăng.
- Giới hạn tương tác — Khách vãng lai không thể thực hiện các tương tác như like, comment, bookmark, đăng tải hay nhắn tin; tất cả đều yêu cầu đăng nhập.

## Actor: Người dùng (Member)

- Đăng ký tài khoản — Người dùng có thể đăng ký tài khoản mới bằng email hoặc thông qua Google OAuth.
- Đăng nhập — Người dùng đăng nhập vào hệ thống bằng email/mật khẩu hoặc tài khoản Google để truy cập đầy đủ chức năng.
- Quản lý hồ sơ — Người dùng có thể chỉnh sửa hồ sơ cá nhân: avatar, ảnh bìa (cover), tiểu sử (bio), liên kết mạng xã hội, giới tính và ngày sinh.
- Đăng tải tác phẩm — Người dùng đăng tải tác phẩm dưới bốn dạng: illust, manga (nhiều ảnh), gif và novel (tiểu thuyết), kèm theo gắn thẻ (tags) và chọn mức độ tuổi (sfw/nsfw).
- Quản lý gallery — Người dùng có thể xem danh sách tác phẩm đã đăng, chỉnh sửa thông tin (tiêu đề, mô tả, thẻ) hoặc xoá tác phẩm của mình.
- Theo dõi / Chặn — Người dùng có thể follow (theo dõi) hoặc unfollow người dùng khác, đồng thời có thể chặn (block) người dùng để không nhận tương tác từ họ.
- Tương tác với tác phẩm — Người dùng có thể like/unlike tác phẩm, bookmark tác phẩm vào thư mục cá nhân, và viết bình luận kèm emoji.
- Đọc novel — Người dùng có thể xem từng chương của novel, chuyển giữa các chương và lưu tiến độ đọc để tiếp tục sau.
- Nhắn tin trực tiếp — Người dùng có thể gửi và nhận tin nhắn riêng tư với người dùng khác, bao gồm đính kèm ảnh trong tin nhắn.
- Ủy thác (Commission) — Người dùng có thể tạo commission term (điều khoản nhận ủy thác), đặt yêu cầu (request), gửi bản nháp (draft), yêu cầu chỉnh sửa (revision), phê duyệt và trò chuyện trực tiếp trong từng commission.
- Công cụ vẽ — Người dùng có thể vẽ trực tiếp trên trình duyệt bằng công cụ vẽ tích hợp dựa trên Konva.js, bao gồm các loại bút, màu sắc và layer cơ bản.
- Trí tuệ nhân tạo (AI) — Người dùng có thể trò chuyện với AI để được gợi ý ý tưởng sáng tác, tìm kiếm tác phẩm bằng ngôn ngữ tự nhiên, hoặc yêu cầu AI tóm tắt nội dung tác phẩm.
- Thông báo — Người dùng nhận thông báo khi có like, follow, comment hoặc request mới liên quan đến tác phẩm hoặc hồ sơ của mình.
- Lịch sử đọc/xem — Người dùng có thể xem lại danh sách các tác phẩm (illust, manga, gif, novel) đã xem hoặc đọc gần đây.

## Actor: Quản trị viên (Admin)

- Đăng nhập quản trị — Quản trị viên đăng nhập bằng tài khoản admin để truy cập bảng điều khiển quản trị.
- Quản lý tác phẩm — Quản trị viên có thể ẩn (hide) hoặc hiện (unhide) tác phẩm vi phạm, và xoá vĩnh viễn tác phẩm khỏi hệ thống khi cần thiết.
- Quản lý thẻ (Tags) — Quản trị viên có thể thêm thẻ mới, chỉnh sửa tên thẻ và bản dịch (translation), gộp các thẻ trùng lặp, hoặc xoá thẻ không còn sử dụng.
- Quản lý người dùng — Quản trị viên có thể thay đổi vai trò người dùng (user/admin) và xoá tài khoản người dùng vi phạm ra khỏi hệ thống.
- Quản lý báo cáo — Quản trị viên xem danh sách báo cáo (report) về tác phẩm hoặc người dùng, và xử lý bằng cách bác bỏ (dismiss), cảnh cáo (warn) hoặc cấm (ban) người dùng vi phạm.
- Dashboard thống kê — Quản trị viên xem bảng thống kê tổng quan gồm số người dùng, số tác phẩm, số bình luận và số báo cáo trong hệ thống.
- Cài đặt hệ thống — Quản trị viên có thể bật/tắt tính năng phát hiện AI (AI detection) và điều chỉnh ngưỡng phát hiện AI (AI detection threshold) để kiểm soát chất lượng nội dung.
