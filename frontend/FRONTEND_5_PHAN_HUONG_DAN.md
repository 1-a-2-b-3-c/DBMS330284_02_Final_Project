# Frontend 5 phần được giao

Stack: React 19 + TypeScript + Vite + Tailwind CSS, gọi backend ASP.NET Core hiện có.

1. **Đăng nhập/Xác thực**: giao diện và JWT đã tồn tại; giữ nguyên, cải thiện điều hướng theo vai trò. **Quản trị tài khoản** (`/admin/tai-khoan`, ADMIN): liệt kê, lọc, tạo tài khoản quản lý, khóa/mở và reset mật khẩu qua API. Backend không có API chỉnh vai trò tài khoản hiện hữu.
2. **Danh mục khoản thu** (`/admin/khoan-thu`, QLTC): UI CRUD mẫu bằng localStorage; chưa có API khoản thu tương ứng. **Không đồng bộ với database.**
3. **Hóa đơn** (`/admin/tai-chinh`, QLTC): danh sách công nợ, lập hóa đơn, xem/thêm chi tiết, hủy hóa đơn qua API thực. Mã phân phòng/khoản thu cần thuộc SQL database.
4. **Thanh toán/công nợ** (`/admin/thanh-toan`, QLTC): tra cứu công nợ, lọc quá hạn, xuất CSV. **Chưa thể ghi nhận thanh toán thật** vì chưa có API thu tiền.
5. **Vi phạm** (`/admin/vi-pham`, QLKTX): tra cứu, thêm, sửa, thống kê, cập nhật đã xử lý hoặc buộc rời KTX qua API.

## Chạy

- `cd frontend`
- `npm ci`
- `npm run dev`
- Backend: `cd backend && dotnet run`, cấu hình SQL Server trong `backend/appsettings.json` và kết nối API tại `frontend/.env` theo `.env.example`.
- Dùng tài khoản thật có role ADMIN/QLTC/QLKTX (mock token chỉ dùng để xem giao diện, gọi API sẽ bị 401).
- `npm run build` để kiểm tra TypeScript.

## Phần backend cần nhóm bổ sung
- API GET/POST/PUT/PATCH `KhoanThu` với phân quyền QLTC, đơn giá và trạng thái.
- API POST `ThanhToan` ghi nhận số tiền, phương thức, mã giao dịch, chống ghi nhận trùng, và cập nhật số dư hóa đơn trong transaction.
- API đổi vai trò người dùng nếu yêu cầu 'phân vai trò' cho tài khoản đang tồn tại (backend hiện chỉ chọn role khi tạo mới).
- Backend Admin API chỉ nhận role ADMIN; ViPham chỉ QLKTX; TàiChính chỉ QLTC. Không nên mở rộng quyền chỉ bằng frontend.
