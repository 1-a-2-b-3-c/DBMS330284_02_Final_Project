USE QuanLyKTX
GO


-- ĐĂNG KÝ KTX
-- Mỗi SV chỉ có 1 đơn ở trạng thái Chờ duyệt / Đã duyệt
-- SV đang ở KTX không được nộp đơn mới
CREATE OR ALTER TRIGGER dbo.trg_DangKyKTX_KiemTra
ON dbo.DangKyKTX
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1
               FROM dbo.DangKyKTX d
               WHERE d.TrangThai IN (N'Chờ duyệt', N'Đã duyệt')
                 AND d.MaSV IN (SELECT MaSV FROM inserted)
               GROUP BY d.MaSV
               HAVING COUNT(*) > 1)
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50001, N'Mỗi sinh viên chỉ được có một đơn đăng ký đang chờ duyệt hoặc đã duyệt.', 1;
    END

    IF EXISTS (SELECT 1
               FROM inserted i
               WHERE i.TrangThai = N'Chờ duyệt'
                 AND NOT EXISTS (SELECT 1 FROM deleted d WHERE d.MaDangKy = i.MaDangKy)
                 AND EXISTS (SELECT 1 FROM dbo.PhanPhong pp
                             WHERE pp.MaSV = i.MaSV AND pp.TrangThai = N'Đang ở'))
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50002, N'Sinh viên đang ở KTX, không thể đăng ký mới.', 1;
    END
END
GO


-- PHÂN PHÒNG
-- Chỉ xếp vào phòng đang Hoạt động
-- Mỗi SV chỉ có 1 dòng 'Đang ở'
-- Không vượt SoNguoiToiDa của loại phòng
CREATE OR ALTER TRIGGER dbo.trg_PhanPhong_KiemTra
ON dbo.PhanPhong
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1
               FROM inserted i
               JOIN dbo.Phong p ON p.MaPhong = i.MaPhong
               WHERE i.TrangThai = N'Đang ở'
                 AND p.TrangThai <> N'Hoạt động')
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50003, N'Phòng không ở trạng thái Hoạt động, không thể xếp sinh viên vào.', 1;
    END

    IF EXISTS (SELECT 1
               FROM dbo.PhanPhong pp
               WHERE pp.TrangThai = N'Đang ở'
                 AND pp.MaSV IN (SELECT MaSV FROM inserted WHERE TrangThai = N'Đang ở')
               GROUP BY pp.MaSV
               HAVING COUNT(*) > 1)
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50004, N'Sinh viên này đang ở một phòng khác.', 1;
    END

    IF EXISTS (SELECT 1
               FROM dbo.PhanPhong pp
               JOIN (SELECT DISTINCT MaPhong FROM inserted WHERE TrangThai = N'Đang ở') i
                    ON i.MaPhong = pp.MaPhong
               JOIN dbo.Phong p       ON p.MaPhong = pp.MaPhong
               JOIN dbo.LoaiPhong lp  ON lp.MaLoaiPhong = p.MaLoaiPhong
               WHERE pp.TrangThai = N'Đang ở'
               GROUP BY pp.MaPhong, lp.SoNguoiToiDa
               HAVING COUNT(*) > lp.SoNguoiToiDa)
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50005, N'Phòng đã vượt quá số người tối đa.', 1;
    END
END
GO


-- HỢP ĐỒNG
-- mỗi SV chỉ có 1 hợp đồng 'Có hiệu lực'
-- hợp đồng gắn với PhanPhong nên tra SV qua PhanPhong
CREATE OR ALTER TRIGGER dbo.trg_HopDong_KiemTra
ON dbo.HopDong
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1
               FROM dbo.HopDong h
               JOIN dbo.PhanPhong pp ON pp.MaPhanPhong = h.MaPhanPhong
               WHERE h.TrangThai = N'Có hiệu lực'
                 AND pp.MaSV IN (SELECT p2.MaSV
                                 FROM inserted i
                                 JOIN dbo.PhanPhong p2 ON p2.MaPhanPhong = i.MaPhanPhong)
               GROUP BY pp.MaSV
               HAVING COUNT(*) > 1)
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50006, N'Sinh viên này đã có một hợp đồng khác còn hiệu lực.', 1;
    END
END
GO


-- CHI TIẾT HÓA ĐƠN
-- Hóa đơn đã có thanh toán / đã hủy thì khóa chi tiết
-- Khoản thu ngưng áp dụng không được thêm mới
-- Miễn giảm không vượt thành tiền
CREATE OR ALTER TRIGGER dbo.trg_ChiTietHoaDon_KiemTra
ON dbo.ChiTietHoaDon
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1
               FROM (SELECT MaHoaDon FROM inserted
                     UNION
                     SELECT MaHoaDon FROM deleted) x
               JOIN dbo.HoaDon h ON h.MaHoaDon = x.MaHoaDon
               WHERE h.TrangThai IN (N'Thanh toán một phần', N'Đã thanh toán', N'Đã hủy'))
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50007, N'Hóa đơn đã phát sinh thanh toán hoặc đã hủy, không được thay đổi chi tiết.', 1;
    END

    IF EXISTS (SELECT 1
               FROM inserted i
               JOIN dbo.KhoanThu k ON k.MaKhoanThu = i.MaKhoanThu
               WHERE k.TrangThai = 0
                 AND NOT EXISTS (SELECT 1 FROM deleted d
                                 WHERE d.MaHoaDon = i.MaHoaDon
                                   AND d.MaKhoanThu = i.MaKhoanThu))
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50008, N'Khoản thu đã ngưng áp dụng.', 1;
    END

    IF EXISTS (SELECT 1 FROM inserted WHERE MienGiam > SoLuong * DonGia)
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50009, N'Miễn giảm vượt quá thành tiền.', 1;
    END
END
GO


-- THANH TOÁN 
-- Không thanh toán cho hóa đơn đã hủy
-- Chặn trả vượt tổng tiền hóa đơn
-- Tự cập nhật HoaDon.TrangThai
CREATE OR ALTER TRIGGER dbo.trg_ThanhToan_CapNhatHoaDon
ON dbo.ThanhToan
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1
               FROM inserted i
               JOIN dbo.HoaDon h ON h.MaHoaDon = i.MaHoaDon
               WHERE i.TrangThai = N'Thành công'
                 AND h.TrangThai = N'Đã hủy')
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50010, N'Không thể thanh toán cho hóa đơn đã hủy.', 1;
    END

    DECLARE @hd TABLE (MaHoaDon INT PRIMARY KEY);
    INSERT @hd SELECT DISTINCT MaHoaDon FROM inserted;

    IF EXISTS (SELECT 1 FROM @hd x
               WHERE dbo.fn_DaThanhToan(x.MaHoaDon) > dbo.fn_TongTienHoaDon(x.MaHoaDon))
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50011, N'Số tiền thanh toán vượt quá tổng tiền hóa đơn.', 1;
    END

    UPDATE h
    SET TrangThai = CASE
            WHEN dbo.fn_TongTienHoaDon(h.MaHoaDon) > 0
                 AND dbo.fn_ConNo(h.MaHoaDon) <= 0      THEN N'Đã thanh toán'
            WHEN dbo.fn_DaThanhToan(h.MaHoaDon) > 0     THEN N'Thanh toán một phần'
            WHEN h.HanThanhToan < CAST(GETDATE() AS DATE) THEN N'Quá hạn'
            ELSE N'Chưa thanh toán' END
    FROM dbo.HoaDon h
    JOIN @hd x ON x.MaHoaDon = h.MaHoaDon
    WHERE h.TrangThai <> N'Đã hủy';
END
GO