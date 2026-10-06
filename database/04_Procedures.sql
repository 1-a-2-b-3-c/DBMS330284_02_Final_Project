USE QuanLyKTX
GO


-- Thủ tục ghi nhiều bảng dùng TRANSACTION + TRY/CATCH + THROW.
-- @ChapNhan = 1: chấp nhận / duyệt; 0: từ chối.


-- SINH VIÊN
CREATE OR ALTER PROCEDURE dbo.sp_SinhVien_Them
    @MaSV        VARCHAR(15),
    @HoTen       NVARCHAR(100),
    @NgaySinh    DATE,
    @GioiTinh    NVARCHAR(10),
    @SDT         VARCHAR(15),
    @NamHoc      INT,
    @QueQuan     NVARCHAR(200) = NULL,
    @CCCD        VARCHAR(12)   = NULL,
    @Khoa        NVARCHAR(100) = NULL,
    @DienUuTien  NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.SinhVien
        (MaSV, HoTen, NgaySinh, GioiTinh, QueQuan, CCCD, SDT, Khoa, NamHoc, DienUuTien)
    VALUES
        (@MaSV, @HoTen, @NgaySinh, @GioiTinh, @QueQuan, @CCCD, @SDT, @Khoa, @NamHoc, @DienUuTien);
END
GO


-- Tham số NULL = giữ nguyên giá trị cũ
CREATE OR ALTER PROCEDURE dbo.sp_SinhVien_CapNhat
    @MaSV        VARCHAR(15),
    @SDT         VARCHAR(15)   = NULL,
    @QueQuan     NVARCHAR(200) = NULL,
    @Khoa        NVARCHAR(100) = NULL,
    @NamHoc      INT           = NULL,
    @DienUuTien  NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.SinhVien
    SET SDT        = COALESCE(@SDT, SDT),
        QueQuan    = COALESCE(@QueQuan, QueQuan),
        Khoa       = COALESCE(@Khoa, Khoa),
        NamHoc     = COALESCE(@NamHoc, NamHoc),
        DienUuTien = COALESCE(@DienUuTien, DienUuTien)
    WHERE MaSV = @MaSV;

    IF @@ROWCOUNT = 0
        THROW 50101, N'Không tìm thấy sinh viên.', 1;
END
GO


-- Xóa sinh viên (Chỉ xóa khi sinh viên chưa từng đăng ký / phân phòng / vi phạm)
CREATE OR ALTER PROCEDURE dbo.sp_SinhVien_Xoa
    @MaSV VARCHAR(15)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        BEGIN TRAN;

        IF EXISTS (SELECT 1 FROM dbo.PhanPhong WHERE MaSV = @MaSV)
           OR EXISTS (SELECT 1 FROM dbo.DangKyKTX WHERE MaSV = @MaSV)
           OR EXISTS (SELECT 1 FROM dbo.ViPham WHERE MaSV = @MaSV)
            THROW 50301, N'Sinh viên đã có dữ liệu phân phòng, đăng ký hoặc vi phạm; không được xóa.', 1;

        -- Xóa tài khoản liên kết nếu có
        DELETE FROM dbo.TaiKhoan WHERE MaSV = @MaSV;

        -- Xóa sinh viên
        DELETE FROM dbo.SinhVien WHERE MaSV = @MaSV;

        IF @@ROWCOUNT = 0
            THROW 50302, N'Không tìm thấy sinh viên cần xóa.', 1;

        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO


CREATE OR ALTER PROCEDURE dbo.sp_SinhVien_TraCuu
    @MaSV    VARCHAR(15)   = NULL,
    @HoTen   NVARCHAR(100) = NULL,
    @Khoa    NVARCHAR(100) = NULL,
    @NamHoc  INT           = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT MaSV, HoTen, NgaySinh, GioiTinh, QueQuan, CCCD, SDT, Khoa, NamHoc, DienUuTien
    FROM dbo.SinhVien
    WHERE (@MaSV   IS NULL OR MaSV = @MaSV)
      AND (@HoTen  IS NULL OR HoTen LIKE N'%' + @HoTen + N'%')
      AND (@Khoa   IS NULL OR Khoa = @Khoa)
      AND (@NamHoc IS NULL OR NamHoc = @NamHoc)
    ORDER BY HoTen, MaSV;
END
GO



