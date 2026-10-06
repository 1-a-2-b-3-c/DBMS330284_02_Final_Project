using Backend.Data;
using Backend.Dtos;

namespace Backend.Repositories;

public class DangKyRepository
{
    // sp_DangKyKTX_TraCuu: mọi tham số đều tùy chọn
    public List<DangKyDto> TraCuu(string? maSV, string? trangThai)
    {
        var ds = new List<DangKyDto>();
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_DangKyKTX_TraCuu");
        cmd.AddParam("@MaSV", maSV);
        cmd.AddParam("@TrangThai", trangThai);

        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            ds.Add(new DangKyDto
            {
                MaDangKy = r.GetInt32(r.GetOrdinal("MaDangKy")),
                MaSV = r.GetString(r.GetOrdinal("MaSV")),
                HoTen = r.GetString(r.GetOrdinal("HoTen")),
                MaLoaiPhong = r.GetStringOrNull("MaLoaiPhong"),
                TenLoaiPhong = r.GetStringOrNull("TenLoaiPhong"),
                NgayDangKy = r.GetDateOnly("NgayDangKy"),
                TrangThai = r.GetString(r.GetOrdinal("TrangThai")),
                GhiChu = r.GetStringOrNull("GhiChu")
            });
        }
        return ds;
    }

    // sp_DangKyKTX_Them: trả về mã đăng ký vừa tạo (tham số OUTPUT @MaDangKy)
    public int Them(string maSV, string? maLoaiPhong, string? ghiChu)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_DangKyKTX_Them");
        cmd.AddParam("@MaSV", maSV);
        cmd.AddParam("@MaLoaiPhong", maLoaiPhong);
        cmd.AddParam("@GhiChu", ghiChu);
        var maDangKy = cmd.AddOutInt("@MaDangKy");
        cmd.ExecuteNonQuery();
        return (int)maDangKy.Value;
    }
}