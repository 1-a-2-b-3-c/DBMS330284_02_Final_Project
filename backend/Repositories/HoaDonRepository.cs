using Backend.Data;
using Backend.Dtos;

namespace Backend.Repositories;

public class HoaDonRepository
{
    public List<HoaDonDto> DanhSachCuaSV(string maSV)
    {
        var ds = new List<HoaDonDto>();
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Query(@"
            SELECT h.MaHoaDon, h.LoaiHoaDon, h.NgayLap, h.HanThanhToan, h.KyThu, h.TrangThai,
                   dbo.fn_TongTienHoaDon(h.MaHoaDon) AS TongTien,
                   dbo.fn_DaThanhToan(h.MaHoaDon)    AS DaThanhToan,
                   dbo.fn_ConNo(h.MaHoaDon)          AS ConNo
            FROM dbo.HoaDon h
            JOIN dbo.PhanPhong pp ON pp.MaPhanPhong = h.MaPhanPhong
            WHERE pp.MaSV = @MaSV
            ORDER BY h.NgayLap DESC, h.MaHoaDon DESC");
        cmd.AddParam("@MaSV", maSV);

        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            ds.Add(new HoaDonDto
            {
                MaHoaDon = r.GetInt32(r.GetOrdinal("MaHoaDon")),
                LoaiHoaDon = r.GetString(r.GetOrdinal("LoaiHoaDon")),
                NgayLap = r.GetDateOnly("NgayLap"),
                HanThanhToan = r.GetDateOnly("HanThanhToan"),
                KyThu = r.GetDateOnlyOrNull("KyThu"),
                TrangThai = r.GetString(r.GetOrdinal("TrangThai")),
                TongTien = r.GetDecimal(r.GetOrdinal("TongTien")),
                DaThanhToan = r.GetDecimal(r.GetOrdinal("DaThanhToan")),
                ConNo = r.GetDecimal(r.GetOrdinal("ConNo"))
            });
        }
        return ds;
    }

    public List<ChiTietHoaDonDto> ChiTiet(int maHoaDon)
    {
        var ds = new List<ChiTietHoaDonDto>();
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

        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            ds.Add(new ChiTietHoaDonDto
            {
                TenKhoanThu = r.GetString(r.GetOrdinal("TenKhoanThu")),
                SoLuong = r.GetInt32(r.GetOrdinal("SoLuong")),
                DonGia = r.GetDecimal(r.GetOrdinal("DonGia")),
                MienGiam = r.GetDecimal(r.GetOrdinal("MienGiam")),
                ThanhTien = r.GetDecimal(r.GetOrdinal("ThanhTien"))
            });
        }
        return ds;
    }

    public int ThanhToan(int maHoaDon, decimal soTien, string phuongThuc, string? maGiaoDich)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_ThanhToanHoaDon");
        cmd.AddParam("@MaHoaDon", maHoaDon);
        cmd.AddParam("@SoTien", soTien);
        cmd.AddParam("@PhuongThuc", phuongThuc);
        cmd.AddParam("@MaGiaoDich", maGiaoDich);
        var ma = cmd.AddOutInt("@MaThanhToan");
        cmd.ExecuteNonQuery();
        return (int)ma.Value;
    }
}