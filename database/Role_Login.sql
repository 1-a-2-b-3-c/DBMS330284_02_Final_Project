USE [master];
GO


CREATE LOGIN [login_KTX_Admin] WITH PASSWORD = '123456', CHECK_POLICY = ON;
CREATE LOGIN [login_KTX_QuanLy] WITH PASSWORD = '123456', CHECK_POLICY = ON;
CREATE LOGIN [login_KTX_TaiChinh] WITH PASSWORD = '123456', CHECK_POLICY = ON;
CREATE LOGIN [login_KTX_SinhVien] WITH PASSWORD = '123456', CHECK_POLICY = ON;
GO

 
USE [QuanLyKTX_Frontend];
GO


CREATE ROLE [rl_KTX_Admin] AUTHORIZATION [dbo];
CREATE ROLE [rl_KTX_QuanLy] AUTHORIZATION [dbo];
CREATE ROLE [rl_KTX_TaiChinh] AUTHORIZATION [dbo];
CREATE ROLE [rl_KTX_SinhVien] AUTHORIZATION [dbo];
GO


CREATE USER [usr_KTX_Admin] FOR LOGIN [login_KTX_Admin];
CREATE USER [usr_KTX_QuanLy] FOR LOGIN [login_KTX_QuanLy];
CREATE USER [usr_KTX_TaiChinh] FOR LOGIN [login_KTX_TaiChinh];
CREATE USER [usr_KTX_SinhVien] FOR LOGIN [login_KTX_SinhVien];
GO


ALTER ROLE [rl_KTX_Admin] ADD MEMBER [usr_KTX_Admin];
ALTER ROLE [rl_KTX_QuanLy] ADD MEMBER [usr_KTX_QuanLy];
ALTER ROLE [rl_KTX_TaiChinh] ADD MEMBER [usr_KTX_TaiChinh];
ALTER ROLE [rl_KTX_SinhVien] ADD MEMBER [usr_KTX_SinhVien];
GO


-- Quản lý KTX: chỉ thực thi các nghiệp vụ thuộc phạm vi quản lý
GRANT SELECT ON OBJECT::dbo.vw_PhongChiTiet TO [rl_KTX_QuanLy];
GRANT SELECT ON OBJECT::dbo.vw_SinhVienDangO TO [rl_KTX_QuanLy];
GRANT SELECT ON OBJECT::dbo.vw_HopDongChiTiet TO [rl_KTX_QuanLy];
GRANT EXECUTE ON OBJECT::dbo.sp_DangKyKTX_Duyet TO [rl_KTX_QuanLy];
GRANT EXECUTE ON OBJECT::dbo.sp_PhanPhong_Them TO [rl_KTX_QuanLy];
GRANT EXECUTE ON OBJECT::dbo.sp_KetThucPhanPhong TO [rl_KTX_QuanLy];
GRANT EXECUTE ON OBJECT::dbo.sp_ViPham_CapNhat TO [rl_KTX_QuanLy];
GRANT EXECUTE ON OBJECT::dbo.sp_ViPham_XuLy TO [rl_KTX_QuanLy];
DENY DELETE ON OBJECT::dbo.HoaDon TO [rl_KTX_QuanLy];
GO

-- Tài chính: hóa đơn, khoản thu và thanh toán
GRANT SELECT ON OBJECT::dbo.vw_HopDongChiTiet TO [rl_KTX_TaiChinh];
GRANT SELECT ON OBJECT::dbo.vw_CongNoHoaDon TO [rl_KTX_TaiChinh];
GRANT EXECUTE ON OBJECT::dbo.sp_LapHoaDon TO [rl_KTX_TaiChinh];
GRANT EXECUTE ON OBJECT::dbo.sp_ThanhToanHoaDon TO [rl_KTX_TaiChinh];
GRANT EXECUTE ON OBJECT::dbo.sp_HoaDon_Huy TO [rl_KTX_TaiChinh];
 

