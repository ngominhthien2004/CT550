# Backend Feature Checklist

Muc tieu: doi chieu backend API voi frontend de theo doi do phu tinh nang.

## Tong quan
- Last updated: 2026-04-08
- Scope: backend routes/controllers/models parity with frontend views/stores/services

## API Parity Matrix

| Feature | Backend Status | Frontend Status | Notes |
|---|---|---|---|
| Auth register/login | Done | Done | `auth.routes` + SignUp/Login views |
| OAuth login | Stub (501) | Chua tich hop | Defer den social login milestone |
| Artwork CRUD/list/detail | Done | Done | Upload + Feed + Detail |
| Comment create/list/delete | Done | Done | Detail comments flow |
| Bookmark create/list/delete/status/toggle | Done | Done | Detail + Bookmarks page |
| Like create/list/delete/status/toggle | Done | Done | Detail + Favorites page |
| Follow/unfollow/status/followers/following | Done | Done | Follow button detail + account stats |
| Notifications list/mark-read | Done | Done | NotificationsView da dung API |
| Messages inbox/sent/create/mark-read | Done | Done | MessagesView da dung API |
| Rankings/Tags/Feed | Done | Done | Ranking page + tag detail + feed |

## Gap Audit 2026-04-08
- Backend co ma frontend chua co (truoc khi implement): Follow status/follow list API.
- Frontend co ma backend chua co (truoc khi implement): Messages/Notifications page du lieu that.
- Trang thai sau implement: cac gap tren da duoc dong bo.

## Validation Checklist
- [x] Backend start ok (`node server.js`)
- [x] Frontend build ok (`npm run build`)
- [x] API smoke: follow/message/notification endpoints
- [x] MongoDB data check for Message/Notification collections
- [x] UI smoke cho Account, Artwork detail, Messages, Notifications

## Validation Notes (2026-04-08)
- API smoke bang 2 tai khoan `qa_auth_20260405_a` va `qa_auth_20260405_b`: follow status, gui tin nhan, inbox/sent, mark read.
- MongoDB MCP xac nhan schema/index cho `messages` va `notifications`, co document thuc va `isRead/readAt` duoc cap nhat sau khi goi API mark-read.
- UI smoke screenshot da luu: `test-artifacts/screenshots/follow-message-notification/`.
