USE QuanLyKTX
GO


CREATE UNIQUE INDEX UQ_SinhVien_CCCD 
ON SinhVien(CCCD) 
WHERE CCCD IS NOT NULL
GO


CREATE UNIQUE INDEX UX_PhanPhong_MaDangKy
ON PhanPhong(MaDangKy)
WHERE MaDangKy IS NOT NULL
GO


CREATE NONCLUSTERED INDEX IX_PhanPhong_TrangThai_MaSV_MaPhong
ON dbo.PhanPhong (TrangThai, MaSV, MaPhong)
INCLUDE (NgayBatDau, NgayKetThuc);
GO


CREATE NONCLUSTERED INDEX IX_HopDong_TrangThai_MaPhanPhong
ON dbo.HopDong (TrangThai, MaPhanPhong);
GO


CREATE NONCLUSTERED INDEX IX_DangKyKTX_MaSV_TrangThai
ON dbo.DangKyKTX (MaSV, TrangThai)
INCLUDE (NgayDangKy, MaLoaiPhong);
GO