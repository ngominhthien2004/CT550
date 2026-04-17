# Agent Execution Workflow (Chuẩn)

Mục tiêu: chuẩn hóa quy trình làm việc của agent cho mỗi feature để tránh sót bước và đảm bảo có bằng chứng kiểm thử.

## 1) Nhận prompt và chốt phạm vi

- Đọc đầy đủ yêu cầu người dùng.
- Chốt rõ done criteria:
  - Feature cần đạt hành vi gì.
  - Route/API nào bị ảnh hưởng.
  - Cần artifact gì (screenshot, report, checklist).

## 2) Phân tích tác động (Backend-first)

- Map ảnh hưởng theo lớp:
  - Frontend: view/component/store/service/router.
  - Backend: route/controller/model/middleware.
  - Data: schema/index/counter/notification side-effect.
- Đối chiếu tài liệu:
  - docs/user-feature-workflows.md
  - docs/user-page-workflows.md
  - docs/tasks/backend-feature-checklist.md

## 3) Triển khai

- Ưu tiên backend contract trước, frontend tích hợp sau.
- Tuân thủ flow:
  - routes -> controllers -> models
  - services/store -> view/component
- Giữ thay đổi tối thiểu, không refactor ngoài phạm vi.

## 4) Validate kỹ thuật

- Bắt buộc chạy:
  - get_errors trên file đã sửa.
  - frontend build (npm run build trong frontend).
- Nếu có backend thay đổi đáng kể:
  - smoke start backend và test nhanh endpoint chính.

## 5) UI smoke bằng Chrome DevTools MCP

- Đăng nhập bằng tài khoản test (ưu tiên theo docs/reports/auth-test-accounts-2026-04-05.md).
- Chạy đúng luồng người dùng bị ảnh hưởng (ví dụ: mở artwork -> comment -> reply).
- Xác nhận trạng thái thành công/thất bại ngay trên UI.

## 6) Chụp screenshot bằng chứng

- Dùng Chrome DevTools MCP screenshot tool.
- Lưu theo chuẩn:
  - test-artifacts/screenshots/<feature>/
- Đặt tên file theo feature + ngày:
  - <feature>-<state>-YYYY-MM-DD.png

## 7) Cập nhật checklist, workflow, report

- Cập nhật tracker/checklist liên quan:
  - docs/tasks/feature-tracker.md
  - docs/tasks/backend-feature-checklist.md
  - docs/tasks/frontend-page-checklist.md
  - docs/process/agent-handoff-phases.md (nếu thay đổi trạng thái phase/handoff)
- Cập nhật docs workflow khi thay đổi behavior:
  - docs/user-feature-workflows.md
  - docs/user-page-workflows.md
- Nếu cần báo cáo học phần/chương:
  - docs/reports/\* theo template trong docs/report-templates/

## 8) Đóng task

- Báo cáo ngắn gọn:
  - Đã làm gì.
  - Validate gì đã pass.
  - Screenshot nằm ở đâu.
  - Gap còn lại (nếu có).
- Chỉ coi là hoàn tất khi:
  - Code pass validate.
  - UI smoke đã chạy.
  - Artifact + checklist/workflow/report đã cập nhật.

## 9) Definition of Done (DoD)

Một task được xem là Done khi đạt đủ:

- [ ] Đúng phạm vi yêu cầu người dùng.
- [ ] Backend/frontend đã đồng bộ contract.
- [ ] get_errors sạch trên file sửa.
- [ ] Frontend build pass.
- [ ] UI smoke chạy bằng Chrome DevTools MCP.
- [ ] Screenshot artifact đã lưu đúng thư mục.
- [ ] Checklist/workflow/report liên quan đã cập nhật.
