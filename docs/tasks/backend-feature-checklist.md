# Backend Feature Checklist

Mục tiêu: đối chiếu backend API với frontend để theo dõi độ phủ tính năng.

## Tổng quan

- Last updated: 2026-04-08
- Scope: backend routes/controllers/models parity with frontend views/stores/services

## API Parity Matrix

| Feature                                    | Backend Status | Frontend Status | Notes                                |
| ------------------------------------------ | -------------- | --------------- | ------------------------------------ |
| Auth register/login                        | Done           | Done            | `auth.routes` + SignUp/Login views   |
| OAuth login                                | Stub (501)     | Chưa tích hợp   | Defer đến social login milestone     |
| Artwork CRUD/list/detail                   | Done           | Done            | Upload + Feed + Detail               |
| Comment create/list/delete                 | Done           | Done            | Detail comments flow                 |
| Bookmark create/list/delete/status/toggle  | Done           | Done            | Detail + Bookmarks page              |
| Like create/list/delete/status/toggle      | Done           | Done            | Detail + Favorites page              |
| Follow/unfollow/status/followers/following | Done           | Done            | Follow button detail + account stats |
| Notifications list/mark-read               | Done           | Done            | NotificationsView đã dùng API        |
| Messages inbox/sent/create/mark-read       | Done           | Done            | MessagesView đã dùng API             |
| Rankings/Tags/Feed                         | Done           | Done            | Ranking page + tag detail + feed     |

## Gap Audit 2026-04-08

- Backend có mà frontend chưa có (trước khi implement): Follow status/follow list API.
- Frontend có mà backend chưa có (trước khi implement): Messages/Notifications page dữ liệu thật.
- Trạng thái sau implement: các gap trên đã được đồng bộ.

## Validation Checklist

- [x] Backend start ok (`node server.js`)
- [x] Frontend build ok (`npm run build`)
- [x] API smoke: follow/message/notification endpoints
- [x] MongoDB data check for Message/Notification collections
- [x] UI smoke cho Account, Artwork detail, Messages, Notifications

## Validation Notes (2026-04-08)

- API smoke bằng 2 tài khoản `qa_auth_20260405_a` và `qa_auth_20260405_b`: follow status, gửi tin nhắn, inbox/sent, mark read.
- MongoDB MCP xác nhận schema/index cho `messages` và `notifications`, có document thực và `isRead/readAt` được cập nhật sau khi gọi API mark-read.
- UI smoke screenshot đã lưu: `test-artifacts/screenshots/follow-message-notification/`.
