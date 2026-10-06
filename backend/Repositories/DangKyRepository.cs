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

    // sp_DangKyKTX_Duyet: chỉ cập nhật đơn đang ở trạng thái Chờ duyệt
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

    // sp_PhanPhong_Them: tạo phân phòng, hợp đồng và cập nhật đơn trong cùng transaction
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