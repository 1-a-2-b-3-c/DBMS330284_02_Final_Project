USE QuanLyKTX
GO


-- 1. SINH VIEN
ALTER TABLE SinhVien
ADD CONSTRAINT PK_SinhVien
PRIMARY KEY (MaSV)
GO

ALTER TABLE SinhVien
ADD CONSTRAINT UQ_SinhVien_CCCD
UNIQUE (CCCD)
GO

ALTER TABLE SinhVien
ADD CONSTRAINT CK_SinhVien_NamHoc
CHECK (NamHoc >= 1)
GO

ALTER TABLE SinhVien
ADD CONSTRAINT CK_SinhVien_GioiTinh
CHECK (GioiTinh IN (N'Nam', N'Nữ', N'Khác'))
GO

ALTER TABLE SinhVien
ADD CONSTRAINT CK_SinhVien_DienUuTien
CHECK
(
    DienUuTien IS NULL
    OR 
    DienUuTien IN
    (
        N'Con thương binh/liệt sĩ',
        N'Hộ nghèo',
        N'Hộ cận nghèo',
        N'Vùng sâu vùng xa'
    )
)
GO


-- 2. KHU
ALTER TABLE Khu
ADD CONSTRAINT PK_Khu
PRIMARY KEY (MaKhu)
GO

ALTER TABLE Khu
ADD CONSTRAINT UQ_Khu_TenKhu
UNIQUE (TenKhu)
GO


-- 3. LOAI PHONG
ALTER TABLE LoaiPhong
ADD CONSTRAINT PK_LoaiPhong
PRIMARY KEY (MaLoaiPhong)
GO

ALTER TABLE LoaiPhong
ADD CONSTRAINT UQ_LoaiPhong_TenLoaiPhong
UNIQUE (TenLoaiPhong)
GO

ALTER TABLE LoaiPhong
ADD CONSTRAINT CK_LoaiPhong_SoNguoiToiDa
CHECK (SoNguoiToiDa > 0)
GO

ALTER TABLE LoaiPhong
ADD CONSTRAINT CK_LoaiPhong_DonGia
CHECK (DonGia >= 0)
GO


-- 4. PHONG
ALTER TABLE Phong
ADD CONSTRAINT PK_Phong
PRIMARY KEY (MaPhong)
GO

ALTER TABLE Phong
ADD CONSTRAINT FK_Phong_Khu
FOREIGN KEY (MaKhu)
REFERENCES Khu(MaKhu)
GO

ALTER TABLE Phong
ADD CONSTRAINT FK_Phong_LoaiPhong
FOREIGN KEY (MaLoaiPhong)
REFERENCES LoaiPhong(MaLoaiPhong)
GO

ALTER TABLE Phong
ADD CONSTRAINT UQ_Phong_MaKhu_SoPhong
UNIQUE (MaKhu, SoPhong)
GO

ALTER TABLE Phong
ADD CONSTRAINT DF_Phong_TrangThai
DEFAULT N'Hoạt động' FOR TrangThai
GO

ALTER TABLE Phong
ADD CONSTRAINT CK_Phong_TrangThai
CHECK
(
    TrangThai IN
    (
        N'Hoạt động',
        N'Bảo trì',
        N'Đóng'
    )
)
GO


-- 5. DANG KY KTX
ALTER TABLE DangKyKTX
ADD CONSTRAINT PK_DangKyKTX
PRIMARY KEY (MaDangKy)
GO

ALTER TABLE DangKyKTX
ADD CONSTRAINT FK_DangKyKTX_SinhVien
FOREIGN KEY (MaSV)
REFERENCES SinhVien(MaSV)
GO

ALTER TABLE DangKyKTX
ADD CONSTRAINT FK_DangKyKTX_LoaiPhong
FOREIGN KEY (MaLoaiPhong)
REFERENCES LoaiPhong(MaLoaiPhong)
GO

