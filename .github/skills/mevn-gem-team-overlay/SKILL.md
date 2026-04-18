---
name: mevn-gem-team-overlay
description: "Bổ sung các bước bắt buộc theo workflow nội bộ khi chạy gem-team: backend-first, validation tối thiểu, artifact UI, và cập nhật tracker/report."
---

# MEVN Gem-Team Overlay

## Use when
- Dùng khi triển khai tính năng bằng gem-team trong repo này.
- Dùng khi cần ép agent tuân thủ checklist nội bộ trước khi kết thúc task.

## Workflow overlay (áp dụng sau workflow mặc định của gem-team)
1. Xác nhận phạm vi và điểm chạm:
   - Backend: routes/controllers/models/middlewares
   - Frontend: views/components/stores/services/router
2. Ưu tiên backend-first nếu thay đổi cả API và UI:
   - Chốt contract backend trước
   - Tích hợp frontend sau
3. Validation tối thiểu bắt buộc:
   - Chạy get_errors trên file sửa
   - Chạy build frontend (`npm run build` trong frontend)
   - Nếu có thay đổi backend quan trọng: smoke start backend
4. Nếu có thay đổi UI:
   - Chạy UI smoke route bị ảnh hưởng
   - Chụp screenshot theo chuẩn `test-artifacts/screenshots/<feature>/`
5. Cập nhật tài liệu vận hành:
   - `docs/tasks/feature-tracker.md`
   - Checklist liên quan trong `docs/tasks/`
   - Báo cáo trong `docs/reports/` nếu task yêu cầu

## UI/UX augmentation cho gem-designer
- Khi task là thiết kế UI/UX (layout, theme, typography, design system), yêu cầu `gem-designer` nạp thêm:
   - `.github/prompts/ui-ux-pro-max/PROMPT.md`
   - Dữ liệu trong `.github/prompts/ui-ux-pro-max/data/`
- Nếu cần sinh design system, ưu tiên chạy script local theo đường dẫn repo:
   - `python .github/prompts/ui-ux-pro-max/scripts/search.py "<query>" --design-system`
- Nếu thư mục prompt không tồn tại trong máy hiện tại, fallback về quy chuẩn có sẵn trong `gem-designer` + design system hiện hữu của dự án.

## Done criteria
- Code đúng phạm vi yêu cầu.
- Validation kỹ thuật pass.
- Có evidence UI (nếu có thay đổi UI).
- Tracker/checklist/report được cập nhật phù hợp.

## Notes
- Không sửa trực tiếp file plugin gem-team trong thư mục VS Code extension.
- Tùy biến nên đặt trong repo qua `AGENTS.md`, `.github/copilot-instructions.md`, và local skills.
