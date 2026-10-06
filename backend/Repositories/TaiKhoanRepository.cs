using Backend.Data;
using Backend.Dtos;

namespace Backend.Repositories;

public class TaiKhoanRepository
{
    // sp_TaiKhoan_DangNhap: chỉ trả tài khoản đang hoạt động; null nếu không có
    public TaiKhoanDto? DangNhap(string tenDangNhap)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_TaiKhoan_DangNhap");
        cmd.AddParam("@TenDangNhap", tenDangNhap);

        using var r = cmd.ExecuteReader();
        if (!r.Read()) return null;
        return new TaiKhoanDto
        {
            MaTaiKhoan = r.GetString(r.GetOrdinal("MaTaiKhoan")),
            TenDangNhap = r.GetString(r.GetOrdinal("TenDangNhap")),
            MatKhauHash = r.GetString(r.GetOrdinal("MatKhauHash")),
            MaSV = r.GetStringOrNull("MaSV"),
            MaVaiTro = r.GetString(r.GetOrdinal("MaVaiTro")),
            TenVaiTro = r.GetString(r.GetOrdinal("TenVaiTro"))
        };
    }

    // sp_TaiKhoan_DoiMatKhau
    public void DoiMatKhau(string maTaiKhoan, string matKhauHashMoi)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_TaiKhoan_DoiMatKhau");
        cmd.AddParam("@MaTaiKhoan", maTaiKhoan);
        cmd.AddParam("@MatKhauHashMoi", matKhauHashMoi);
        cmd.ExecuteNonQuery();
    }
}