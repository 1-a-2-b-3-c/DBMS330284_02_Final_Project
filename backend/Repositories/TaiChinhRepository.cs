using Backend.Data;
using Backend.Dtos;

namespace Backend.Repositories;

public class TaiChinhRepository
{
    public List<Dictionary<string, object?>> CongNo(string? maSV, string? trangThai, string? loaiHoaDon)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Query(@"
            SELECT *
            FROM dbo.vw_CongNoHoaDon
            WHERE (@MaSV IS NULL OR MaSV = @MaSV)
              AND (@TrangThai IS NULL OR TrangThai = @TrangThai)
              AND (@LoaiHoaDon IS NULL OR LoaiHoaDon = @LoaiHoaDon)
            ORDER BY NgayLap DESC, MaHoaDon DESC");
        cmd.AddParam("@MaSV", maSV);
        cmd.AddParam("@TrangThai", trangThai);
        cmd.AddParam("@LoaiHoaDon", loaiHoaDon);
        using var reader = cmd.ExecuteReader();
        return reader.ReadRows();
    }

    public List<Dictionary<string, object?>> HoaDonQuaHan(string? maSV)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Query(@"
            SELECT *
            FROM dbo.vw_HoaDonQuaHan
            WHERE (@MaSV IS NULL OR MaSV = @MaSV)
            ORDER BY HanThanhToan, MaHoaDon");
        cmd.AddParam("@MaSV", maSV);
        using var reader = cmd.ExecuteReader();
        return reader.ReadRows();
    }

    public List<Dictionary<string, object?>> DoanhThu(int? nam, string? loaiHoaDon)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Query(@"
            SELECT *
            FROM dbo.vw_DoanhThuThang
            WHERE (@Nam IS NULL OR Nam = @Nam)
              AND (@LoaiHoaDon IS NULL OR LoaiHoaDon = @LoaiHoaDon)
            ORDER BY Nam DESC, Thang DESC, LoaiHoaDon");
        cmd.AddParam("@Nam", nam);
        cmd.AddParam("@LoaiHoaDon", loaiHoaDon);
        using var reader = cmd.ExecuteReader();
        return reader.ReadRows();
    }

    public Dictionary<string, object?>? LayHoaDon(int maHoaDon)
        => CongNoTheoMa(maHoaDon).FirstOrDefault();

    public List<Dictionary<string, object?>> ChiTietHoaDon(int maHoaDon)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Query(@"
            SELECT kt.TenKhoanThu, ct.SoLuong, ct.DonGia, ct.MienGiam,
                   ct.SoLuong * ct.DonGia - ct.MienGiam AS ThanhTien
            FROM dbo.ChiTietHoaDon ct
            JOIN dbo.KhoanThu kt ON kt.MaKhoanThu = ct.MaKhoanThu
            WHERE ct.MaHoaDon = @MaHoaDon
            ORDER BY kt.TenKhoanThu");
        cmd.AddParam("@MaHoaDon", maHoaDon);
        using var reader = cmd.ExecuteReader();
        return reader.ReadRows();
    }

    public int LapHoaDon(LapHoaDonRequest req)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_LapHoaDon");
        cmd.AddParam("@MaPhanPhong", req.MaPhanPhong);
        cmd.AddParam("@LoaiHoaDon", req.LoaiHoaDon);
        cmd.AddParam("@HanThanhToan", req.HanThanhToan);
        cmd.AddParam("@MaKhoanThu", req.MaKhoanThu);
        cmd.AddParam("@SoLuong", req.SoLuong);
        cmd.AddParam("@KyThu", req.KyThu);
        var maHoaDon = cmd.AddOutInt("@MaHoaDon");
        cmd.ExecuteNonQuery();
        return (int)maHoaDon.Value;
    }

    public void ThemChiTietHoaDon(int maHoaDon, ThemChiTietHoaDonRequest req)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_ThemChiTietHoaDon");
        cmd.AddParam("@MaHoaDon", maHoaDon);
        cmd.AddParam("@MaKhoanThu", req.MaKhoanThu);
        cmd.AddParam("@SoLuong", req.SoLuong);
        cmd.AddParam("@DonGia", req.DonGia);
        cmd.AddParam("@MienGiam", req.MienGiam);
        cmd.ExecuteNonQuery();
    }

    public void HuyHoaDon(int maHoaDon)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_HoaDon_Huy");
        cmd.AddParam("@MaHoaDon", maHoaDon);
        cmd.ExecuteNonQuery();
    }

    private List<Dictionary<string, object?>> CongNoTheoMa(int maHoaDon)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Query(@"
            SELECT *
            FROM dbo.vw_CongNoHoaDon
            WHERE MaHoaDon = @MaHoaDon");
        cmd.AddParam("@MaHoaDon", maHoaDon);
        using var reader = cmd.ExecuteReader();
        return reader.ReadRows();
    }
}