-- Sinh viên: ví dụ chỉ cho xem thông tin phòng tổng quát
GRANT SELECT ON OBJECT::dbo.vw_PhongChiTiet TO [rl_KTX_SinhVien];
DENY SELECT ON OBJECT::dbo.TaiKhoan TO [rl_KTX_SinhVien];
DENY SELECT ON OBJECT::dbo.ThanhToan TO [rl_KTX_SinhVien];
DENY INSERT, UPDATE, DELETE ON SCHEMA::dbo TO [rl_KTX_SinhVien];
 

-- Ví dụ cú pháp thu hồi một quyền đã cấp trước đó
-- REVOKE SELECT ON OBJECT::dbo.vw_ThongKeViPham FROM [rl_KTX_QuanLy];
-- Ví dụ chặn xóa dữ liệu hóa đơn của nhóm quản lý KTX
GO




-- UNDO
USE [QuanLyKTX_Frontend];
GO


IF DATABASE_PRINCIPAL_ID(N'rl_KTX_QuanLy') IS NOT NULL
BEGIN
    REVOKE SELECT ON OBJECT::dbo.vw_PhongChiTiet FROM [rl_KTX_QuanLy];
    REVOKE SELECT ON OBJECT::dbo.vw_SinhVienDangO FROM [rl_KTX_QuanLy];
    REVOKE SELECT ON OBJECT::dbo.vw_HopDongChiTiet FROM [rl_KTX_QuanLy];
    REVOKE EXECUTE ON OBJECT::dbo.sp_DangKyKTX_Duyet FROM [rl_KTX_QuanLy];
    REVOKE EXECUTE ON OBJECT::dbo.sp_PhanPhong_Them FROM [rl_KTX_QuanLy];
    REVOKE EXECUTE ON OBJECT::dbo.sp_KetThucPhanPhong FROM [rl_KTX_QuanLy];
    REVOKE EXECUTE ON OBJECT::dbo.sp_ViPham_CapNhat FROM [rl_KTX_QuanLy];
    REVOKE EXECUTE ON OBJECT::dbo.sp_ViPham_XuLy FROM [rl_KTX_QuanLy];
    REVOKE DELETE ON OBJECT::dbo.HoaDon FROM [rl_KTX_QuanLy];
END;


IF DATABASE_PRINCIPAL_ID(N'rl_KTX_TaiChinh') IS NOT NULL
BEGIN
    REVOKE SELECT ON OBJECT::dbo.vw_HopDongChiTiet FROM [rl_KTX_TaiChinh];
    REVOKE SELECT ON OBJECT::dbo.vw_CongNoHoaDon FROM [rl_KTX_TaiChinh];
    REVOKE EXECUTE ON OBJECT::dbo.sp_LapHoaDon FROM [rl_KTX_TaiChinh];
    REVOKE EXECUTE ON OBJECT::dbo.sp_ThanhToanHoaDon FROM [rl_KTX_TaiChinh];
    REVOKE EXECUTE ON OBJECT::dbo.sp_HoaDon_Huy FROM [rl_KTX_TaiChinh];
END;


IF DATABASE_PRINCIPAL_ID(N'rl_KTX_SinhVien') IS NOT NULL
BEGIN
    REVOKE SELECT ON OBJECT::dbo.vw_PhongChiTiet FROM [rl_KTX_SinhVien];
    REVOKE SELECT ON OBJECT::dbo.TaiKhoan FROM [rl_KTX_SinhVien];
    REVOKE SELECT ON OBJECT::dbo.ThanhToan FROM [rl_KTX_SinhVien];
    REVOKE INSERT, UPDATE, DELETE ON SCHEMA::dbo FROM [rl_KTX_SinhVien];
END;
GO


IF DATABASE_PRINCIPAL_ID(N'rl_KTX_Admin') IS NOT NULL
   AND DATABASE_PRINCIPAL_ID(N'usr_KTX_Admin') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.database_role_members AS drm
       JOIN sys.database_principals AS role_principal
           ON role_principal.principal_id = drm.role_principal_id
       JOIN sys.database_principals AS member_principal
           ON member_principal.principal_id = drm.member_principal_id
       WHERE role_principal.name = N'rl_KTX_Admin'
         AND member_principal.name = N'usr_KTX_Admin'
   )
    ALTER ROLE [rl_KTX_Admin] DROP MEMBER [usr_KTX_Admin];


