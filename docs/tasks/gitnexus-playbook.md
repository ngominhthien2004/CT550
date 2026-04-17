# GitNexus Playbook (MEVN Starter)

Mục tiêu: chuẩn hóa cách agent sử dụng GitNexus trong luồng làm việc của repo này.

## 1) Phạm vi

- Áp dụng cho task fullstack và backend-first theo AGENTS.md.
- GitNexus được xem là lớp remote/repo hosting; workflow commit/push vẫn theo git chuẩn.

## 2) Phân vai Agent

| Agent                    | Vai trò với GitNexus                                            | Không nên làm                        |
| ------------------------ | --------------------------------------------------------------- | ------------------------------------ |
| gem-orchestrator         | Tạo chiến lược branch, chốt PR gate, quyết định merge           | Trực tiếp code nhỏ lẻ từng file      |
| gem-implementer          | Commit/push hằng ngày, cập nhật nhanh theo từng lát cắt feature | Tự ý đổi branch strategy đã chốt     |
| gem-researcher           | Tạo đề xuất API và commit nếu được giao branch riêng            | Push thẳng `main`                    |
| gem-designer             | Commit frontend theo branch được giao                           | Push code backend không liên quan    |
| gem-reviewer             | Review rủi ro index/query và gate chất lượng                    | Sửa luồng release/merge policy       |
| gem-documentation-writer | Ghi PR/commit vào báo cáo, chốt dấu vết release                 | Đứng làm owner của branch code chính |

## 3) Workflow đề xuất

### A. Fullstack task

1. Research & Plan (Owner: gem-orchestrator)

- Tạo branch feature từ `main` (ví dụ: `feat/auth-profile-follow`).
- Cập nhật `docs/tasks/feature-tracker.md` -> `Planned`/`In Progress`.
- Push branch lên GitNexus để mở đường phối hợp.

2. Start Implementation (Owner chính: gem-implementer)

- Làm theo lát cắt nhỏ: BE/DB trước, FE sau (nếu backend-first).
- Mỗi lát cắt đặt mốc: commit rõ nghĩa + push ngay.
- Nếu có handoff specialist, mỗi specialist làm trên branch được giao, xong thì gửi lại qua commit/PR.

3. Finalize & Report (Owner: gem-orchestrator + gem-documentation-writer)

- Chạy validation cần thiết (build/test/lint theo mức có sẵn).
- Đảm bảo PR clean, commit message dễ đọc.
- Cập nhật `docs/tasks/feature-tracker.md` với link PR/commit + kết quả validation.

4. Merge & Close

- Merge vào `main` theo gate đã chốt.
- Đóng branch feature trên GitNexus nếu không dùng nữa.
- Chốt trạng thái feature -> `Done`.

### B. Backend-first task

1. Khởi động với gem-implementer (chỉ rõ: bootstrap hay feature).
2. Tạo branch feature, push branch sớm.
3. Hoàn tất backend + validation backend.
4. Nếu cần FE, handoff cho gem-designer trên cùng feature branch hoặc PR phụ.
5. Chốt PR tổng, merge, cập nhật tracker.

## 4) Quy ước branch và commit

- Branch:
- `feat/<scope>-<short-name>`
- `fix/<scope>-<short-name>`
- `chore/<scope>-<short-name>`

- Commit:
- Ưu tiên định dạng rõ ràng, ví dụ: `feat(auth): add refresh token endpoint`
- 1 commit = 1 ý chính, tránh commit quá lớn.

## 5) Nhịp push để tránh mất tiến độ

- Push sau mỗi mốc hoàn thành nhỏ (không ôm local quá lâu).
- Trước khi handoff agent, bắt buộc push + ghi rõ commit hash mới nhất.
- Không force-push branch chung; nếu bắt buộc force-push branch cá nhân, phải thông báo owner.

## 6) Checklist nhanh trước merge

- Branch đúng naming convention.
- Feature tracker đã cập nhật status + PR/commit.
- Không có file nhạy cảm (secret, token, `.env`) trong commit.
- Build/test/lint tối thiểu đã chạy (mức phù hợp với task).
- Có ghi chú ngắn về rủi ro còn lại (nếu có).

## 7) Anti-pattern cần tránh

- Nhiều agent cùng push 1 nhánh trong cùng thời điểm mà không có owner.
- Gom nhiều feature không liên quan vào 1 branch.
- Để `pending push` trong tracker quá lâu sau khi đã xong code.
- Merge khi chưa cập nhật validation evidence.
