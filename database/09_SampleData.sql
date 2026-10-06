USE QuanLyKTX
GO


-- =====================================================================
-- DỮ LIỆU MẪU CHO 17 BẢNG
-- Chạy SAU khi đã chạy các file 01 -> 08 (đủ constraint, trigger, procedure, view).
--
-- CẢNH BÁO: script này XÓA SẠCH dữ liệu hiện có của mọi bảng rồi nạp lại.
-- Chạy lại nhiều lần được, kết quả luôn giống nhau.
--
-- Ngày tháng tính theo ngày chạy script (GETDATE), nên "sắp hết hạn", "quá hạn"
-- luôn đúng dù chạy vào lúc nào.
--
-- TÀI KHOẢN ĐĂNG NHẬP THỬ (mật khẩu đã băm BCrypt, cùng cách backend băm)
--   Sinh viên      tên đăng nhập = mã sinh viên (SV001...SV012), mật khẩu = mã sinh viên
--                  (SV012 bị khóa để thử đăng nhập thất bại)
--   Quản lý KTX    quanlyktx       / 123456   (mã vai trò QLKTX)
--   Quản lý TC     quanlytaichinh  / 123456   (mã vai trò QLTC)
--   Admin          admin           / 123456   (mã vai trò ADMIN)
-- Mã vai trò của sinh viên là SV: đặt "Auth": { "MaVaiTroSinhVien": "SV" } trong appsettings.json.
-- =====================================================================


-- Bước 0: UQ_TaiKhoan_MaSV dạng constraint chỉ cho phép MỘT tài khoản có MaSV = NULL
-- (SQL Server coi các NULL là trùng nhau), nên không thể có nhiều tài khoản nhân viên.
-- Đổi thành unique index chỉ áp dụng cho dòng có MaSV, giống cách đã làm với CCCD.
-- Nên sửa tương tự trong 03_Constraints.sql / 08_Index.sql để dựng lại DB không bị quay về bản cũ.
IF EXISTS (SELECT 1 FROM sys.key_constraints
           WHERE name = 'UQ_TaiKhoan_MaSV' AND parent_object_id = OBJECT_ID('dbo.TaiKhoan'))
BEGIN
    ALTER TABLE dbo.TaiKhoan DROP CONSTRAINT UQ_TaiKhoan_MaSV;
    CREATE UNIQUE INDEX UQ_TaiKhoan_MaSV ON dbo.TaiKhoan(MaSV) WHERE MaSV IS NOT NULL;
    PRINT N'Đã đổi UQ_TaiKhoan_MaSV thành unique index có điều kiện.';
END
GO


-- Bước 1: xóa dữ liệu cũ (theo thứ tự ngược khóa ngoại)
DELETE FROM dbo.ThanhToan;
-- Trigger trg_ChiTietHoaDon_KiemTra chặn xóa chi tiết của hóa đơn đã thanh toán/hủy,
-- nên đưa hóa đơn về 'Chưa thanh toán' trước khi xóa chi tiết.
UPDATE dbo.HoaDon SET TrangThai = N'Chưa thanh toán';
DELETE FROM dbo.ChiTietHoaDon;
DELETE FROM dbo.HoaDon;
DELETE FROM dbo.HopDong;
DELETE FROM dbo.PhanPhong;
DELETE FROM dbo.DangKyKTX;
DELETE FROM dbo.ViPham;
DELETE FROM dbo.TaiKhoan;
DELETE FROM dbo.VaiTro;
DELETE FROM dbo.Phong;
DELETE FROM dbo.LoaiPhong;
DELETE FROM dbo.Khu;
DELETE FROM dbo.KhoanThu;
DELETE FROM dbo.SinhVien;
GO


-- Bước 2: nạp dữ liệu mới (một transaction: lỗi ở đâu thì hủy toàn bộ)
SET XACT_ABORT ON;
BEGIN TRAN;