ALTER TABLE DangKyKTX
ADD CONSTRAINT DF_DangKyKTX_NgayDangKy
DEFAULT GETDATE() FOR NgayDangKy
GO

ALTER TABLE DangKyKTX
ADD CONSTRAINT DF_DangKyKTX_TrangThai
DEFAULT N'Chờ duyệt' FOR TrangThai
GO

ALTER TABLE DangKyKTX
ADD CONSTRAINT CK_DangKyKTX_TrangThai
CHECK
(
    TrangThai IN
    (
        N'Chờ duyệt',
        N'Đã duyệt',
        N'Từ chối',
        N'Đã phân phòng'
    )
)
GO


-- 6. PHAN PHONG
ALTER TABLE PhanPhong
ADD CONSTRAINT PK_PhanPhong
PRIMARY KEY (MaPhanPhong)
GO

ALTER TABLE PhanPhong
ADD CONSTRAINT FK_PhanPhong_SinhVien
FOREIGN KEY (MaSV)
REFERENCES SinhVien(MaSV)
GO

ALTER TABLE PhanPhong
ADD CONSTRAINT FK_PhanPhong_Phong
FOREIGN KEY (MaPhong)
REFERENCES Phong(MaPhong)
GO

ALTER TABLE PhanPhong
ADD CONSTRAINT FK_PhanPhong_DangKyKTX
FOREIGN KEY (MaDangKy)
REFERENCES DangKyKTX(MaDangKy)
GO

ALTER TABLE PhanPhong
ADD CONSTRAINT UQ_PhanPhong_MaDangKy
UNIQUE (MaDangKy)
GO

ALTER TABLE PhanPhong
ADD CONSTRAINT DF_PhanPhong_TrangThai
DEFAULT N'Đang ở' FOR TrangThai
GO

ALTER TABLE PhanPhong
ADD CONSTRAINT CK_PhanPhong_TrangThai
CHECK
(
    TrangThai IN
    (
        N'Đang ở',
        N'Đã chuyển phòng',
        N'Đã trả phòng'
    )
)
GO

ALTER TABLE PhanPhong
ADD CONSTRAINT CK_PhanPhong_Ngay
CHECK
(
    NgayKetThuc IS NULL
    OR NgayKetThuc >= NgayBatDau
)
GO


-- 7. HOP DONG
ALTER TABLE HopDong
ADD CONSTRAINT PK_HopDong
PRIMARY KEY (MaHopDong)
GO

ALTER TABLE HopDong
ADD CONSTRAINT FK_HopDong_PhanPhong
FOREIGN KEY (MaPhanPhong)
REFERENCES PhanPhong(MaPhanPhong)
GO

ALTER TABLE HopDong
ADD CONSTRAINT DF_HopDong_TrangThai
DEFAULT N'Có hiệu lực' FOR TrangThai
GO

ALTER TABLE HopDong
ADD CONSTRAINT CK_HopDong_TrangThai
CHECK
(
    TrangThai IN
    (
        N'Có hiệu lực',
        N'Hết hạn',
        N'Đã thanh lý',
        N'Đã hủy'
    )
)
GO


-- 8. GIA HAN HOP DONG
ALTER TABLE GiaHanHopDong
ADD CONSTRAINT PK_GiaHanHopDong
PRIMARY KEY (MaGiaHan)
GO

ALTER TABLE GiaHanHopDong
ADD CONSTRAINT FK_GiaHanHopDong_HopDong
FOREIGN KEY (MaHopDong)
REFERENCES HopDong(MaHopDong)
GO

ALTER TABLE GiaHanHopDong
ADD CONSTRAINT DF_GiaHanHopDong_NgayYeuCau
DEFAULT GETDATE() FOR NgayYeuCau
GO

ALTER TABLE GiaHanHopDong
ADD CONSTRAINT DF_GiaHanHopDong_TrangThai
DEFAULT N'Chờ duyệt' FOR TrangThai
GO

