# Frontend Page Checklist

Muc tieu: theo doi danh sach trang frontend can co trong phase hien tai.

## Tong quan
- Total pages tracked: 5
- Last updated: 2026-04-04
- Owner: Expert Vue.js Frontend Engineer

## Checklist
- [x] HomePage - `/` - HomePage hero + discovery + ranking preview
- [x] FeedView - `/feed` - feed theo doi tac gia
- [x] BookmarksView - `/bookmarks` - danh sach bookmark cua user
- [x] RankingsView - `/rankings` - ranking theo period
- [x] ArtworkCommentsView - `/artworks/:id/comments` - danh sach comment theo artwork

## Note
- Cac view dang duoc toi gian de de dang tach nho thanh component UI.
- Cac component hien co: `components/feed/FeedList.vue`, `components/bookmarks/BookmarksList.vue`, `components/rankings/RankingsPanel.vue`, `components/comments/CommentList.vue`.

## Backlog UI (Pixiv-inspired)
- [x] HomePage - them nut thu gon thanh ben trai (placeholder)
- [x] HomePage - them top navigation bar co nut dang nhap (placeholder)
- [x] HomePage - giam khoang trang 2 ben giao dien desktop
- [ ] HomePage - lien ket nut "Dang nhap" voi auth flow that su
- [ ] HomePage - luu trang thai thu gon sidebar theo user/session
- [ ] HomePage - them menu top-nav day du (message, notification, profile, upload)