DECLARE @Today DATE = CAST(GETDATE() AS DATE);
DECLARE @K1 DATE = DATEFROMPARTS(YEAR(DATEADD(MONTH, -1, @Today)), MONTH(DATEADD(MONTH, -1, @Today)), 1);  -- tháng trước
DECLARE @K2 DATE = DATEFROMPARTS(YEAR(DATEADD(MONTH, -2, @Today)), MONTH(DATEADD(MONTH, -2, @Today)), 1);  -- 2 tháng trước

-- 16. VAI TRO
INSERT INTO dbo.VaiTro (MaVaiTro, TenVaiTro) VALUES
    ('SV', N'Sinh viên'),
    ('QLKTX', N'Quản lý KTX'),
    ('QLTC', N'Quản lý tài chính'),
    ('ADMIN', N'Quản trị viên');

-- 2. KHU
INSERT INTO dbo.Khu (MaKhu, TenKhu, MoTa) VALUES
    ('A', N'Khu A', N'Nhà dành cho sinh viên năm nhất, năm hai'),
    ('B', N'Khu B', N'Nhà mới, có thang máy'),
    ('C', N'Khu C', N'Nhà gần cổng chính');

-- 3. LOAI PHONG
INSERT INTO dbo.LoaiPhong (MaLoaiPhong, TenLoaiPhong, SoNguoiToiDa, DonGia, MoTa) VALUES
    ('P2', N'Phòng 2 người', 2, 900000, N'Phòng riêng tư, có điều hòa'),
    ('P4', N'Phòng 4 người', 4, 600000, N'Phòng tiêu chuẩn'),
    ('P6', N'Phòng 6 người', 6, 400000, N'Phòng tiết kiệm');

-- 4. PHONG
SET IDENTITY_INSERT dbo.Phong ON;
INSERT INTO dbo.Phong (MaPhong, SoPhong, MaKhu, MaLoaiPhong, TrangThai) VALUES
    (1, 'A101', 'A', 'P4', N'Hoạt động'),
    (2, 'A102', 'A', 'P4', N'Hoạt động'),
    (3, 'A201', 'A', 'P2', N'Hoạt động'),
    (4, 'B101', 'B', 'P6', N'Hoạt động'),
    (5, 'B102', 'B', 'P6', N'Hoạt động'),
    (6, 'B201', 'B', 'P2', N'Bảo trì'),
    (7, 'C101', 'C', 'P4', N'Hoạt động'),
    (8, 'C102', 'C', 'P4', N'Đóng');
SET IDENTITY_INSERT dbo.Phong OFF;

-- 11. KHOAN THU
SET IDENTITY_INSERT dbo.KhoanThu ON;
INSERT INTO dbo.KhoanThu (MaKhoanThu, TenKhoanThu, DonGiaMacDinh, MoTa, TrangThai) VALUES
    (1, N'Tiền phòng', 600000, N'Tiền phòng theo tháng', 1),
    (2, N'Tiền điện', 3500, N'Đơn giá theo kWh', 1),
    (3, N'Tiền nước', 15000, N'Đơn giá theo m3', 1),
    (4, N'Phí internet', 30000, N'Phí mạng theo tháng', 1),
    (5, N'Phí vệ sinh', 20000, N'Phí vệ sinh khu vực chung', 1),
    (6, N'Phí giữ xe máy', 50000, N'Gửi xe máy theo tháng', 1),
    (7, N'Phụ thu điều hòa', 100000, N'Đã ngưng áp dụng', 0);
SET IDENTITY_INSERT dbo.KhoanThu OFF;

