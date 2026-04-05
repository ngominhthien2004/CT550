# Frontend Page Checklist

Muc tieu: theo doi danh sach trang frontend da co va cac trang can xay dung tiep theo tu feature tracker.

## Tong quan
- Total pages tracked: 26
- Last updated: 2026-04-05
- Owner: Expert Vue.js Frontend Engineer

## Hien tai (Da co)
- [x] HomePage - `/` - trang chu discovery + tags + hero
- [x] FeedView - `/feed` - explore artwork + search/filter type
- [x] BookmarksView - `/bookmarks` - danh sach bookmark cua user
- [x] RankingsView - `/rankings` - ranking theo period
- [x] ArtworkDetailView - `/artworks/:id` - chi tiet artwork + related
- [x] ArtworkCommentsView - `/artworks/:id/comments` - danh sach comment theo artwork
- [x] TagDetailView - `/tags/:tagName` - danh sach artwork theo tag
- [x] NotFoundView - `/:pathMatch(.*)*` - trang loi route khong ton tai
- [x] MessagesView - `/messages` - trang tam cho message center
- [x] NotificationsView - `/notifications` - trang tam cho thong bao
- [x] AccountView - `/account` - profile/account + session info + logout
- [x] SignUpView - `/signup` - dang ky tai khoan bang email/password
- [x] LoginView - `/login` - dang nhap tai khoan bang email/password

## Tuong lai (Theo Feature Tracker)

### Phase 2: Moderation & Reporting Workflow (Planned)
- [ ] ReportCreateView - `/reports/new` - user gui bao cao artwork/comment/user
- [ ] MyReportsView - `/reports` - user theo doi danh sach report da gui
- [ ] ReportDetailView - `/reports/:id` - xem trang thai report va timeline xu ly
- [ ] ModerationQueueView - `/moderation/reports` - hang doi report cho moderator
- [ ] ModerationCaseDetailView - `/moderation/reports/:id` - chi tiet case + hanh dong xu ly

### Phase 3: AI Auto-tagging, Captioning, Recommendation (Planned)
- [ ] UploadAssistantView - `/upload/assistant` - goi y tag/caption AI khi dang bai
- [ ] RecommendationFeedView - `/recommendations` - feed goi y ca nhan hoa
- [ ] RecommendationSettingsView - `/settings/recommendations` - cau hinh goi y
- [ ] CaptionSuggestionHistoryView - `/ai/captions` - lich su caption AI da tao

### Phase 3: AI Detection Labeling + Art Assistant (Planned)
- [ ] AIDetectionReviewView - `/moderation/ai-detection` - review ket qua AI detection
- [ ] ArtworkLabelingView - `/artworks/:id/labels` - gan/kiem tra nhan noi dung
- [ ] ArtAssistantChatView - `/assistant/art` - chat voi tro ly AI cho y tuong ve tranh
- [ ] ArtAssistantSessionView - `/assistant/art/:sessionId` - chi tiet tung phien chat/tu van

## Note
- Danh sach page tuong lai duoc trich tu cac feature Planned trong `docs/tasks/feature-tracker.md`.
- HomePage hien su dung artwork moi nhat tu API (`/api/artworks?limit=24`), khong phu thuoc seed mock.
- Truoc khi implement tung page, can bo sung contract API + route guard + metadata dieu huong.
- Uu tien thu tu: Moderation/Reporting truoc, sau do den AI pages.
