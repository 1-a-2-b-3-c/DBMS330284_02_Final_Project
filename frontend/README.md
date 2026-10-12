# HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ - FRONTEND APPLICATION

> **Công nghệ:** Vite + React + TypeScript + Tailwind CSS + shadcn/ui + Lucide React  
> **Cổng phát triển:** `http://localhost:5173`  
> **Backend API (.NET 8):** `http://localhost:5272` (hoặc cấu hình tại `.env`)  

---

## 1. Khởi chạy dự án

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt thư viện (nếu mới clone)
npm install

# Khởi chạy máy chủ phát triển
npm run dev

# Kiểm tra bản build production
npm run build
```

---

## 2. Phân chia cấu trúc và trách nhiệm phát triển

Toàn bộ dự án đã được cấu hình alias `@/*` trỏ vào `./src/*`.

- **Người A (Phụ trách Nền tảng, Lưu trú & Cổng SV):**
  - `src/api/dormApi.ts` & `src/api/studentApi.ts`
  - `src/layouts/AdminLayout.tsx` & `src/layouts/StudentLayout.tsx`
  - `src/modules/dorm/` (Màn hình Phòng, Sinh viên, Duyệt đơn, Hợp đồng)
  - `src/modules/student/` (Hồ sơ, Đơn đăng ký, Tra cứu phòng, Hợp đồng, Hóa đơn)

- **Người B (Phụ trách Tài chính, Kỷ luật & Quản trị):**
  - `src/modules/finance/` (Màn hình Hóa đơn & Thu phí: kết nối `/api/ktx/taichinh`)
  - `src/modules/violation/` (Màn hình Xử lý Vi phạm: kết nối `/api/ktx/vipham`)
  - `src/modules/admin/` (Màn hình Quản trị Tài khoản & Phân quyền: kết nối `/api/admin/tai-khoan`)

---

## 3. Hướng dẫn sử dụng tài nguyên dùng chung

### 3.1. Gọi API qua `axiosClient`
Toàn bộ request được tự động đính kèm `Authorization: Bearer <token>` và bắt lỗi `{ message: "..." }` hiển thị Sonner Toast:

```typescript
import { axiosClient } from '@/api/axiosClient'

// Gọi GET
const res = await axiosClient.get('/api/ktx/taichinh/hoadon')

// Gọi POST
await axiosClient.post('/api/ktx/taichinh/hoadon', duLieu)
```

### 3.2. Sử dụng UI Components từ `@/components/ui/`
Đã cài đặt sẵn bộ components theo chuẩn shadcn/ui (màu Slate/Zinc):
- `Button`, `Input`, `Card`, `Table`, `Dialog`, `Select`, `Badge`, `Sheet`, `Tabs`, `DropdownMenu`, `Avatar`, `Separator`.
- Thông báo Toast: `import { toast } from 'sonner'`.

### 3.3. Đăng nhập và Quyền hạn
Hệ thống hỗ trợ 2 cơ chế tại trang `/login`:
1. **Đăng nhập thật:** Gọi API `POST /api/auth/dang-nhap` với tài khoản trong SQL Server.
2. **Nút Mock nhanh:** Bấm "Cán bộ QLKTX" hoặc "Sinh viên (SV)" để vào ngay giao diện mà không phụ thuộc DB.