-- 1. SINH VIEN
INSERT INTO dbo.SinhVien (MaSV, HoTen, NgaySinh, GioiTinh, QueQuan, CCCD, SDT, Khoa, NamHoc, DienUuTien) VALUES
    ('SV001', N'Nguyễn Văn An', '2005-03-12', N'Nam', N'Đà Nẵng', '048205000101', '0901000001', N'Công nghệ thông tin', 2, NULL),
    ('SV002', N'Trần Thị Bích', '2006-07-25', N'Nữ', N'Quảng Nam', '049306000102', '0901000002', N'Kinh tế', 1, NULL),
    ('SV003', N'Lê Hoàng Cường', '2004-11-02', N'Nam', N'Quảng Trị', '045204000103', '0901000003', N'Cơ khí', 3, N'Con thương binh/liệt sĩ'),
    ('SV004', N'Phạm Thị Dung', '2005-01-18', N'Nữ', N'Huế', '046305000104', '0901000004', N'Ngoại ngữ', 2, NULL),
    ('SV005', N'Võ Minh Đức', '2004-09-09', N'Nam', N'Quảng Ngãi', '051204000105', '0901000005', N'Công nghệ thông tin', 3, N'Hộ nghèo'),
    ('SV006', N'Đặng Thu Hà', '2006-04-30', N'Nữ', N'Gia Lai', '064306000106', '0901000006', N'Y dược', 1, NULL),
    ('SV007', N'Bùi Quang Huy', '2003-12-15', N'Nam', N'Bình Định', '052203000107', '0901000007', N'Cơ khí', 4, NULL),
    ('SV008', N'Hoàng Thị Lan', '2002-06-21', N'Nữ', N'Nghệ An', '040302000108', '0901000008', N'Kinh tế', 4, N'Hộ cận nghèo'),
    ('SV009', N'Ngô Thanh Long', '2006-02-14', N'Nam', N'Kon Tum', NULL, '0901000009', N'Công nghệ thông tin', 1, N'Vùng sâu vùng xa'),
    ('SV010', N'Đỗ Thị Mai', '2005-08-08', N'Nữ', N'Quảng Bình', '044305000110', '0901000010', N'Ngoại ngữ', 2, NULL),
    ('SV011', N'Lý Minh Nhật', '2005-10-10', N'Khác', N'Đắk Lắk', NULL, '0901000011', N'Y dược', 2, NULL),
    ('SV012', N'Trương Gia Phúc', '2006-05-05', N'Nam', N'Phú Yên', '054206000112', '0901000012', N'Kinh tế', 1, NULL);

-- 17. TAI KHOAN (mật khẩu đã băm BCrypt)
INSERT INTO dbo.TaiKhoan (MaTaiKhoan, TenDangNhap, MatKhauHash, MaSV, MaVaiTro, TrangThai) VALUES
    ('SV001', 'SV001', '$2a$11$EWp9UCblw/nerVEMwtWJYeTeEowAIKGY1IKOtC9xs4uCzvr56K.vy', 'SV001', 'SV', 1),
    ('SV002', 'SV002', '$2a$11$m2YE1x6HgA/nP6zkmFqUcu8xUMpY99T6reykQXX3ZbPwsdp8aa6ZO', 'SV002', 'SV', 1),
    ('SV003', 'SV003', '$2a$11$QDsVs0GjaBI6FRN1PXkofOoGsMmwYEXc8UEUgtYmhU08va0udszdi', 'SV003', 'SV', 1),
    ('SV004', 'SV004', '$2a$11$cSJyA1wV2TCqV/8zNosKpePNicPhmNVvzlJtwGQuNGWqdtBQxUZq6', 'SV004', 'SV', 1),
    ('SV005', 'SV005', '$2a$11$QOZvMAYs0S.TtdIib9/PseFP6d7BpRKZdUbBAdV4EpYh9UIP3orRO', 'SV005', 'SV', 1),
    ('SV006', 'SV006', '$2a$11$ePQzxtQUaJ2pZQ76vC6NE.yPlJ8lc6Yj0XtWBaAY13efsUlYm8qzW', 'SV006', 'SV', 1),
    ('SV007', 'SV007', '$2a$11$aL/qAa02KeCtEdeW6Nl/D.q9GaMUwP5feNJFeXWI1UQFWd1tqbmme', 'SV007', 'SV', 1),
    ('SV008', 'SV008', '$2a$11$jcmtJnLEsoq21h3mm4MlSe4chZ.VJq0hg/kBw82L/S6Yk3.XxZU1q', 'SV008', 'SV', 1),
    ('SV009', 'SV009', '$2a$11$JJYFrLMVh.qqIBNVQb184ezhWIta/MIxOOgaM27O5kzYop8V3v53.', 'SV009', 'SV', 1),
    ('SV010', 'SV010', '$2a$11$PJAhOl/JUC7/2atm19BU6.Y6263elTltS4xye7rnOfPoU6PaXOYmq', 'SV010', 'SV', 1),
    ('SV011', 'SV011', '$2a$11$tmkJ0FQH7aRYl3LQ8cesuOFh7bv6lBhvZzcIf9CzNJ6S6/8Ul8.C6', 'SV011', 'SV', 1),
    ('SV012', 'SV012', '$2a$11$MC5eTUEfP3nKSb/vQajsuucCX6HxaS4urpWaVWRoEI2JMF1YQjrRq', 'SV012', 'SV', 0),
    ('QLKTX01', 'quanlyktx', '$2a$11$xrbsIYak37NIW9Ub0PmpK.ezrAw8NZq6qGWMzGFTNj7WL.2qGUjyG', NULL, 'QLKTX', 1),
    ('QLTC01', 'quanlytaichinh', '$2a$11$55y4rTCM0D2ZMrydrVvC0OSmdHmX91PiclzXvhe6FNB.ks9FKcRmS', NULL, 'QLTC', 1),
    ('ADMIN01', 'admin', '$2a$11$sBr79vh0JPOZ49GEYb4V4.eWD3pVQA3W2.JEUaCD9WnRfsKxWwTjm', NULL, 'ADMIN', 1);

