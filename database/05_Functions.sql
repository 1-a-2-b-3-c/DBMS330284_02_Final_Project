USE QuanLyKTX
GO


-- PHÒNG
-- Số sinh viên đang ở trong phòng
CREATE OR ALTER FUNCTION dbo.fn_SoNguoiDangO (@MaPhong INT)
RETURNS INT
AS
BEGIN
    RETURN (SELECT COUNT(*)
            FROM dbo.PhanPhong
            WHERE MaPhong = @MaPhong
              AND TrangThai = N'Đang ở');
END
GO


-- Số chỗ còn trống (không âm; phòng không tồn tại trả 0)
CREATE OR ALTER FUNCTION dbo.fn_SoChoTrong (@MaPhong INT)
RETURNS INT
AS
BEGIN
    DECLARE @ToiDa INT, @Trong INT;

    SELECT @ToiDa = lp.SoNguoiToiDa
    FROM dbo.Phong p
    JOIN dbo.LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    WHERE p.MaPhong = @MaPhong;

    SET @Trong = ISNULL(@ToiDa, 0) - dbo.fn_SoNguoiDangO(@MaPhong);
    RETURN CASE WHEN @Trong < 0 THEN 0 ELSE @Trong END;
END
GO


-- TÀI CHÍNH
-- Tỷ lệ giảm tiền phòng (%) theo diện ưu tiên (khớp CK_SinhVien_DienUuTien)
CREATE OR ALTER FUNCTION dbo.fn_TyLeGiam (@DienUuTien NVARCHAR(100))
RETURNS DECIMAL(5,2)
AS
BEGIN
    RETURN CASE @DienUuTien
        WHEN N'Con thương binh/liệt sĩ' THEN 100
        WHEN N'Hộ nghèo'                THEN 50
        WHEN N'Hộ cận nghèo'            THEN 30
        WHEN N'Vùng sâu vùng xa'        THEN 20
        ELSE 0
    END;
END
GO


-- Tổng tiền hóa đơn = SUM(SoLuong * DonGia - MienGiam)
CREATE OR ALTER FUNCTION dbo.fn_TongTienHoaDon (@MaHoaDon INT)
RETURNS DECIMAL(18,2)
AS
BEGIN
    RETURN (SELECT ISNULL(SUM(SoLuong * DonGia - MienGiam), 0)
            FROM dbo.ChiTietHoaDon
            WHERE MaHoaDon = @MaHoaDon);
END
GO


-- Tổng tiền đã thanh toán thành công
CREATE OR ALTER FUNCTION dbo.fn_DaThanhToan (@MaHoaDon INT)
RETURNS DECIMAL(18,2)
AS
BEGIN
    RETURN (SELECT ISNULL(SUM(SoTien), 0)
            FROM dbo.ThanhToan
            WHERE MaHoaDon = @MaHoaDon
              AND TrangThai = N'Thành công');
END
GO


-- Số tiền còn nợ (hóa đơn đã hủy = 0)
CREATE OR ALTER FUNCTION dbo.fn_ConNo (@MaHoaDon INT)
RETURNS DECIMAL(18,2)
AS
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.HoaDon
               WHERE MaHoaDon = @MaHoaDon AND TrangThai = N'Đã hủy')
        RETURN 0;

    RETURN dbo.fn_TongTienHoaDon(@MaHoaDon) - dbo.fn_DaThanhToan(@MaHoaDon);
END
GO