-- ĐĂNG KÝ KTX
CREATE OR ALTER PROCEDURE dbo.sp_DangKyKTX_Them
    @MaSV         VARCHAR(15),
    @MaLoaiPhong  VARCHAR(10)   = NULL,
    @GhiChu       NVARCHAR(255) = NULL,
    @MaDangKy     INT           = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.DangKyKTX (MaSV, MaLoaiPhong, NgayDangKy, TrangThai, GhiChu)
    VALUES (@MaSV, @MaLoaiPhong, CAST(GETDATE() AS DATE), N'Chờ duyệt', @GhiChu);

    SET @MaDangKy = SCOPE_IDENTITY();
END
GO


CREATE OR ALTER PROCEDURE dbo.sp_DangKyKTX_Duyet
    @MaDangKy   INT,
    @ChapNhan   BIT,
    @GhiChu     NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.DangKyKTX
    SET TrangThai = CASE WHEN @ChapNhan = 1 THEN N'Đã duyệt' ELSE N'Từ chối' END,
        GhiChu    = COALESCE(@GhiChu, GhiChu)
    WHERE MaDangKy = @MaDangKy
      AND TrangThai = N'Chờ duyệt';

    IF @@ROWCOUNT = 0
        THROW 50111, N'Đơn đăng ký không tồn tại hoặc không ở trạng thái Chờ duyệt.', 1;
END
GO


CREATE OR ALTER PROCEDURE dbo.sp_DangKyKTX_TraCuu
    @MaSV       VARCHAR(15)  = NULL,
    @TrangThai  NVARCHAR(30) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT dk.MaDangKy, dk.MaSV, sv.HoTen, dk.MaLoaiPhong, lp.TenLoaiPhong,
           dk.NgayDangKy, dk.TrangThai, dk.GhiChu
    FROM dbo.DangKyKTX dk
    JOIN dbo.SinhVien sv        ON sv.MaSV = dk.MaSV
    LEFT JOIN dbo.LoaiPhong lp  ON lp.MaLoaiPhong = dk.MaLoaiPhong
    WHERE (@MaSV      IS NULL OR dk.MaSV = @MaSV)
      AND (@TrangThai IS NULL OR dk.TrangThai = @TrangThai)
    ORDER BY dk.NgayDangKy DESC, dk.MaDangKy DESC;
END
GO


-- VI PHẠM
CREATE OR ALTER PROCEDURE dbo.sp_ViPham_Them
    @MaSV            VARCHAR(15),
    @NgayViPham      DATE,
    @NoiDung         NVARCHAR(500),
    @HinhThucXuLy    NVARCHAR(50),
    @DiaDiem         NVARCHAR(200) = NULL,
    @NgayLapBienBan  DATE          = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.ViPham
        (MaSV, NgayLapBienBan, NgayViPham, NoiDung, DiaDiem, HinhThucXuLy, TrangThaiXuLy)
    VALUES
        (@MaSV, COALESCE(@NgayLapBienBan, CAST(GETDATE() AS DATE)), @NgayViPham,
         @NoiDung, @DiaDiem, @HinhThucXuLy, N'Chưa xử lý');
END
GO


-- Sửa thông tin biên bản vi phạm
CREATE OR ALTER PROCEDURE dbo.sp_ViPham_CapNhat
    @MaViPham      INT,
    @NgayViPham    DATE          = NULL,
    @NoiDung       NVARCHAR(500) = NULL,
    @DiaDiem       NVARCHAR(200) = NULL,
    @HinhThucXuLy  NVARCHAR(50)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Không cho sửa biên bản đã xử lý
    IF EXISTS (SELECT 1 FROM dbo.ViPham WHERE MaViPham = @MaViPham AND TrangThaiXuLy = N'Đã xử lý')
        THROW 50303, N'Biên bản vi phạm đã xử lý, không thể chỉnh sửa.', 1;

    UPDATE dbo.ViPham
    SET NgayViPham   = COALESCE(@NgayViPham, NgayViPham),
        NoiDung      = COALESCE(@NoiDung, NoiDung),
        DiaDiem      = COALESCE(@DiaDiem, DiaDiem),
        HinhThucXuLy = COALESCE(@HinhThucXuLy, HinhThucXuLy)
    WHERE MaViPham = @MaViPham;

    IF @@ROWCOUNT = 0
        THROW 50304, N'Không tìm thấy biên bản vi phạm.', 1;
END
GO


