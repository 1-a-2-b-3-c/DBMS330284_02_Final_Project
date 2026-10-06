using Backend.Data;
using Backend.Dtos;

namespace Backend.Repositories;

public class PhongRepository
{
    // sp_Phong_TraCuu (đọc vw_PhongChiTiet)
    public List<PhongDto> TraCuu(string? maKhu, string? trangThai, bool chiConCho)
    {
        var ds = new List<PhongDto>();
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_Phong_TraCuu");
        cmd.AddParam("@MaKhu", maKhu);
        cmd.AddParam("@TrangThai", trangThai);
        cmd.AddParam("@ChiConCho", chiConCho);
        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            ds.Add(new PhongDto
            {
                MaPhong = Convert.ToInt32(r["MaPhong"]),
                SoPhong = r.GetString(r.GetOrdinal("SoPhong")),
                MaKhu = r.GetString(r.GetOrdinal("MaKhu")),
                TenKhu = r.GetString(r.GetOrdinal("TenKhu")),
                MaLoaiPhong = r.GetString(r.GetOrdinal("MaLoaiPhong")),
                TenLoaiPhong = r.GetString(r.GetOrdinal("TenLoaiPhong")),
                SoNguoiToiDa = Convert.ToInt32(r["SoNguoiToiDa"]),
                DonGia = Convert.ToDecimal(r["DonGia"]),
                TrangThai = r.GetString(r.GetOrdinal("TrangThai")),
                SoNguoiDangO = Convert.ToInt32(r["SoNguoiDangO"]),
                SoChoTrong = Convert.ToInt32(r["SoChoTrong"])
            });
        }
        return ds;
    }

    // Phòng sinh viên đang ở (đọc vw_SinhVienDangO, các cột này đều có trong sp_Phong_XemSinhVien)
    public List<PhongCuaToiDto> PhongDangO(string maSV)
    {
        var ds = new List<PhongCuaToiDto>();
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Query(@"
            SELECT MaPhanPhong, MaPhong, SoPhong, TenKhu, NgayBatDau, NgayKetThuc
            FROM dbo.vw_SinhVienDangO
            WHERE MaSV = @MaSV
            ORDER BY NgayBatDau DESC");
        cmd.AddParam("@MaSV", maSV);

        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            ds.Add(new PhongCuaToiDto
            {
                MaPhanPhong = r.GetInt32(r.GetOrdinal("MaPhanPhong")),
                MaPhong = r.GetInt32(r.GetOrdinal("MaPhong")),
                SoPhong = r.GetString(r.GetOrdinal("SoPhong")),
                TenKhu = r.GetString(r.GetOrdinal("TenKhu")),
                NgayBatDau = r.GetDateOnly("NgayBatDau"),
                NgayKetThuc = r.GetDateOnlyOrNull("NgayKetThuc")
            });
        }
        return ds;
    }

    // sp_Phong_XemSinhVien: những người đang ở một phòng (chỉ lấy mã và họ tên)
    public List<(string MaSV, string HoTen)> NguoiTrongPhong(int maPhong)
    {
        var ds = new List<(string, string)>();
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_Phong_XemSinhVien");
        cmd.AddParam("@MaPhong", maPhong);

        using var r = cmd.ExecuteReader();
        while (r.Read())
            ds.Add((r.GetString(r.GetOrdinal("MaSV")), r.GetString(r.GetOrdinal("HoTen"))));
        return ds;
    }
}