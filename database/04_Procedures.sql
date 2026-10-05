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
    @TrangThaiXuLy  NVARCHAR(30) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT vp.MaViPham, vp.MaSV, sv.HoTen, vp.NgayViPham, vp.NgayLapBienBan,
           vp.NoiDung, vp.DiaDiem, vp.HinhThucXuLy, vp.TrangThaiXuLy
    FROM dbo.ViPham vp
    JOIN dbo.SinhVien sv ON sv.MaSV = vp.MaSV
    WHERE (@MaSV          IS NULL OR vp.MaSV = @MaSV)
      AND (@TrangThaiXuLy IS NULL OR vp.TrangThaiXuLy = @TrangThaiXuLy)
    ORDER BY vp.NgayViPham DESC, vp.MaViPham DESC;
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


-- CHUYỂN PHÒNG
CREATE OR ALTER PROCEDURE dbo.sp_ChuyenPhong_YeuCau
    @MaPhanPhong   INT,
    @MaPhongMoi    INT,
    @LyDo          NVARCHAR(500),
    @MaChuyenPhong INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaPhongCu INT, @TT NVARCHAR(30);

    SELECT @MaPhongCu = MaPhong, @TT = TrangThai
    FROM dbo.PhanPhong
    WHERE MaPhanPhong = @MaPhanPhong;

    IF @TT IS NULL
        THROW 50141, N'Không tìm thấy bản ghi phân phòng.', 1;
    IF @TT <> N'Đang ở'
        THROW 50142, N'Sinh viên không còn ở phòng này.', 1;
    IF @MaPhongCu = @MaPhongMoi
        THROW 50143, N'Phòng mới trùng phòng hiện tại.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = @MaPhongMoi AND TrangThai = N'Hoạt động')
        THROW 50144, N'Phòng mới không tồn tại hoặc không Hoạt động.', 1;
    IF EXISTS (SELECT 1 FROM dbo.ChuyenPhong
               WHERE MaPhanPhong = @MaPhanPhong AND TrangThai = N'Chờ duyệt')
        THROW 50145, N'Đã có yêu cầu chuyển phòng đang chờ duyệt.', 1;

    INSERT INTO dbo.ChuyenPhong (MaPhanPhong, MaPhongMoi, LyDo, NgayYeuCau, TrangThai)
    VALUES (@MaPhanPhong, @MaPhongMoi, @LyDo, CAST(GETDATE() AS DATE), N'Chờ duyệt');

    SET @MaChuyenPhong = SCOPE_IDENTITY();
END
GO


-- Từ chối, hoặc duyệt và thực hiện luôn: đóng dòng cũ, mở dòng mới, chuyển hợp đồng
CREATE OR ALTER PROCEDURE dbo.sp_ChuyenPhong_XuLy
    @MaChuyenPhong INT,
    @ChapNhan      BIT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRAN;

        DECLARE @Today DATE = CAST(GETDATE() AS DATE);
        DECLARE @MaPhanPhong INT, @MaPhongMoi INT, @TT NVARCHAR(30);

        SELECT @MaPhanPhong = MaPhanPhong, @MaPhongMoi = MaPhongMoi, @TT = TrangThai
        FROM dbo.ChuyenPhong WITH (UPDLOCK)
        WHERE MaChuyenPhong = @MaChuyenPhong;

        IF @TT IS NULL
            THROW 50151, N'Yêu cầu chuyển phòng không tồn tại.', 1;
        IF @TT <> N'Chờ duyệt'
            THROW 50152, N'Yêu cầu không ở trạng thái Chờ duyệt.', 1;

        IF @ChapNhan = 0
        BEGIN
            UPDATE dbo.ChuyenPhong
            SET TrangThai = N'Từ chối', NgayXuLy = @Today
            WHERE MaChuyenPhong = @MaChuyenPhong;
        END
        ELSE
        BEGIN
            DECLARE @MaSV VARCHAR(15), @NgayBatDau DATE, @NgayKetThuc DATE,
                    @TTPP NVARCHAR(30), @NgayChuyen DATE, @MaPhanPhongMoi INT;

            SELECT @MaSV = MaSV, @NgayBatDau = NgayBatDau,
                   @NgayKetThuc = NgayKetThuc, @TTPP = TrangThai
            FROM dbo.PhanPhong WITH (UPDLOCK)
            WHERE MaPhanPhong = @MaPhanPhong;

            IF @TTPP <> N'Đang ở'
                THROW 50153, N'Sinh viên không còn ở phòng cũ.', 1;

            IF NOT EXISTS (SELECT 1 FROM dbo.Phong WITH (UPDLOCK, HOLDLOCK)
                           WHERE MaPhong = @MaPhongMoi AND TrangThai = N'Hoạt động')
                THROW 50154, N'Phòng mới không Hoạt động.', 1;
            IF dbo.fn_SoChoTrong(@MaPhongMoi) <= 0
                THROW 50155, N'Phòng mới đã hết chỗ.', 1;

            SET @NgayChuyen = CASE WHEN @Today < @NgayBatDau THEN @NgayBatDau ELSE @Today END;

            UPDATE dbo.PhanPhong
            SET TrangThai = N'Đã chuyển phòng', NgayKetThuc = @NgayChuyen
            WHERE MaPhanPhong = @MaPhanPhong;

            INSERT INTO dbo.PhanPhong (MaSV, MaPhong, MaDangKy, NgayBatDau, NgayKetThuc, TrangThai)
            VALUES (@MaSV, @MaPhongMoi, NULL, @NgayChuyen, @NgayKetThuc, N'Đang ở');
            SET @MaPhanPhongMoi = SCOPE_IDENTITY();

            -- Hợp đồng còn hiệu lực chuyển sang dòng phân phòng mới
            UPDATE dbo.HopDong
            SET MaPhanPhong = @MaPhanPhongMoi
            WHERE MaPhanPhong = @MaPhanPhong
              AND TrangThai = N'Có hiệu lực';

            UPDATE dbo.ChuyenPhong
            SET TrangThai = N'Hoàn thành', NgayXuLy = @Today
            WHERE MaChuyenPhong = @MaChuyenPhong;
        END

        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO


