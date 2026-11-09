# IlluWrl

Nền tảng chia sẻ và khám phá tranh minh họa, manga/comic và tiểu thuyết trực tuyến. IlluWrl kết hợp thư viện tác phẩm, tính năng mạng xã hội, công cụ sáng tạo và hệ thống bán sách số.

## Tính năng chính

- Đăng ký, đăng nhập bằng email, Google OAuth và Facebook OAuth.
- Đăng tải illustration, manga/comic, GIF và novel; hỗ trợ gallery nhiều ảnh.
- Like, bookmark, follow, comment, notification và nhắn tin trực tiếp.
- Tìm kiếm theo từ khóa, tag, loại nội dung, độ tuổi và nhiều tiêu chí sắp xếp.
- Trang khám phá, bảng xếp hạng, tác phẩm liên quan và đề xuất nội dung.
- Quản lý series, chương truyện và tiến độ đọc novel.
- Hệ thống commission/request giữa người sáng tạo và người đặt hàng.
- Công cụ vẽ trực tuyến dựa trên Konva.js.
- AI search, AI recommendation, AI summarize và AI art assistant.
- Quản trị người dùng, tác phẩm, bình luận, tag và báo cáo vi phạm.
- Book service hỗ trợ sách số, giỏ hàng, đơn hàng và thanh toán Stripe.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | Vue 3, Vite, Pinia, Vue Router, Vue I18n, Bootstrap |
| Backend | Node.js, Express 5, Socket.IO |
| Book service | Node.js, Express |
| Database | MongoDB với Mongoose |
| Media | Cloudinary và Multer |
| Authentication | JWT, bcrypt, Passport OAuth |
| AI và đồ họa | Ollama/OpenAI-compatible API, Google Cloud Vision, Konva.js |
| Deployment | Render, Cloudflare Workers |

## Cấu trúc repository

```text
.
├── frontend/       # Ứng dụng Vue 3
├── backend/        # API chính và xác thực
├── book-service/   # Microservice bán sách số
├── docs/           # Tài liệu yêu cầu, kiến trúc và dữ liệu
├── scripts/        # Script hỗ trợ phát triển và tài liệu
├── render.yaml     # Cấu hình triển khai Render
└── design.md       # Design system của dự án
```

## Yêu cầu

- Node.js 18+ và npm
- MongoDB hoặc MongoDB Atlas
- Git
- Tùy chọn: Cloudinary, Stripe, Google OAuth/Facebook OAuth, Google Cloud Vision và Ollama

## Cài đặt và chạy local

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend mặc định chạy tại `http://localhost:5000`.

### 2. Frontend

Mở terminal mới:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend mặc định chạy tại `http://localhost:5173`.

### 3. Book service

Mở terminal khác:

```bash
cd book-service
cp .env.example .env
npm install
npm run dev
```

Book service mặc định chạy tại `http://localhost:5001`. Trong môi trường local, `MONGODB_URI` và `JWT_SECRET` của service cần tương thích với backend để dùng chung xác thực; xem thêm hướng dẫn trong [`book-service/README.md`](book-service/README.md).

## Cấu hình môi trường

Các file mẫu:

- [`backend/.env.example`](backend/.env.example)
- [`frontend/.env.example`](frontend/.env.example)
- [`book-service/.env.example`](book-service/.env.example)

Tối thiểu cần cấu hình `MONGODB_URI` và `JWT_SECRET` cho backend. Không commit file `.env` hoặc bất kỳ secret nào vào repository.

Các tích hợp tùy chọn như OAuth, Cloudinary, Stripe, Google Vision và AI provider chỉ hoạt động khi khai báo các biến tương ứng trong file môi trường.

## Scripts hữu ích

### Frontend

```bash
npm run dev
npm run build
npm run lint
```

### Backend

```bash
npm run dev
npm start
npm test
npm run lint
```

### Book service

```bash
npm run dev
npm start
npm test
```

## Triển khai

Repository có sẵn [`render.yaml`](render.yaml) cho ba dịch vụ:

- `CT550`: backend API
- `CT550-Frontend`: frontend tĩnh
- `CT550-BookService`: book-service

Khi triển khai, cần cấu hình các environment group trên Render, đặc biệt là MongoDB, JWT, CORS, URL frontend và các secret của dịch vụ bên thứ ba. Backend proxy các request `/api/book-service/*` tới book-service thông qua `BOOK_SERVICE_URL`.

## Tài liệu

- [Tổng quan và danh sách chức năng](docs/project-overview.md)
- [Kiến trúc layout](docs/layout-architecture.md)
- [Data dictionary](docs/data-dictionary.md)
- [MongoDB schema](docs/mongodb-schema.md)
- [Design system](design.md)
- [Book service](book-service/README.md)

## Đóng góp

1. Tạo branch mới từ `main`.
2. Thực hiện thay đổi và chạy lint/test phù hợp.
3. Tạo pull request với mô tả rõ ràng về thay đổi.

## License

Chưa khai báo license cho repository.