-- 5. DANG KY KTX
SET IDENTITY_INSERT dbo.DangKyKTX ON;
INSERT INTO dbo.DangKyKTX (MaDangKy, MaSV, MaLoaiPhong, NgayDangKy, TrangThai, GhiChu) VALUES
    (1, 'SV001', 'P4', DATEADD(DAY,-50,@Today), N'Đã phân phòng', NULL),
    (2, 'SV002', 'P4', DATEADD(DAY,-50,@Today), N'Đã phân phòng', NULL),
    (3, 'SV003', 'P2', DATEADD(DAY,-50,@Today), N'Đã phân phòng', N'Có giấy xác nhận con liệt sĩ'),
    (4, 'SV004', 'P2', DATEADD(DAY,-50,@Today), N'Đã phân phòng', NULL),
    (5, 'SV005', 'P6', DATEADD(DAY,-50,@Today), N'Đã phân phòng', N'Có giấy xác nhận hộ nghèo'),
    (6, 'SV006', 'P6', DATEADD(DAY,-50,@Today), N'Đã phân phòng', NULL),
    (7, 'SV007', 'P6', DATEADD(DAY,-105,@Today), N'Đã phân phòng', NULL),
    (8, 'SV008', 'P4', DATEADD(DAY,-410,@Today), N'Đã phân phòng', NULL),
    (9, 'SV008', 'P4', DATEADD(DAY,-2,@Today), N'Chờ duyệt', N'Đăng ký lại cho năm học mới'),
    (10, 'SV009', 'P6', DATEADD(DAY,-1,@Today), N'Chờ duyệt', N'Hộ khẩu vùng sâu vùng xa'),
    (11, 'SV010', 'P4', DATEADD(DAY,-5,@Today), N'Đã duyệt', NULL),
    (12, 'SV011', NULL, DATEADD(DAY,-15,@Today), N'Từ chối', N'Hồ sơ chưa đầy đủ');
SET IDENTITY_INSERT dbo.DangKyKTX OFF;

-- 6. PHAN PHONG
SET IDENTITY_INSERT dbo.PhanPhong ON;
INSERT INTO dbo.PhanPhong (MaPhanPhong, MaSV, MaPhong, MaDangKy, NgayBatDau, NgayKetThuc, TrangThai) VALUES
    (1, 'SV001', 1, 1, DATEADD(DAY,-45,@Today), DATEADD(DAY,200,@Today), N'Đang ở'),
    (2, 'SV002', 1, 2, DATEADD(DAY,-45,@Today), DATEADD(DAY,14,@Today), N'Đang ở'),
    (3, 'SV003', 3, 3, DATEADD(DAY,-45,@Today), DATEADD(DAY,200,@Today), N'Đang ở'),
    (4, 'SV004', 3, 4, DATEADD(DAY,-120,@Today), DATEADD(DAY,-6,@Today), N'Đang ở'),
    (5, 'SV005', 4, 5, DATEADD(DAY,-45,@Today), DATEADD(DAY,200,@Today), N'Đang ở'),
    (6, 'SV006', 4, 6, DATEADD(DAY,-45,@Today), DATEADD(DAY,200,@Today), N'Đang ở'),
    (7, 'SV007', 5, 7, DATEADD(DAY,-100,@Today), DATEADD(DAY,-20,@Today), N'Đã kết thúc'),
    (8, 'SV007', 7, NULL, DATEADD(DAY,-20,@Today), DATEADD(DAY,200,@Today), N'Đang ở'),
    (9, 'SV008', 2, 8, DATEADD(DAY,-400,@Today), DATEADD(DAY,-100,@Today), N'Đã kết thúc');
