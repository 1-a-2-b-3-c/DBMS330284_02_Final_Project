using Backend.Data;
using Backend.Dtos;

namespace Backend.Repositories;

public class ViPhamRepository
{
    // sp_ViPham_TraCuu: mọi tham số đều tùy chọn
    public List<ViPhamDto> TraCuu(string? maSV, string? trangThaiXuLy,
                                  string? hinhThucXuLy = null, int? maViPham = null)
    {
        var ds = new List<ViPhamDto>();
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_ViPham_TraCuu");
        cmd.AddParam("@MaSV", maSV);
        cmd.AddParam("@TrangThaiXuLy", trangThaiXuLy);
        cmd.AddParam("@HinhThucXuLy", hinhThucXuLy);
        cmd.AddParam("@MaViPham", maViPham);

        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            ds.Add(new ViPhamDto
            {
                MaViPham = r.GetInt32(r.GetOrdinal("MaViPham")),
                MaSV = r.GetString(r.GetOrdinal("MaSV")),
                HoTen = r.GetString(r.GetOrdinal("HoTen")),
                NgayViPham = r.GetDateOnly("NgayViPham"),
                NgayLapBienBan = r.GetDateOnly("NgayLapBienBan"),
                NoiDung = r.GetString(r.GetOrdinal("NoiDung")),
                DiaDiem = r.GetStringOrNull("DiaDiem"),
                HinhThucXuLy = r.GetString(r.GetOrdinal("HinhThucXuLy")),
                TrangThaiXuLy = r.GetString(r.GetOrdinal("TrangThaiXuLy"))
            });
        }
        return ds;
    }

    public int Them(ThemViPhamRequest req)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_ViPham_Them");
        cmd.AddParam("@MaSV", req.MaSV);
        cmd.AddParam("@NgayViPham", req.NgayViPham);
        cmd.AddParam("@NoiDung", req.NoiDung);
        cmd.AddParam("@HinhThucXuLy", req.HinhThucXuLy);
        cmd.AddParam("@DiaDiem", req.DiaDiem);
        cmd.AddParam("@NgayLapBienBan", req.NgayLapBienBan);
        return Convert.ToInt32(cmd.ExecuteScalar());
    }

    public void CapNhat(int maViPham, CapNhatViPhamRequest req)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_ViPham_CapNhat");
        cmd.AddParam("@MaViPham", maViPham);
        cmd.AddParam("@NgayViPham", req.NgayViPham);
        cmd.AddParam("@NoiDung", req.NoiDung);
        cmd.AddParam("@DiaDiem", req.DiaDiem);
        cmd.AddParam("@HinhThucXuLy", req.HinhThucXuLy);
        cmd.ExecuteNonQuery();
    }

    public void XuLy(int maViPham)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_ViPham_XuLy");
        cmd.AddParam("@MaViPham", maViPham);
        cmd.ExecuteNonQuery();
    }

    public void XuLyBuocRoiKtx(int maViPham)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_ViPham_XuLyBuocRoiKTX");
        cmd.AddParam("@MaViPham", maViPham);
        cmd.ExecuteNonQuery();
    }
}