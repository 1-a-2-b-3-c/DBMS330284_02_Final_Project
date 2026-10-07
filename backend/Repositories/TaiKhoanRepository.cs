using Backend.Data;
using Backend.Dtos;

namespace Backend.Repositories;

public class TaiKhoanRepository
{
    public List<TaiKhoanQuanLyDto> DanhSachQuanLy(string? tuKhoa, string? maVaiTro, bool? trangThai)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_TaiKhoan_DanhSach");
        cmd.AddParam("@TuKhoa", string.IsNullOrWhiteSpace(tuKhoa) ? null : tuKhoa.Trim());
        cmd.AddParam("@MaVaiTro", maVaiTro);
        cmd.AddParam("@TrangThai", trangThai);

        using var r = cmd.ExecuteReader();
        var taiKhoans = new List<TaiKhoanQuanLyDto>();
        while (r.Read())
        {
            taiKhoans.Add(new TaiKhoanQuanLyDto
            {
                MaTaiKhoan = r.GetString(r.GetOrdinal("MaTaiKhoan")),
                TenDangNhap = r.GetString(r.GetOrdinal("TenDangNhap")),
                MaSV = r.GetStringOrNull("MaSV"),
                MaVaiTro = r.GetString(r.GetOrdinal("MaVaiTro")),
                TenVaiTro = r.GetString(r.GetOrdinal("TenVaiTro")),
                TrangThai = r.GetBoolean(r.GetOrdinal("TrangThai"))
            });
        }
        return taiKhoans;
    }

    public TaiKhoanQuanLyDto? LayTaiKhoanQuanLy(string maTaiKhoan)
        => DanhSachQuanLy(maTaiKhoan, null, null).FirstOrDefault(x => x.MaTaiKhoan == maTaiKhoan);

    public void TaoTaiKhoanQuanLy(TaoTaiKhoanQuanLyRequest req, string matKhauHash)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_TaiKhoan_TaoTaiKhoanQuanLy");
        cmd.AddParam("@MaTaiKhoan", req.MaTaiKhoan);
        cmd.AddParam("@TenDangNhap", req.TenDangNhap);
        cmd.AddParam("@MatKhauHash", matKhauHash);
        cmd.AddParam("@MaVaiTro", req.MaVaiTro);
        cmd.ExecuteNonQuery();
    }

    public void DatLaiMatKhauQuanLy(string maTaiKhoan, string matKhauHashMoi)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_TaiKhoan_Admin_DatLaiMatKhau");
        cmd.AddParam("@MaTaiKhoan", maTaiKhoan);
        cmd.AddParam("@MatKhauHashMoi", matKhauHashMoi);
        cmd.ExecuteNonQuery();
    }

    public void DatTrangThai(string maTaiKhoan, bool trangThai, string maNguoiThucHien)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_TaiKhoan_DatTrangThai");
        cmd.AddParam("@MaTaiKhoan", maTaiKhoan);
        cmd.AddParam("@TrangThai", trangThai);
        cmd.AddParam("@MaNguoiThucHien", maNguoiThucHien);
        cmd.ExecuteNonQuery();
    }

    public async Task<bool> DangHoatDongAsync(string maTaiKhoan, CancellationToken cancellationToken)
    {
        await using var conn = Database.GetConnection();
        await conn.OpenAsync(cancellationToken);
        await using var cmd = conn.Proc("dbo.sp_TaiKhoan_KiemTraHoatDong");
        cmd.AddParam("@MaTaiKhoan", maTaiKhoan);
        var result = await cmd.ExecuteScalarAsync(cancellationToken);
        return result is bool dangHoatDong && dangHoatDong;
    }

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