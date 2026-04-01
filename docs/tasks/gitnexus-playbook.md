# GitNexus Playbook (MEVN Starter)

Muc tieu: chuan hoa cach agent su dung GitNexus trong luong lam viec cua repo nay.

## 1) Pham vi

- Ap dung cho task fullstack va backend-first theo [AGENTS.md](/E:/HocTap/CT550/AGENTS.md).
- GitNexus duoc xem la lop remote/repo hosting; workflow commit/push van theo git chuan.

## 2) Phan vai Agent

| Agent | Vai tro voi GitNexus | Khong nen lam |
|---|---|---|
| Fullstack Workflow Orchestrator | Tao chien luoc branch, chot PR gate, quyet dinh merge | Truc tiep code nho le tung file |
| Implementation Executor | Commit/push hang ngay, cap nhat nhanh theo tung lat cat feature | Tu y doi branch strategy da chot |
| API Architect | Tao de xuat API va commit neu duoc giao branch rieng | Push thang `main` |
| Expert Vue.js Frontend Engineer | Commit frontend theo branch duoc giao | Push code backend khong lien quan |
| mongodb-performance-advisor | Commit tuning index/query khi co phan cong ro | Sua luong release/merge policy |
| Technical Report Writer | Ghi PR/commit vao bao cao, chot dau vet release | Dung lam owner cua branch code chinh |

## 3) Workflow de xuat

### A. Fullstack task

1. Research & Plan (Owner: Fullstack Workflow Orchestrator)
- Tao branch feature tu `main` (vi du: `feat/auth-profile-follow`).
- Cap nhat [feature-tracker.md](/E:/HocTap/CT550/docs/tasks/feature-tracker.md) -> `Planned`/`In Progress`.
- Push branch len GitNexus de mo duong phoi hop.

2. Start Implementation (Owner chinh: Implementation Executor)
- Lam theo lat cat nho: BE/DB truoc, FE sau (neu backend-first).
- Moi lat cat dat moc: commit ro nghia + push ngay.
- Neu co handoff specialist, moi specialist lam tren branch duoc giao, xong thi gui lai qua commit/PR.

3. Finalize & Report (Owner: Fullstack Workflow Orchestrator + Technical Report Writer)
- Chay validation can thiet (build/test/lint theo muc co san).
- Dam bao PR clean, commit message de doc.
- Cap nhat [feature-tracker.md](/E:/HocTap/CT550/docs/tasks/feature-tracker.md) voi link PR/commit + ket qua validation.

4. Merge & Close
- Merge vao `main` theo gate da chot.
- Dong branch feature tren GitNexus neu khong dung nua.
- Chot trang thai feature -> `Done`.

### B. Backend-first task

1. Khoi dong voi Implementation Executor (chi ro: bootstrap hay feature).
2. Tao branch feature, push branch som.
3. Hoan tat backend + validation backend.
4. Neu can FE, handoff cho Expert Vue.js Frontend Engineer tren cung feature branch hoac PR phu.
5. Chot PR tong, merge, cap nhat tracker.

## 4) Quy uoc branch va commit

- Branch:
- `feat/<scope>-<short-name>`
- `fix/<scope>-<short-name>`
- `chore/<scope>-<short-name>`

- Commit:
- Uu tien dinh dang ro rang, vi du: `feat(auth): add refresh token endpoint`
- 1 commit = 1 y chinh, tranh commit qua lon.

## 5) Nhip push de tranh mat tien do

- Push sau moi moc hoan thanh nho (khong om local qua lau).
- Truoc khi handoff agent, bat buoc push + ghi ro commit hash moi nhat.
- Khong force-push branch chung; neu bat buoc force-push branch ca nhan, phai thong bao owner.

## 6) Checklist nhanh truoc merge

- Branch dung naming convention.
- Feature tracker da cap nhat status + PR/commit.
- Khong co file nhay cam (secret, token, `.env`) trong commit.
- Build/test/lint toi thieu da chay (muc phu hop voi task).
- Co ghi chu ngan ve rui ro con lai (neu co).

## 7) Anti-pattern can tranh

- Nhieu agent cung push 1 nhanh trong cung thoi diem ma khong co owner.
- Gom nhieu feature khong lien quan vao 1 branch.
- De `pending push` trong tracker qua lau sau khi da xong code.
- Merge khi chua cap nhat validation evidence.