SET IDENTITY_INSERT dbo.PhanPhong OFF;

-- 7. HOP DONG
SET IDENTITY_INSERT dbo.HopDong ON;
INSERT INTO dbo.HopDong (MaHopDong, MaPhanPhong, DieuKhoan, TrangThai) VALUES
    (1, 1, N'Sinh viên chấp hành nội quy KTX, thanh toán đầy đủ các khoản phí đúng hạn, giữ gìn tài sản chung và không tự ý chuyển nhượng chỗ ở.', N'Có hiệu lực'),
    (2, 2, N'Sinh viên chấp hành nội quy KTX, thanh toán đầy đủ các khoản phí đúng hạn, giữ gìn tài sản chung và không tự ý chuyển nhượng chỗ ở.', N'Có hiệu lực'),
    (3, 3, N'Sinh viên chấp hành nội quy KTX, thanh toán đầy đủ các khoản phí đúng hạn, giữ gìn tài sản chung và không tự ý chuyển nhượng chỗ ở.', N'Có hiệu lực'),
    (4, 4, N'Sinh viên chấp hành nội quy KTX, thanh toán đầy đủ các khoản phí đúng hạn, giữ gìn tài sản chung và không tự ý chuyển nhượng chỗ ở.', N'Hết hạn'),
    (5, 5, N'Sinh viên chấp hành nội quy KTX, thanh toán đầy đủ các khoản phí đúng hạn, giữ gìn tài sản chung và không tự ý chuyển nhượng chỗ ở.', N'Có hiệu lực'),
    (6, 6, NULL, N'Có hiệu lực'),
    (7, 8, N'Sinh viên chấp hành nội quy KTX, thanh toán đầy đủ các khoản phí đúng hạn, giữ gìn tài sản chung và không tự ý chuyển nhượng chỗ ở.', N'Có hiệu lực'),
    (8, 9, N'Sinh viên chấp hành nội quy KTX, thanh toán đầy đủ các khoản phí đúng hạn, giữ gìn tài sản chung và không tự ý chuyển nhượng chỗ ở.', N'Đã thanh lý');
SET IDENTITY_INSERT dbo.HopDong OFF;

-- 12. HOA DON (thanh toán sẽ tự cập nhật trạng thái qua trigger)
SET IDENTITY_INSERT dbo.HoaDon ON;
INSERT INTO dbo.HoaDon (MaHoaDon, MaPhanPhong, NgayLap, HanThanhToan, TrangThai, LoaiHoaDon, KyThu) VALUES
    (1, 1, DATEADD(DAY,-35,@Today), DATEADD(DAY,-20,@Today), N'Chưa thanh toán', N'Tiền phòng', NULL),
    (2, 1, DATEADD(DAY,-5,@Today), DATEADD(DAY,10,@Today), N'Chưa thanh toán', N'Điện nước', @K1),
    (3, 2, DATEADD(DAY,-35,@Today), DATEADD(DAY,-20,@Today), N'Chưa thanh toán', N'Tiền phòng', NULL),
    (4, 3, DATEADD(DAY,-35,@Today), DATEADD(DAY,-20,@Today), N'Chưa thanh toán', N'Tiền phòng', NULL),
    (5, 4, DATEADD(DAY,-60,@Today), DATEADD(DAY,-45,@Today), N'Quá hạn', N'Tiền phòng', NULL),
    (6, 4, DATEADD(DAY,-35,@Today), DATEADD(DAY,-20,@Today), N'Quá hạn', N'Điện nước', @K2),
    (7, 5, DATEADD(DAY,-35,@Today), DATEADD(DAY,-20,@Today), N'Chưa thanh toán', N'Tiền phòng', NULL),
    (8, 6, DATEADD(DAY,-3,@Today), DATEADD(DAY,12,@Today), N'Chưa thanh toán', N'Tiền phòng', NULL),
    (9, 7, DATEADD(DAY,-80,@Today), DATEADD(DAY,-65,@Today), N'Chưa thanh toán', N'Tiền phòng', NULL),
    (10, 9, DATEADD(DAY,-300,@Today), DATEADD(DAY,-285,@Today), N'Chưa thanh toán', N'Tiền phòng', NULL),
    (11, 6, DATEADD(DAY,-40,@Today), DATEADD(DAY,-25,@Today), N'Chưa thanh toán', N'Điện nước', @K2),
    (12, 1, DATEADD(DAY,-35,@Today), DATEADD(DAY,-20,@Today), N'Chưa thanh toán', N'Điện nước', @K2),
    (13, 3, DATEADD(DAY,-5,@Today), DATEADD(DAY,10,@Today), N'Chưa thanh toán', N'Điện nước', @K1),
    (14, 8, DATEADD(DAY,-3,@Today), DATEADD(DAY,12,@Today), N'Chưa thanh toán', N'Tiền phòng', NULL);
SET IDENTITY_INSERT dbo.HoaDon OFF;

-- 13. CHI TIET HOA DON (phải nạp trước thanh toán vì trigger khóa chi tiết của hóa đơn đã thanh toán)
INSERT INTO dbo.ChiTietHoaDon (MaHoaDon, MaKhoanThu, SoLuong, DonGia, MienGiam) VALUES
    (1, 1, 1, 600000, 0),
    (2, 2, 120, 3500, 0),
    (2, 3, 6, 15000, 0),
    (2, 4, 1, 30000, 0),
    (3, 1, 1, 600000, 0),
    (4, 1, 1, 900000, 900000),
    (5, 1, 1, 900000, 0),
    (6, 2, 150, 3500, 0),
    (6, 3, 8, 15000, 0),
    (7, 1, 1, 400000, 200000),
    (8, 1, 1, 400000, 0),
    (9, 1, 1, 400000, 0),
    (10, 1, 1, 600000, 180000),
    (11, 2, 80, 3500, 0),
    (11, 3, 4, 15000, 0),
    (12, 2, 95, 3500, 0),
    (12, 3, 5, 15000, 0),
    (13, 2, 200, 3500, 0),
    (13, 3, 7, 15000, 0),
    (14, 1, 1, 600000, 0);

-- 14. THANH TOAN
SET IDENTITY_INSERT dbo.ThanhToan ON;
INSERT INTO dbo.ThanhToan (MaThanhToan, MaHoaDon, NgayThanhToan, SoTien, PhuongThuc, TrangThai, MaGiaoDich) VALUES
    (1, 1, DATEADD(DAY,-30,GETDATE()), 600000, N'Chuyển khoản', N'Thành công', 'CK0901001'),
    (2, 2, DATEADD(DAY,-1,GETDATE()), 540000, N'Ví điện tử', N'Đang xử lý', 'MOMO0902001'),
    (3, 3, DATEADD(DAY,-28,GETDATE()), 300000, N'Tiền mặt', N'Thành công', NULL),
    (4, 7, DATEADD(DAY,-30,GETDATE()), 200000, N'Ví điện tử', N'Thành công', 'MOMO0901002'),
    (5, 8, DATEADD(DAY,-2,GETDATE()), 400000, N'Chuyển khoản', N'Thất bại', 'CK0902001'),
    (6, 9, DATEADD(DAY,-75,GETDATE()), 400000, N'Tiền mặt', N'Thành công', NULL),
    (7, 10, DATEADD(DAY,-290,GETDATE()), 420000, N'Chuyển khoản', N'Thành công', 'CK0801003'),
    (8, 12, DATEADD(DAY,-28,GETDATE()), 407500, N'Ví điện tử', N'Thất bại', 'MOMO0901003'),
    (9, 12, DATEADD(DAY,-27,GETDATE()), 407500, N'Ví điện tử', N'Thành công', 'MOMO0901004');
SET IDENTITY_INSERT dbo.ThanhToan OFF;

UPDATE dbo.HoaDon SET TrangThai = N'Đã thanh toán' WHERE MaHoaDon = 4;  -- miễn giảm 100% nên tổng tiền = 0
UPDATE dbo.HoaDon SET TrangThai = N'Đã hủy' WHERE MaHoaDon = 11;  -- đã hủy (chưa có thanh toán nào)

-- 15. VI PHAM
SET IDENTITY_INSERT dbo.ViPham ON;
INSERT INTO dbo.ViPham (MaViPham, MaSV, NgayLapBienBan, NgayViPham, NoiDung, DiaDiem, HinhThucXuLy, TrangThaiXuLy) VALUES
    (1, 'SV001', DATEADD(DAY,-29,@Today), DATEADD(DAY,-30,@Today), N'Để xe máy sai nơi quy định', N'Sân xe khu A', N'Nhắc nhở', N'Đã xử lý'),
    (2, 'SV004', DATEADD(DAY,-9,@Today), DATEADD(DAY,-10,@Today), N'Về muộn sau giờ giới nghiêm 3 lần trong tuần', N'Cổng KTX', N'Cảnh cáo', N'Chưa xử lý'),
    (3, 'SV004', DATEADD(DAY,-70,@Today), DATEADD(DAY,-70,@Today), N'Nấu ăn bằng bếp điện trong phòng', N'Phòng A201', N'Nhắc nhở', N'Đã xử lý'),
    (4, 'SV006', DATEADD(DAY,-3,@Today), DATEADD(DAY,-4,@Today), N'Gây ồn sau 23 giờ', N'Phòng B101', N'Cảnh cáo', N'Chưa xử lý'),
    (5, 'SV008', DATEADD(DAY,-114,@Today), DATEADD(DAY,-115,@Today), N'Hút thuốc và tàng trữ chất cấm trong phòng', N'Phòng A102', N'Buộc rời KTX', N'Đã xử lý'),
    (6, 'SV002', DATEADD(DAY,-6,@Today), DATEADD(DAY,-7,@Today), N'Không tham gia trực nhật theo lịch', N'Phòng A101', N'Nhắc nhở', N'Chưa xử lý');
SET IDENTITY_INSERT dbo.ViPham OFF;

COMMIT;
GO


-- Kiểm tra nhanh số dòng của từng bảng
SELECT N'SinhVien' AS Bang, COUNT(*) AS SoDong FROM dbo.SinhVien UNION ALL
SELECT N'Khu', COUNT(*) FROM dbo.Khu UNION ALL
SELECT N'LoaiPhong', COUNT(*) FROM dbo.LoaiPhong UNION ALL
SELECT N'Phong', COUNT(*) FROM dbo.Phong UNION ALL
SELECT N'DangKyKTX', COUNT(*) FROM dbo.DangKyKTX UNION ALL
SELECT N'PhanPhong', COUNT(*) FROM dbo.PhanPhong UNION ALL
SELECT N'HopDong', COUNT(*) FROM dbo.HopDong UNION ALL
SELECT N'KhoanThu', COUNT(*) FROM dbo.KhoanThu UNION ALL
SELECT N'HoaDon', COUNT(*) FROM dbo.HoaDon UNION ALL
SELECT N'ChiTietHoaDon', COUNT(*) FROM dbo.ChiTietHoaDon UNION ALL
SELECT N'ThanhToan', COUNT(*) FROM dbo.ThanhToan UNION ALL
SELECT N'ViPham', COUNT(*) FROM dbo.ViPham UNION ALL
SELECT N'VaiTro', COUNT(*) FROM dbo.VaiTro UNION ALL
SELECT N'TaiKhoan', COUNT(*) FROM dbo.TaiKhoan;
GO