namespace Backend.Dtos;

// Dữ liệu trả về từ sp_SinhVien_TraCuu
public class SinhVienDto
{
    public string MaSV { get; set; } = "";
    public string HoTen { get; set; } = "";
    public DateOnly NgaySinh { get; set; }
    public string GioiTinh { get; set; } = "";
    public string? QueQuan { get; set; }
    public string? CCCD { get; set; }
    public string SDT { get; set; } = "";
    public string? Khoa { get; set; }
    public int NamHoc { get; set; }
    public string? DienUuTien { get; set; }
}

// Dữ liệu frontend gửi lên khi thêm sinh viên (sp_SinhVien_Them)
public class ThemSinhVienRequest
{
    public string MaSV { get; set; } = "";
    public string HoTen { get; set; } = "";
    public DateOnly NgaySinh { get; set; }
    public string GioiTinh { get; set; } = "";
    public string SDT { get; set; } = "";
    public int NamHoc { get; set; }
    public string? QueQuan { get; set; }
    public string? CCCD { get; set; }
    public string? Khoa { get; set; }
    public string? DienUuTien { get; set; }
}

// Dữ liệu frontend gửi lên khi cập nhật (sp_SinhVien_CapNhat)
// Trường nào null thì procedure giữ nguyên giá trị cũ
public class CapNhatSinhVienRequest
{
    public string? SDT { get; set; }
    public string? QueQuan { get; set; }
    public string? Khoa { get; set; }
    public int? NamHoc { get; set; }
    public string? DienUuTien { get; set; }
}