CREATE OR ALTER PROCEDURE dbo.sp_ViPham_XuLy
    @MaViPham INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.ViPham
    SET TrangThaiXuLy = N'Đã xử lý'
    WHERE MaViPham = @MaViPham
      AND TrangThaiXuLy = N'Chưa xử lý';

    IF @@ROWCOUNT = 0
        THROW 50121, N'Biên bản không tồn tại hoặc đã được xử lý.', 1;
END
GO


CREATE OR ALTER PROCEDURE dbo.sp_ViPham_TraCuu
    @MaSV           VARCHAR(15)  = NULL,
    @TrangThaiXuLy  NVARCHAR(30) = NULL,
    @HinhThucXuLy   NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT vp.MaViPham, vp.MaSV, sv.HoTen, vp.NgayViPham, vp.NgayLapBienBan,
           vp.NoiDung, vp.DiaDiem, vp.HinhThucXuLy, vp.TrangThaiXuLy
    FROM dbo.ViPham vp
    JOIN dbo.SinhVien sv ON sv.MaSV = vp.MaSV
    WHERE (@MaSV          IS NULL OR vp.MaSV = @MaSV)
      AND (@TrangThaiXuLy IS NULL OR vp.TrangThaiXuLy = @TrangThaiXuLy)
      AND (@HinhThucXuLy  IS NULL OR vp.HinhThucXuLy = @HinhThucXuLy)
    ORDER BY vp.NgayViPham DESC, vp.MaViPham DESC;
END
GO


-- Xử lý vi phạm dạng "Buộc rời KTX": Cập nhật trạng thái vi phạm, kết thúc phân phòng và thanh lý hợp đồng
CREATE OR ALTER PROCEDURE dbo.sp_ViPham_XuLyBuocRoiKTX
    @MaViPham INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;

        DECLARE @MaSV VARCHAR(15), @HinhThuc NVARCHAR(50), @MaPhanPhong INT;

        SELECT @MaSV = MaSV, @HinhThuc = HinhThucXuLy
        FROM dbo.ViPham WITH (UPDLOCK)
        WHERE MaViPham = @MaViPham;

        IF @MaSV IS NULL
            THROW 50305, N'Không tìm thấy biên bản vi phạm.', 1;

        IF @HinhThuc <> N'Buộc rời KTX'
            THROW 50306, N'Biên bản này không thuộc hình thức Buộc rời KTX.', 1;

        -- 1. Cập nhật vi phạm thành Đã xử lý
        UPDATE dbo.ViPham 
        SET TrangThaiXuLy = N'Đã xử lý' 
        WHERE MaViPham = @MaViPham;

        -- 2. Lấy thông tin phân phòng đang ở
        SELECT @MaPhanPhong = MaPhanPhong
        FROM dbo.PhanPhong WITH (UPDLOCK)
        WHERE MaSV = @MaSV AND TrangThai = N'Đang ở';

        -- 3. Nếu đang ở KTX thì tiến hành kết thúc ở và hủy/thanh lý hợp đồng
        IF @MaPhanPhong IS NOT NULL
        BEGIN
            -- Cho kết thúc phân phòng
            UPDATE dbo.PhanPhong
            SET TrangThai = N'Đã kết thúc',
                NgayKetThuc = CAST(GETDATE() AS DATE)
            WHERE MaPhanPhong = @MaPhanPhong;

            -- Hủy/Thanh lý hợp đồng
            UPDATE dbo.HopDong
            SET TrangThai = N'Đã thanh lý'
            WHERE MaPhanPhong = @MaPhanPhong AND TrangThai IN (N'Có hiệu lực', N'Hết hạn');
        END

        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO


-- PHÒNG & CHỖ Ở
-- Danh sách phòng; @ChiConCho = 1 chỉ lấy phòng Hoạt động còn chỗ trống
CREATE OR ALTER PROCEDURE dbo.sp_Phong_TraCuu
    @MaKhu      VARCHAR(10)  = NULL,
    @TrangThai  NVARCHAR(30) = NULL,
    @ChiConCho  BIT          = 0
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM dbo.vw_PhongChiTiet
    WHERE (@MaKhu     IS NULL OR MaKhu = @MaKhu)
      AND (@TrangThai IS NULL OR TrangThai = @TrangThai)
      AND (@ChiConCho = 0 OR (TrangThai = N'Hoạt động' AND SoChoTrong > 0))
    ORDER BY TenKhu, SoPhong;
