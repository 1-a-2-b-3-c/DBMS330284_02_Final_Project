using Backend.Data;
using Backend.Dtos;

namespace Backend.Repositories;

public class ViPhamRepository
{
    // sp_ViPham_TraCuu: mọi tham số đều tùy chọn
    public List<ViPhamDto> TraCuu(string? maSV, string? trangThaiXuLy)
    {
        var ds = new List<ViPhamDto>();
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_ViPham_TraCuu");
        cmd.AddParam("@MaSV", maSV);
        cmd.AddParam("@TrangThaiXuLy", trangThaiXuLy);

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
}