-- TRẢ PHÒNG
CREATE OR ALTER PROCEDURE dbo.sp_TraPhong_YeuCau
    @MaPhanPhong INT,
    @LyDo        NVARCHAR(500),
    @MaTraPhong  INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TT NVARCHAR(30);
    SELECT @TT = TrangThai FROM dbo.PhanPhong WHERE MaPhanPhong = @MaPhanPhong;

    IF @TT IS NULL
        THROW 50161, N'Không tìm thấy bản ghi phân phòng.', 1;
    IF @TT <> N'Đang ở'
        THROW 50162, N'Sinh viên không còn ở phòng này.', 1;
    IF EXISTS (SELECT 1 FROM dbo.TraPhong
               WHERE MaPhanPhong = @MaPhanPhong AND TrangThai = N'Chờ duyệt')
        THROW 50163, N'Đã có yêu cầu trả phòng đang chờ duyệt.', 1;

    INSERT INTO dbo.TraPhong (MaPhanPhong, LyDo, NgayYeuCau, TrangThai)
    VALUES (@MaPhanPhong, @LyDo, CAST(GETDATE() AS DATE), N'Chờ duyệt');

    SET @MaTraPhong = SCOPE_IDENTITY();
END
GO


-- Từ chối, hoặc duyệt và hoàn tất: kiểm kê, trả phòng, thanh lý hợp đồng
CREATE OR ALTER PROCEDURE dbo.sp_TraPhong_XuLy
    @MaTraPhong    INT,
    @ChapNhan      BIT,
    @NgayTra       DATE          = NULL,
    @KetQuaKiemKe  NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRAN;

        DECLARE @MaPhanPhong INT, @TT NVARCHAR(30);

        SELECT @MaPhanPhong = MaPhanPhong, @TT = TrangThai
        FROM dbo.TraPhong WITH (UPDLOCK)
        WHERE MaTraPhong = @MaTraPhong;

        IF @TT IS NULL
            THROW 50171, N'Yêu cầu trả phòng không tồn tại.', 1;
        IF @TT <> N'Chờ duyệt'
            THROW 50172, N'Yêu cầu không ở trạng thái Chờ duyệt.', 1;

        IF @ChapNhan = 0
        BEGIN
            UPDATE dbo.TraPhong SET TrangThai = N'Từ chối' WHERE MaTraPhong = @MaTraPhong;
        END
        ELSE
        BEGIN
            SET @NgayTra = COALESCE(@NgayTra, CAST(GETDATE() AS DATE));

            IF EXISTS (SELECT 1 FROM dbo.HoaDon h
                       WHERE h.MaPhanPhong = @MaPhanPhong
                         AND h.TrangThai <> N'Đã hủy'
                         AND dbo.fn_ConNo(h.MaHoaDon) > 0)
                THROW 50173, N'Sinh viên còn công nợ chưa thanh toán, chưa thể trả phòng.', 1;

            UPDATE dbo.PhanPhong
            SET TrangThai = N'Đã trả phòng',
                NgayKetThuc = CASE WHEN @NgayTra < NgayBatDau THEN NgayBatDau ELSE @NgayTra END
            WHERE MaPhanPhong = @MaPhanPhong;

            UPDATE dbo.HopDong
            SET TrangThai = N'Đã thanh lý'
            WHERE MaPhanPhong = @MaPhanPhong
              AND TrangThai IN (N'Có hiệu lực', N'Hết hạn');

            UPDATE dbo.TraPhong
            SET TrangThai = N'Hoàn thành', NgayTra = @NgayTra, KetQuaKiemKe = @KetQuaKiemKe
            WHERE MaTraPhong = @MaTraPhong;
        END

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
-- gia hạn được duyệt thì cập nhật PhanPhong.NgayKetThuc.

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