END
GO


CREATE OR ALTER PROCEDURE dbo.sp_Phong_XemSinhVien
    @MaPhong INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT MaPhanPhong, MaSV, HoTen, SoPhong, TenKhu, NgayBatDau, NgayKetThuc
    FROM dbo.vw_SinhVienDangO
    WHERE MaPhong = @MaPhong
    ORDER BY HoTen;
END
GO


-- Xếp phòng từ đơn đã duyệt: tạo PhanPhong + HopDong, đóng đơn đăng ký
CREATE OR ALTER PROCEDURE dbo.sp_PhanPhong_Them
    @MaDangKy     INT,
    @MaPhong      INT,
    @NgayBatDau   DATE,
    @NgayKetThuc  DATE,
    @DieuKhoan    NVARCHAR(MAX) = NULL,
    @MaPhanPhong  INT = NULL OUTPUT,
    @MaHopDong    INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRAN;

        DECLARE @MaSV VARCHAR(15), @TTDangKy NVARCHAR(30), @TTPhong NVARCHAR(30);

        SELECT @MaSV = MaSV, @TTDangKy = TrangThai
        FROM dbo.DangKyKTX WITH (UPDLOCK)
        WHERE MaDangKy = @MaDangKy;

        IF @MaSV IS NULL
            THROW 50131, N'Đơn đăng ký không tồn tại.', 1;
        IF @TTDangKy <> N'Đã duyệt'
            THROW 50132, N'Chỉ xếp phòng cho đơn ở trạng thái Đã duyệt.', 1;
        IF @NgayKetThuc <= @NgayBatDau
            THROW 50133, N'Ngày kết thúc phải sau ngày bắt đầu.', 1;

        SELECT @TTPhong = TrangThai
        FROM dbo.Phong WITH (UPDLOCK, HOLDLOCK)
        WHERE MaPhong = @MaPhong;

        IF @TTPhong IS NULL
            THROW 50134, N'Phòng không tồn tại.', 1;
        IF @TTPhong <> N'Hoạt động'
            THROW 50135, N'Phòng không ở trạng thái Hoạt động.', 1;
        IF dbo.fn_SoChoTrong(@MaPhong) <= 0
            THROW 50136, N'Phòng đã hết chỗ.', 1;

        INSERT INTO dbo.PhanPhong (MaSV, MaPhong, MaDangKy, NgayBatDau, NgayKetThuc, TrangThai)
        VALUES (@MaSV, @MaPhong, @MaDangKy, @NgayBatDau, @NgayKetThuc, N'Đang ở');
        SET @MaPhanPhong = SCOPE_IDENTITY();

        INSERT INTO dbo.HopDong (MaPhanPhong, DieuKhoan, TrangThai)
        VALUES (@MaPhanPhong, @DieuKhoan, N'Có hiệu lực');
        SET @MaHopDong = SCOPE_IDENTITY();

        UPDATE dbo.DangKyKTX SET TrangThai = N'Đã phân phòng' WHERE MaDangKy = @MaDangKy;

        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO


-- HỢP ĐỒNG
-- Ngày bắt đầu/kết thúc nằm ở PhanPhong;

-- Tra cứu hợp đồng; @SapHetHanTrongNgay = N: hợp đồng còn hiệu lực hết hạn trong N ngày tới
CREATE OR ALTER PROCEDURE dbo.sp_HopDong_TraCuu
    @MaSV                VARCHAR(15)  = NULL,
    @TrangThai           NVARCHAR(30) = NULL,
    @SapHetHanTrongNgay  INT          = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM dbo.vw_HopDongChiTiet
    WHERE (@MaSV      IS NULL OR MaSV = @MaSV)
      AND (@TrangThai IS NULL OR TrangThai = @TrangThai)
      AND (@SapHetHanTrongNgay IS NULL
           OR (TrangThai = N'Có hiệu lực'
               AND SoNgayConLai BETWEEN 0 AND @SapHetHanTrongNgay))
    ORDER BY NgayKetThuc, MaHopDong;
END
GO


