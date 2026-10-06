USE QuanLyKTX
GO


-- PHÒNG
-- Thông tin phòng + sức chứa + chỗ trống
CREATE OR ALTER VIEW dbo.vw_PhongChiTiet
AS
SELECT  p.MaPhong, p.SoPhong, k.MaKhu, k.TenKhu,
        lp.MaLoaiPhong, lp.TenLoaiPhong, lp.SoNguoiToiDa, lp.DonGia,
        p.TrangThai,
        dbo.fn_SoNguoiDangO(p.MaPhong) AS SoNguoiDangO,
        dbo.fn_SoChoTrong(p.MaPhong)   AS SoChoTrong
FROM dbo.Phong p
JOIN dbo.Khu k        ON k.MaKhu = p.MaKhu
JOIN dbo.LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
GO


-- Sinh viên đang ở KTX (kèm hợp đồng mới nhất)
CREATE OR ALTER VIEW dbo.vw_SinhVienDangO
AS
SELECT  pp.MaPhanPhong, sv.MaSV, sv.HoTen, sv.GioiTinh, sv.Khoa, sv.DienUuTien,
        p.MaPhong, p.SoPhong, k.TenKhu,
        pp.NgayBatDau, pp.NgayKetThuc,
        hd.MaHopDong, hd.TrangThai AS TrangThaiHopDong
FROM dbo.PhanPhong pp
JOIN dbo.SinhVien sv ON sv.MaSV = pp.MaSV
JOIN dbo.Phong p     ON p.MaPhong = pp.MaPhong
JOIN dbo.Khu k       ON k.MaKhu = p.MaKhu
OUTER APPLY (SELECT TOP 1 MaHopDong, TrangThai
             FROM dbo.HopDong
             WHERE MaPhanPhong = pp.MaPhanPhong
             ORDER BY MaHopDong DESC) hd
WHERE pp.TrangThai = N'Đang ở'
GO


-- HỢP ĐỒNG
-- Hợp đồng + thời hạn (lấy từ PhanPhong)
CREATE OR ALTER VIEW dbo.vw_HopDongChiTiet
AS
SELECT  hd.MaHopDong, hd.MaPhanPhong, sv.MaSV, sv.HoTen,
        p.SoPhong, k.TenKhu,
        pp.NgayBatDau, pp.NgayKetThuc,
        DATEDIFF(DAY, CAST(GETDATE() AS DATE), pp.NgayKetThuc) AS SoNgayConLai,
        hd.TrangThai
FROM dbo.HopDong hd
JOIN dbo.PhanPhong pp ON pp.MaPhanPhong = hd.MaPhanPhong
JOIN dbo.SinhVien sv  ON sv.MaSV = pp.MaSV
JOIN dbo.Phong p      ON p.MaPhong = pp.MaPhong
JOIN dbo.Khu k        ON k.MaKhu = p.MaKhu
GO


-- TÀI CHÍNH
-- Công nợ từng hóa đơn
CREATE OR ALTER VIEW dbo.vw_CongNoHoaDon
AS
SELECT  h.MaHoaDon, h.MaPhanPhong, sv.MaSV, sv.HoTen,
        h.LoaiHoaDon, h.KyThu, h.NgayLap, h.HanThanhToan, h.TrangThai,
        dbo.fn_TongTienHoaDon(h.MaHoaDon) AS TongTien,
        dbo.fn_DaThanhToan(h.MaHoaDon)    AS DaThu,
        dbo.fn_ConNo(h.MaHoaDon)          AS ConNo
FROM dbo.HoaDon h
JOIN dbo.PhanPhong pp ON pp.MaPhanPhong = h.MaPhanPhong
JOIN dbo.SinhVien sv  ON sv.MaSV = pp.MaSV
GO


-- Hóa đơn quá hạn mà vẫn còn nợ (tính theo ngày, không phụ thuộc cột TrangThai)
CREATE OR ALTER VIEW dbo.vw_HoaDonQuaHan
AS
SELECT  c.*,
        DATEDIFF(DAY, c.HanThanhToan, CAST(GETDATE() AS DATE)) AS SoNgayQuaHan
FROM dbo.vw_CongNoHoaDon c
WHERE c.HanThanhToan < CAST(GETDATE() AS DATE)
  AND c.ConNo > 0
  AND c.TrangThai <> N'Đã hủy'
GO


-- Doanh thu thực thu theo tháng và loại hóa đơn
CREATE OR ALTER VIEW dbo.vw_DoanhThuThang
AS
SELECT  YEAR(t.NgayThanhToan)  AS Nam,
        MONTH(t.NgayThanhToan) AS Thang,
        h.LoaiHoaDon,
        COUNT(*)      AS SoGiaoDich,
        SUM(t.SoTien) AS DoanhThu
FROM dbo.ThanhToan t
JOIN dbo.HoaDon h ON h.MaHoaDon = t.MaHoaDon
WHERE t.TrangThai = N'Thành công'
GROUP BY YEAR(t.NgayThanhToan), MONTH(t.NgayThanhToan), h.LoaiHoaDon
GO


-- VI PHẠM
-- Thống kê vi phạm theo sinh viên
CREATE OR ALTER VIEW dbo.vw_ThongKeViPham
AS
SELECT  sv.MaSV, sv.HoTen,
        COUNT(vp.MaViPham) AS SoLanViPham,
        COUNT(CASE WHEN vp.TrangThaiXuLy = N'Chưa xử lý' THEN 1 END) AS SoChuaXuLy,
        COUNT(CASE WHEN vp.HinhThucXuLy = N'Buộc rời KTX' THEN 1 END) AS SoBuocRoiKTX
FROM dbo.SinhVien sv
LEFT JOIN dbo.ViPham vp ON vp.MaSV = sv.MaSV
GROUP BY sv.MaSV, sv.HoTen
GO