ALTER TABLE GiaHanHopDong
ADD CONSTRAINT CK_GiaHanHopDong_Ngay
CHECK
(
    NgayKetThucMoi > NgayBatDauMoi
)
GO

ALTER TABLE GiaHanHopDong
ADD CONSTRAINT CK_GiaHanHopDong_TrangThai
CHECK
(
    TrangThai IN
    (
        N'Chờ duyệt',
        N'Đã duyệt',
        N'Từ chối'
    )
)
GO


-- 9. CHUYEN PHONG
ALTER TABLE ChuyenPhong
ADD CONSTRAINT PK_ChuyenPhong
PRIMARY KEY (MaChuyenPhong)
GO

ALTER TABLE ChuyenPhong
ADD CONSTRAINT FK_ChuyenPhong_PhanPhong
FOREIGN KEY (MaPhanPhong)
REFERENCES PhanPhong(MaPhanPhong)
GO

ALTER TABLE ChuyenPhong
ADD CONSTRAINT FK_ChuyenPhong_PhongMoi
FOREIGN KEY (MaPhongMoi)
REFERENCES Phong(MaPhong)
GO

ALTER TABLE ChuyenPhong
ADD CONSTRAINT DF_ChuyenPhong_NgayYeuCau
DEFAULT GETDATE() FOR NgayYeuCau
GO

ALTER TABLE ChuyenPhong
ADD CONSTRAINT DF_ChuyenPhong_TrangThai
DEFAULT N'Chờ duyệt' FOR TrangThai
GO

ALTER TABLE ChuyenPhong
ADD CONSTRAINT CK_ChuyenPhong_TrangThai
CHECK
(
    TrangThai IN
    (
        N'Chờ duyệt',
        N'Đã duyệt',
        N'Từ chối',
        N'Hoàn thành'
    )
)
GO

ALTER TABLE ChuyenPhong
ADD CONSTRAINT CK_ChuyenPhong_NgayXuLy
CHECK
(
    NgayXuLy IS NULL
    OR NgayXuLy >= NgayYeuCau
)
GO


-- 10. TRA PHONG
ALTER TABLE TraPhong
ADD CONSTRAINT PK_TraPhong
PRIMARY KEY (MaTraPhong)
GO

ALTER TABLE TraPhong
ADD CONSTRAINT FK_TraPhong_PhanPhong
FOREIGN KEY (MaPhanPhong)
REFERENCES PhanPhong(MaPhanPhong)
GO

ALTER TABLE TraPhong
ADD CONSTRAINT DF_TraPhong_NgayYeuCau
DEFAULT GETDATE() FOR NgayYeuCau
GO

ALTER TABLE TraPhong
ADD CONSTRAINT DF_TraPhong_TrangThai
DEFAULT N'Chờ duyệt' FOR TrangThai
GO

ALTER TABLE TraPhong
ADD CONSTRAINT CK_TraPhong_TrangThai
CHECK
(
    TrangThai IN
    (
        N'Chờ duyệt',
        N'Đã duyệt',
        N'Từ chối',
        N'Hoàn thành'
    )
)
GO

ALTER TABLE TraPhong
ADD CONSTRAINT CK_TraPhong_NgayTra
CHECK
(
    NgayTra IS NULL
    OR NgayTra >= NgayYeuCau
)
GO


-- 11. KHOAN THU
ALTER TABLE KhoanThu
ADD CONSTRAINT PK_KhoanThu
PRIMARY KEY (MaKhoanThu)
GO

ALTER TABLE KhoanThu
ADD CONSTRAINT UQ_KhoanThu_TenKhoanThu
UNIQUE (TenKhoanThu)
GO

ALTER TABLE KhoanThu
ADD CONSTRAINT DF_KhoanThu_TrangThai
DEFAULT 1 FOR TrangThai
GO