-- hóa đơn chưa trả quá hạn -> 'Quá hạn'
CREATE OR ALTER PROCEDURE dbo.sp_CapNhatTrangThaiDinhKy
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Today DATE = CAST(GETDATE() AS DATE);

    UPDATE hd
    SET hd.TrangThai = N'Hết hạn'
    FROM dbo.HopDong hd
    JOIN dbo.PhanPhong pp ON pp.MaPhanPhong = hd.MaPhanPhong
    WHERE hd.TrangThai = N'Có hiệu lực'
      AND pp.NgayKetThuc < @Today;

    UPDATE dbo.HoaDon
    SET TrangThai = N'Quá hạn'
    WHERE TrangThai = N'Chưa thanh toán'
      AND HanThanhToan < @Today;
END
GO


-- Procedure kết thúc thời gian ở / thanh lý hợp đồng khi hết hạn
CREATE OR ALTER PROCEDURE dbo.sp_KetThucPhanPhong
    @MaPhanPhong INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;

        -- Kiểm tra nợ trước khi cho sinh viên rời KTX
        IF EXISTS (SELECT 1 FROM dbo.HoaDon h
                   WHERE h.MaPhanPhong = @MaPhanPhong
                     AND h.TrangThai <> N'Đã hủy'
                     AND dbo.fn_ConNo(h.MaHoaDon) > 0)
            THROW 50173, N'Sinh viên còn công nợ chưa thanh toán, chưa thể kết thúc ở KTX.', 1;

        -- Cập nhật trạng thái phân phòng
        UPDATE dbo.PhanPhong
        SET TrangThai = N'Đã kết thúc',
            NgayKetThuc = CAST(GETDATE() AS DATE)
        WHERE MaPhanPhong = @MaPhanPhong AND TrangThai = N'Đang ở';

        -- Thanh lý hợp đồng tương ứng
        UPDATE dbo.HopDong
        SET TrangThai = N'Đã thanh lý'
        WHERE MaPhanPhong = @MaPhanPhong AND TrangThai IN (N'Có hiệu lực', N'Hết hạn');

        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO


-- TÀI CHÍNH