IF DATABASE_PRINCIPAL_ID(N'rl_KTX_QuanLy') IS NOT NULL
   AND DATABASE_PRINCIPAL_ID(N'usr_KTX_QuanLy') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.database_role_members AS drm
       JOIN sys.database_principals AS role_principal
           ON role_principal.principal_id = drm.role_principal_id
       JOIN sys.database_principals AS member_principal
           ON member_principal.principal_id = drm.member_principal_id
       WHERE role_principal.name = N'rl_KTX_QuanLy'
         AND member_principal.name = N'usr_KTX_QuanLy'
   )
    ALTER ROLE [rl_KTX_QuanLy] DROP MEMBER [usr_KTX_QuanLy];


IF DATABASE_PRINCIPAL_ID(N'rl_KTX_TaiChinh') IS NOT NULL
   AND DATABASE_PRINCIPAL_ID(N'usr_KTX_TaiChinh') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.database_role_members AS drm
       JOIN sys.database_principals AS role_principal
           ON role_principal.principal_id = drm.role_principal_id
       JOIN sys.database_principals AS member_principal
           ON member_principal.principal_id = drm.member_principal_id
       WHERE role_principal.name = N'rl_KTX_TaiChinh'
         AND member_principal.name = N'usr_KTX_TaiChinh'
   )
    ALTER ROLE [rl_KTX_TaiChinh] DROP MEMBER [usr_KTX_TaiChinh];


IF DATABASE_PRINCIPAL_ID(N'rl_KTX_SinhVien') IS NOT NULL
   AND DATABASE_PRINCIPAL_ID(N'usr_KTX_SinhVien') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.database_role_members AS drm
       JOIN sys.database_principals AS role_principal
           ON role_principal.principal_id = drm.role_principal_id
       JOIN sys.database_principals AS member_principal
           ON member_principal.principal_id = drm.member_principal_id
       WHERE role_principal.name = N'rl_KTX_SinhVien'
         AND member_principal.name = N'usr_KTX_SinhVien'
   )
    ALTER ROLE [rl_KTX_SinhVien] DROP MEMBER [usr_KTX_SinhVien];
GO


IF DATABASE_PRINCIPAL_ID(N'usr_KTX_Admin') IS NOT NULL
    DROP USER [usr_KTX_Admin];
IF DATABASE_PRINCIPAL_ID(N'usr_KTX_QuanLy') IS NOT NULL
    DROP USER [usr_KTX_QuanLy];
IF DATABASE_PRINCIPAL_ID(N'usr_KTX_TaiChinh') IS NOT NULL
    DROP USER [usr_KTX_TaiChinh];
IF DATABASE_PRINCIPAL_ID(N'usr_KTX_SinhVien') IS NOT NULL
    DROP USER [usr_KTX_SinhVien];
GO


IF DATABASE_PRINCIPAL_ID(N'rl_KTX_Admin') IS NOT NULL
    DROP ROLE [rl_KTX_Admin];
IF DATABASE_PRINCIPAL_ID(N'rl_KTX_QuanLy') IS NOT NULL
    DROP ROLE [rl_KTX_QuanLy];
IF DATABASE_PRINCIPAL_ID(N'rl_KTX_TaiChinh') IS NOT NULL
    DROP ROLE [rl_KTX_TaiChinh];
IF DATABASE_PRINCIPAL_ID(N'rl_KTX_SinhVien') IS NOT NULL
    DROP ROLE [rl_KTX_SinhVien];
GO


USE [master];
GO


IF SUSER_ID(N'login_KTX_Admin') IS NOT NULL
    DROP LOGIN [login_KTX_Admin];
IF SUSER_ID(N'login_KTX_QuanLy') IS NOT NULL
    DROP LOGIN [login_KTX_QuanLy];
IF SUSER_ID(N'login_KTX_TaiChinh') IS NOT NULL
    DROP LOGIN [login_KTX_TaiChinh];
IF SUSER_ID(N'login_KTX_SinhVien') IS NOT NULL
    DROP LOGIN [login_KTX_SinhVien];
GO