CREATE OR ALTER PROCEDURE dbo.sp_GiaHan_YeuCau
    @MaHopDong       INT,
    @NgayKetThucMoi  DATE,
    @MaGiaHan        INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TTHopDong NVARCHAR(30), @TTPhanPhong NVARCHAR(30), @NgayKetThuc DATE;

    SELECT @TTHopDong = hd.TrangThai, @TTPhanPhong = pp.TrangThai, @NgayKetThuc = pp.NgayKetThuc
    FROM dbo.HopDong hd
    JOIN dbo.PhanPhong pp ON pp.MaPhanPhong = hd.MaPhanPhong
    WHERE hd.MaHopDong = @MaHopDong;

    IF @TTHopDong IS NULL
        THROW 50181, N'Không tìm thấy hợp đồng.', 1;
    IF @TTHopDong NOT IN (N'Có hiệu lực', N'Hết hạn') OR @TTPhanPhong <> N'Đang ở'
        THROW 50182, N'Hợp đồng không thể gia hạn (đã thanh lý/hủy hoặc sinh viên đã rời KTX).', 1;
    IF @NgayKetThuc IS NULL OR @NgayKetThucMoi <= @NgayKetThuc
        THROW 50183, N'Ngày kết thúc mới phải sau ngày kết thúc hiện tại.', 1;
    IF EXISTS (SELECT 1 FROM dbo.GiaHanHopDong
               WHERE MaHopDong = @MaHopDong AND TrangThai = N'Chờ duyệt')
        THROW 50184, N'Hợp đồng đã có yêu cầu gia hạn đang chờ duyệt.', 1;

    INSERT INTO dbo.GiaHanHopDong (MaHopDong, NgayYeuCau, NgayBatDauMoi, NgayKetThucMoi, TrangThai)
    VALUES (@MaHopDong, CAST(GETDATE() AS DATE), @NgayKetThuc, @NgayKetThucMoi, N'Chờ duyệt');

    SET @MaGiaHan = SCOPE_IDENTITY();
END
GO


CREATE OR ALTER PROCEDURE dbo.sp_GiaHan_Duyet
    @MaGiaHan  INT,
    @ChapNhan  BIT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRAN;

        DECLARE @MaHopDong INT, @NgayKetThucMoi DATE, @TT NVARCHAR(30);

        SELECT @MaHopDong = MaHopDong, @NgayKetThucMoi = NgayKetThucMoi, @TT = TrangThai
        FROM dbo.GiaHanHopDong WITH (UPDLOCK)
        WHERE MaGiaHan = @MaGiaHan;

        IF @TT IS NULL
            THROW 50191, N'Yêu cầu gia hạn không tồn tại.', 1;
        IF @TT <> N'Chờ duyệt'
            THROW 50192, N'Yêu cầu không ở trạng thái Chờ duyệt.', 1;

        IF @ChapNhan = 0
        BEGIN
            UPDATE dbo.GiaHanHopDong SET TrangThai = N'Từ chối' WHERE MaGiaHan = @MaGiaHan;
        END
        ELSE
        BEGIN
            UPDATE pp
            SET pp.NgayKetThuc = @NgayKetThucMoi
            FROM dbo.PhanPhong pp
            JOIN dbo.HopDong hd ON hd.MaPhanPhong = pp.MaPhanPhong
            WHERE hd.MaHopDong = @MaHopDong
              AND pp.TrangThai = N'Đang ở'
              AND (pp.NgayKetThuc IS NULL OR pp.NgayKetThuc < @NgayKetThucMoi);

            IF @@ROWCOUNT = 0
                THROW 50193, N'Không thể áp dụng gia hạn (sinh viên đã rời KTX hoặc ngày kết thúc không hợp lệ).', 1;

            UPDATE dbo.HopDong SET TrangThai = N'Có hiệu lực' WHERE MaHopDong = @MaHopDong;
            UPDATE dbo.GiaHanHopDong SET TrangThai = N'Đã duyệt' WHERE MaGiaHan = @MaGiaHan;
        END

        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
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