ALTER TABLE KhoanThu
ADD CONSTRAINT CK_KhoanThu_DonGia
CHECK (DonGiaMacDinh >= 0)
GO


-- 12. HOA DON
ALTER TABLE HoaDon
ADD CONSTRAINT PK_HoaDon
PRIMARY KEY (MaHoaDon)
GO

ALTER TABLE HoaDon
ADD CONSTRAINT FK_HoaDon_PhanPhong
FOREIGN KEY (MaPhanPhong)
REFERENCES PhanPhong(MaPhanPhong)
GO

ALTER TABLE HoaDon
ADD CONSTRAINT DF_HoaDon_NgayLap
DEFAULT GETDATE() FOR NgayLap
GO

ALTER TABLE HoaDon
ADD CONSTRAINT DF_HoaDon_TrangThai
DEFAULT N'Chưa thanh toán' FOR TrangThai
GO

ALTER TABLE HoaDon
ADD CONSTRAINT DF_HoaDon_LoaiHoaDon
DEFAULT N'Điện nước' FOR LoaiHoaDon
GO

ALTER TABLE HoaDon
ADD CONSTRAINT CK_HoaDon_HanThanhToan
CHECK (HanThanhToan >= NgayLap)
GO

ALTER TABLE HoaDon
ADD CONSTRAINT CK_HoaDon_TrangThai
CHECK
(
    TrangThai IN
    (
        N'Chưa thanh toán',
        N'Thanh toán một phần',
        N'Đã thanh toán',
        N'Quá hạn',
        N'Đã hủy'
    )
)
GO

ALTER TABLE HoaDon
ADD CONSTRAINT CK_HoaDon_LoaiKyThu
CHECK
(
    (LoaiHoaDon = N'Tiền phòng' AND KyThu IS NULL)
    OR
    (LoaiHoaDon = N'Điện nước'
     AND KyThu IS NOT NULL
     AND DAY(KyThu) = 1)
)
GO


-- 13. CHI TIET HOA DON
ALTER TABLE ChiTietHoaDon
ADD CONSTRAINT PK_ChiTietHoaDon
PRIMARY KEY (MaHoaDon, MaKhoanThu)
GO

ALTER TABLE ChiTietHoaDon
ADD CONSTRAINT FK_ChiTietHoaDon_HoaDon
FOREIGN KEY (MaHoaDon)
REFERENCES HoaDon(MaHoaDon)
GO

ALTER TABLE ChiTietHoaDon
ADD CONSTRAINT FK_ChiTietHoaDon_KhoanThu
FOREIGN KEY (MaKhoanThu)
REFERENCES KhoanThu(MaKhoanThu)
GO

ALTER TABLE ChiTietHoaDon
ADD CONSTRAINT DF_ChiTietHoaDon_SoLuong
DEFAULT 1 FOR SoLuong
GO

ALTER TABLE ChiTietHoaDon
ADD CONSTRAINT DF_ChiTietHoaDon_MienGiam
DEFAULT 0 FOR MienGiam
GO

ALTER TABLE ChiTietHoaDon
ADD CONSTRAINT CK_ChiTietHoaDon_SoLuong
CHECK (SoLuong > 0)
GO

ALTER TABLE ChiTietHoaDon
ADD CONSTRAINT CK_ChiTietHoaDon_DonGia
CHECK (DonGia >= 0)
GO

ALTER TABLE ChiTietHoaDon
ADD CONSTRAINT CK_ChiTietHoaDon_MienGiam
CHECK (MienGiam >= 0)
GO


-- 14. THANH TOAN
ALTER TABLE ThanhToan
ADD CONSTRAINT PK_ThanhToan
PRIMARY KEY (MaThanhToan)
GO

ALTER TABLE ThanhToan
ADD CONSTRAINT FK_ThanhToan_HoaDon
FOREIGN KEY (MaHoaDon)
REFERENCES HoaDon(MaHoaDon)
GO