-- Thêm 1 dòng chi tiết: tự lấy đơn giá mặc định, tự giảm tiền phòng theo diện ưu tiên.
-- Miễn giảm thực tế = MAX(miễn giảm nhập tay, giảm tự động).
CREATE OR ALTER PROCEDURE dbo.sp_ThemChiTietHoaDon
    @MaHoaDon    INT,
    @MaKhoanThu  INT,
    @SoLuong     INT           = 1,
    @DonGia      DECIMAL(18,2) = NULL,
    @MienGiam    DECIMAL(18,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Loai NVARCHAR(20), @DienUuTien NVARCHAR(100), @DonGiaMacDinh DECIMAL(18,2);

    SELECT @Loai = h.LoaiHoaDon, @DienUuTien = sv.DienUuTien
    FROM dbo.HoaDon h
    JOIN dbo.PhanPhong pp ON pp.MaPhanPhong = h.MaPhanPhong
    JOIN dbo.SinhVien sv  ON sv.MaSV = pp.MaSV
    WHERE h.MaHoaDon = @MaHoaDon;

    IF @Loai IS NULL
        THROW 50201, N'Hóa đơn không tồn tại.', 1;

    SELECT @DonGiaMacDinh = DonGiaMacDinh FROM dbo.KhoanThu WHERE MaKhoanThu = @MaKhoanThu;
    IF @DonGiaMacDinh IS NULL
        THROW 50202, N'Khoản thu không tồn tại.', 1;

    SET @DonGia = COALESCE(@DonGia, @DonGiaMacDinh);

    DECLARE @GiamTuDong DECIMAL(18,2) =
        CASE WHEN @Loai = N'Tiền phòng'
             THEN ROUND(@SoLuong * @DonGia * dbo.fn_TyLeGiam(@DienUuTien) / 100, 0)
             ELSE 0 END;

    SET @MienGiam = CASE WHEN COALESCE(@MienGiam, 0) > @GiamTuDong
                         THEN @MienGiam ELSE @GiamTuDong END;

    INSERT INTO dbo.ChiTietHoaDon (MaHoaDon, MaKhoanThu, SoLuong, DonGia, MienGiam)
    VALUES (@MaHoaDon, @MaKhoanThu, @SoLuong, @DonGia, @MienGiam);
END
GO


-- Lập hóa đơn kèm dòng chi tiết đầu tiên (cùng thành công hoặc cùng rollback)
-- Tiền phòng: KyThu = NULL. Điện nước: KyThu bắt buộc, tự đưa về ngày 1 của tháng.
CREATE OR ALTER PROCEDURE dbo.sp_LapHoaDon
    @MaPhanPhong   INT,
    @LoaiHoaDon    NVARCHAR(20),
    @HanThanhToan  DATE,
    @MaKhoanThu    INT,
    @SoLuong       INT  = 1,
    @KyThu         DATE = NULL,
    @MaHoaDon      INT  = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRAN;

        IF NOT EXISTS (SELECT 1 FROM dbo.PhanPhong WHERE MaPhanPhong = @MaPhanPhong)
            THROW 50211, N'Bản ghi phân phòng không tồn tại.', 1;

        IF @LoaiHoaDon = N'Tiền phòng'
            SET @KyThu = NULL;
        ELSE IF @LoaiHoaDon = N'Điện nước'
        BEGIN
            IF @KyThu IS NULL
                THROW 50212, N'Hóa đơn điện nước phải có kỳ thu.', 1;

            SET @KyThu = DATEFROMPARTS(YEAR(@KyThu), MONTH(@KyThu), 1);

            IF EXISTS (SELECT 1 FROM dbo.HoaDon
                       WHERE MaPhanPhong = @MaPhanPhong AND LoaiHoaDon = N'Điện nước'
                         AND KyThu = @KyThu AND TrangThai <> N'Đã hủy')
                THROW 50213, N'Đã có hóa đơn điện nước cho kỳ thu này.', 1;
        END
        ELSE
            THROW 50214, N'Loại hóa đơn phải là Tiền phòng hoặc Điện nước.', 1;

        INSERT INTO dbo.HoaDon (MaPhanPhong, NgayLap, HanThanhToan, TrangThai, LoaiHoaDon, KyThu)
        VALUES (@MaPhanPhong, CAST(GETDATE() AS DATE), @HanThanhToan, N'Chưa thanh toán', @LoaiHoaDon, @KyThu);
        SET @MaHoaDon = SCOPE_IDENTITY();

        EXEC dbo.sp_ThemChiTietHoaDon @MaHoaDon = @MaHoaDon,
                                      @MaKhoanThu = @MaKhoanThu,
                                      @SoLuong = @SoLuong;
        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO


-- Hủy hóa đơn: chỉ khi chưa có khoản thanh toán thành công nào
CREATE OR ALTER PROCEDURE dbo.sp_HoaDon_Huy
    @MaHoaDon INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.HoaDon
    SET TrangThai = N'Đã hủy'
    WHERE MaHoaDon = @MaHoaDon
      AND TrangThai IN (N'Chưa thanh toán', N'Quá hạn')
      AND dbo.fn_DaThanhToan(MaHoaDon) = 0;

    IF @@ROWCOUNT = 0
        THROW 50221, N'Hóa đơn không tồn tại, đã hủy hoặc đã phát sinh thanh toán.', 1;
END
GO


-- Thanh toán: khóa dòng hóa đơn để tránh hai giao dịch trả cùng lúc
-- (trigger trg_ThanhToan_CapNhatHoaDon tự cập nhật HoaDon.TrangThai)
CREATE OR ALTER PROCEDURE dbo.sp_ThanhToanHoaDon
    @MaHoaDon     INT,
    @SoTien       DECIMAL(18,2),
    @PhuongThuc   NVARCHAR(50),
    @MaGiaoDich   VARCHAR(100) = NULL,
    @MaThanhToan  INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRAN;

        DECLARE @TT NVARCHAR(30);

        SELECT @TT = TrangThai
        FROM dbo.HoaDon WITH (UPDLOCK, HOLDLOCK)
        WHERE MaHoaDon = @MaHoaDon;

        IF @TT IS NULL
            THROW 50231, N'Hóa đơn không tồn tại.', 1;
        IF @TT IN (N'Đã thanh toán', N'Đã hủy')
            THROW 50232, N'Hóa đơn đã thanh toán hoặc đã hủy.', 1;
        IF @SoTien > dbo.fn_ConNo(@MaHoaDon)
            THROW 50233, N'Số tiền vượt quá số còn nợ.', 1;

        INSERT INTO dbo.ThanhToan (MaHoaDon, SoTien, PhuongThuc, TrangThai, MaGiaoDich)
        VALUES (@MaHoaDon, @SoTien, @PhuongThuc, N'Thành công', @MaGiaoDich);
        SET @MaThanhToan = SCOPE_IDENTITY();

        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO


-- TÀI KHOẢN
-- Mật khẩu được băm ở tầng ứng dụng; DB chỉ lưu và trả hash.
CREATE OR ALTER PROCEDURE dbo.sp_TaiKhoan_Them
    @MaTaiKhoan    VARCHAR(15),
    @TenDangNhap   VARCHAR(50),
    @MatKhauHash   VARCHAR(255),
    @MaVaiTro      VARCHAR(10),
    @MaSV          VARCHAR(15) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.TaiKhoan (MaTaiKhoan, TenDangNhap, MatKhauHash, MaSV, MaVaiTro, TrangThai)
    VALUES (@MaTaiKhoan, @TenDangNhap, @MatKhauHash, @MaSV, @MaVaiTro, 1);
END
GO


-- Trả thông tin tài khoản đang hoạt động
CREATE OR ALTER PROCEDURE dbo.sp_TaiKhoan_DangNhap
    @TenDangNhap VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.MatKhauHash, tk.MaSV,
           tk.MaVaiTro, vt.TenVaiTro
    FROM dbo.TaiKhoan tk
    JOIN dbo.VaiTro vt ON vt.MaVaiTro = tk.MaVaiTro
    WHERE tk.TenDangNhap = @TenDangNhap
      AND tk.TrangThai = 1;
END
GO


-- Trả thông tin tài khoản
CREATE OR ALTER PROCEDURE dbo.sp_TaiKhoan_XacThuc
    @TenDangNhap VARCHAR(50),
    @MatKhauHash VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        tk.MaTaiKhoan, 
        tk.MaSV,
        tk.MaVaiTro,
        vt.TenVaiTro
    FROM dbo.TaiKhoan tk
    JOIN dbo.VaiTro vt ON vt.MaVaiTro = tk.MaVaiTro
    WHERE tk.TenDangNhap = @TenDangNhap
        AND tk.MatKhauHash = @MatKhauHash
        AND tk.TrangThai = 1;
END
GO


CREATE OR ALTER PROCEDURE dbo.sp_TaiKhoan_DoiMatKhau
    @MaTaiKhoan     VARCHAR(15),
    @MatKhauHashMoi VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TaiKhoan SET MatKhauHash = @MatKhauHashMoi WHERE MaTaiKhoan = @MaTaiKhoan;

    IF @@ROWCOUNT = 0
        THROW 50241, N'Không tìm thấy tài khoản.', 1;
END
GO


-- Khóa (0) / mở khóa (1) tài khoản
CREATE OR ALTER PROCEDURE dbo.sp_TaiKhoan_DatTrangThai
    @MaTaiKhoan VARCHAR(15),
    @TrangThai  BIT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TaiKhoan SET TrangThai = @TrangThai WHERE MaTaiKhoan = @MaTaiKhoan;

    IF @@ROWCOUNT = 0
        THROW 50242, N'Không tìm thấy tài khoản.', 1;
END
GO

-- Thêm sinh viên kèm tạo tài khoản (cùng thành công hoặc cùng rollback)
CREATE OR ALTER PROCEDURE dbo.sp_SinhVien_ThemKemTaiKhoan
    @MaSV         VARCHAR(15),
    @HoTen        NVARCHAR(100),
    @NgaySinh     DATE,
    @GioiTinh     NVARCHAR(10),
    @SDT          VARCHAR(15),
    @NamHoc       INT,
    @MatKhauHash  VARCHAR(255),
    @MaVaiTro     VARCHAR(10),
    @QueQuan      NVARCHAR(200) = NULL,
    @CCCD         VARCHAR(12)   = NULL,
    @Khoa         NVARCHAR(100) = NULL,
    @DienUuTien   NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRAN;
 
        EXEC dbo.sp_SinhVien_Them
            @MaSV = @MaSV, @HoTen = @HoTen, @NgaySinh = @NgaySinh,
            @GioiTinh = @GioiTinh, @SDT = @SDT, @NamHoc = @NamHoc,
            @QueQuan = @QueQuan, @CCCD = @CCCD, @Khoa = @Khoa,
            @DienUuTien = @DienUuTien;
 
        EXEC dbo.sp_TaiKhoan_Them
            @MaTaiKhoan = @MaSV, @TenDangNhap = @MaSV,
            @MatKhauHash = @MatKhauHash, @MaVaiTro = @MaVaiTro,
            @MaSV = @MaSV;
 
        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO