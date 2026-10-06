using Backend.Data;
using Backend.Dtos;

namespace Backend.Repositories;

public class SinhVienRepository
{
    // sp_SinhVien_TraCuu: mọi tham số đều tùy chọn
    public List<SinhVienDto> TraCuu(string? maSV, string? hoTen, string? khoa, int? namHoc)
    {
        var ds = new List<SinhVienDto>();
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_SinhVien_TraCuu");
        cmd.AddParam("@MaSV", maSV);
        cmd.AddParam("@HoTen", hoTen);
        cmd.AddParam("@Khoa", khoa);
        cmd.AddParam("@NamHoc", namHoc);

        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            ds.Add(new SinhVienDto
            {
                MaSV = r.GetString(r.GetOrdinal("MaSV")),
                HoTen = r.GetString(r.GetOrdinal("HoTen")),
                NgaySinh = r.GetDateOnly("NgaySinh"),
                GioiTinh = r.GetString(r.GetOrdinal("GioiTinh")),
                QueQuan = r.GetStringOrNull("QueQuan"),
                CCCD = r.GetStringOrNull("CCCD"),
                SDT = r.GetString(r.GetOrdinal("SDT")),
                Khoa = r.GetStringOrNull("Khoa"),
                NamHoc = r.GetInt32(r.GetOrdinal("NamHoc")),
                DienUuTien = r.GetStringOrNull("DienUuTien")
            });
        }
        return ds;
    }

    // sp_SinhVien_ThemKemTaiKhoan: thêm sinh viên và tài khoản trong cùng một transaction
    // (procedure này gọi sp_SinhVien_Them và sp_TaiKhoan_Them bên trong)
    public void ThemKemTaiKhoan(ThemSinhVienRequest req, string matKhauHash, string maVaiTro)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_SinhVien_ThemKemTaiKhoan");
        cmd.AddParam("@MaSV", req.MaSV);
        cmd.AddParam("@HoTen", req.HoTen);
        cmd.AddParam("@NgaySinh", req.NgaySinh);
        cmd.AddParam("@GioiTinh", req.GioiTinh);
        cmd.AddParam("@SDT", req.SDT);
        cmd.AddParam("@NamHoc", req.NamHoc);
        cmd.AddParam("@MatKhauHash", matKhauHash);
        cmd.AddParam("@MaVaiTro", maVaiTro);
        cmd.AddParam("@QueQuan", req.QueQuan);
        cmd.AddParam("@CCCD", req.CCCD);
        cmd.AddParam("@Khoa", req.Khoa);
        cmd.AddParam("@DienUuTien", req.DienUuTien);
        cmd.ExecuteNonQuery();
    }

    // sp_SinhVien_CapNhat: procedure tự ném lỗi 50101 nếu không tìm thấy
    public void CapNhat(string maSV, CapNhatSinhVienRequest req)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_SinhVien_CapNhat");
        cmd.AddParam("@MaSV", maSV);
        cmd.AddParam("@SDT", req.SDT);
        cmd.AddParam("@QueQuan", req.QueQuan);
        cmd.AddParam("@Khoa", req.Khoa);
        cmd.AddParam("@NamHoc", req.NamHoc);
        cmd.AddParam("@DienUuTien", req.DienUuTien);
        cmd.ExecuteNonQuery();
    }
}