ALTER TABLE ThanhToan
ADD CONSTRAINT DF_ThanhToan_NgayThanhToan
DEFAULT GETDATE() FOR NgayThanhToan
GO

ALTER TABLE ThanhToan
ADD CONSTRAINT DF_ThanhToan_TrangThai
DEFAULT N'Đang xử lý' FOR TrangThai
GO

ALTER TABLE ThanhToan
ADD CONSTRAINT CK_ThanhToan_SoTien
CHECK (SoTien > 0)
GO

ALTER TABLE ThanhToan
ADD CONSTRAINT CK_ThanhToan_PhuongThuc
CHECK
(
    PhuongThuc IN
    (
        N'Tiền mặt',
        N'Chuyển khoản',
        N'Ví điện tử'
    )
)
GO

ALTER TABLE ThanhToan
ADD CONSTRAINT CK_ThanhToan_TrangThai
CHECK
(
    TrangThai IN
    (
        N'Đang xử lý',
        N'Thành công',
        N'Thất bại'
    )
)
GO


-- 15. VI PHAM
ALTER TABLE ViPham
ADD CONSTRAINT PK_ViPham
PRIMARY KEY (MaViPham)
GO

ALTER TABLE ViPham
ADD CONSTRAINT FK_ViPham_SinhVien
FOREIGN KEY (MaSV)
REFERENCES SinhVien(MaSV)
GO

ALTER TABLE ViPham
ADD CONSTRAINT DF_ViPham_NgayLapBienBan
DEFAULT GETDATE() FOR NgayLapBienBan
GO

ALTER TABLE ViPham
ADD CONSTRAINT DF_ViPham_TrangThaiXuLy
DEFAULT N'Chưa xử lý' FOR TrangThaiXuLy
GO

ALTER TABLE ViPham
ADD CONSTRAINT CK_ViPham_HinhThucXuLy
CHECK
(
    HinhThucXuLy IN
    (
        N'Nhắc nhở',
        N'Cảnh cáo',
        N'Buộc rời KTX'
    )
)
GO

ALTER TABLE ViPham
ADD CONSTRAINT CK_ViPham_TrangThaiXuLy
CHECK
(
    TrangThaiXuLy IN
    (
        N'Chưa xử lý',
        N'Đã xử lý'
    )
)
GO

ALTER TABLE ViPham
ADD CONSTRAINT CK_ViPham_Ngay
CHECK
(
    NgayViPham <= NgayLapBienBan
)
GO


-- 16. VAI TRO
ALTER TABLE VaiTro
ADD CONSTRAINT PK_VaiTro
PRIMARY KEY (MaVaiTro)
GO

ALTER TABLE VaiTro
ADD CONSTRAINT UQ_VaiTro_TenVaiTro
UNIQUE (TenVaiTro)
GO


-- 17. TAI KHOAN
ALTER TABLE TaiKhoan
ADD CONSTRAINT PK_TaiKhoan
PRIMARY KEY (MaTaiKhoan)
GO

ALTER TABLE TaiKhoan
ADD CONSTRAINT UQ_TaiKhoan_TenDangNhap
UNIQUE (TenDangNhap)
GO

ALTER TABLE TaiKhoan
ADD CONSTRAINT FK_TaiKhoan_SinhVien
FOREIGN KEY (MaSV)
REFERENCES SinhVien(MaSV)
GO

ALTER TABLE TaiKhoan
ADD CONSTRAINT UQ_TaiKhoan_MaSV
UNIQUE (MaSV)
GO

ALTER TABLE TaiKhoan
ADD CONSTRAINT FK_TaiKhoan_VaiTro
FOREIGN KEY (MaVaiTro)
REFERENCES VaiTro(MaVaiTro)
GO

ALTER TABLE TaiKhoan
ADD CONSTRAINT DF_TaiKhoan_TrangThai
DEFAULT 1 FOR TrangThai
GO