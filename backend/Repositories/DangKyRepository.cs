using Backend.Data;
using Backend.Dtos;

namespace Backend.Repositories;

public class DangKyRepository
{
    public List<DangKyDto> TraCuu(string? maSV, string? trangThai)
    {
        var ds = new List<DangKyDto>();
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Query(@"
            SELECT dk.MaDangKy, dk.MaSV, sv.HoTen,
                   dk.MaLoaiPhong, lp.TenLoaiPhong,
                   dk.NgayDangKy, dk.TrangThai, dk.GhiChu
            FROM dbo.DangKyKTX AS dk
            INNER JOIN dbo.SinhVien AS sv ON sv.MaSV = dk.MaSV
            LEFT JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = dk.MaLoaiPhong
            WHERE (@MaSV IS NULL OR dk.MaSV = @MaSV)
              AND (@TrangThai IS NULL OR dk.TrangThai = @TrangThai)
            ORDER BY dk.NgayDangKy DESC, dk.MaDangKy DESC;");
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

    public void Duyet(int maDangKy, bool chapNhan, string? ghiChu)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_DangKyKTX_Duyet");
        cmd.AddParam("@MaDangKy", maDangKy);
        cmd.AddParam("@ChapNhan", chapNhan);
        cmd.AddParam("@GhiChu", ghiChu);
        cmd.ExecuteNonQuery();
    }

    public (int MaPhanPhong, int MaHopDong) XepPhong(
        int maDangKy, XepPhongRequest req)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_PhanPhong_Them");
        cmd.AddParam("@MaDangKy", maDangKy);
        cmd.AddParam("@MaPhong", req.MaPhong);
        cmd.AddParam("@NgayBatDau", req.NgayBatDau);
        cmd.AddParam("@NgayKetThuc", req.NgayKetThuc);
        cmd.AddParam("@DieuKhoan", req.DieuKhoan);
        var maPhanPhong = cmd.AddOutInt("@MaPhanPhong");
        var maHopDong = cmd.AddOutInt("@MaHopDong");
        cmd.ExecuteNonQuery();
        return ((int)maPhanPhong.Value, (int)maHopDong.Value);
    }
}