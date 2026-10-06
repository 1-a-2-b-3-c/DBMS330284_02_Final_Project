using System.ComponentModel.DataAnnotations;

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
// Các quy tắc bên dưới khớp với 02_CreateTables.sql và 03_Constraints.sql:
//   CK_SinhVien_GioiTinh, CK_SinhVien_NamHoc, CK_SinhVien_DienUuTien, độ dài cột
public class ThemSinhVienRequest : IValidatableObject
{
    [Required(ErrorMessage = "Mã sinh viên không được để trống.")]
    [StringLength(15, ErrorMessage = "Mã sinh viên tối đa 15 ký tự.")]
    public string MaSV { get; set; } = "";

    [Required(ErrorMessage = "Họ tên không được để trống.")]
    [StringLength(100, ErrorMessage = "Họ tên tối đa 100 ký tự.")]
    public string HoTen { get; set; } = "";

    public DateOnly NgaySinh { get; set; }

    // Khớp CK_SinhVien_GioiTinh
    [Required(ErrorMessage = "Giới tính không được để trống.")]
    [AllowedValues("Nam", "Nữ", "Khác", ErrorMessage = "Giới tính phải là Nam, Nữ hoặc Khác.")]
    public string GioiTinh { get; set; } = "";

    [Required(ErrorMessage = "Số điện thoại không được để trống.")]
    [StringLength(15, ErrorMessage = "Số điện thoại tối đa 15 ký tự.")]
    public string SDT { get; set; } = "";

    // Khớp CK_SinhVien_NamHoc (NamHoc >= 1)
    [Range(1, int.MaxValue, ErrorMessage = "Năm học phải từ 1 trở lên.")]
    public int NamHoc { get; set; }

    [StringLength(200, ErrorMessage = "Quê quán tối đa 200 ký tự.")]
    public string? QueQuan { get; set; }

    // Cột là VARCHAR(12) và UNIQUE. Quy tắc 12 chữ số là bổ sung của backend, không có trong DB.
    [RegularExpression(@"^\d{12}$", ErrorMessage = "CCCD phải gồm đúng 12 chữ số.")]
    public string? CCCD { get; set; }

    [StringLength(100, ErrorMessage = "Khoa tối đa 100 ký tự.")]
    public string? Khoa { get; set; }

    // Khớp CK_SinhVien_DienUuTien. AllowedValues không bỏ qua null nên phải ghi null vào danh sách.
    [AllowedValues("Con thương binh/liệt sĩ", "Hộ nghèo", "Hộ cận nghèo", "Vùng sâu vùng xa", null,
        ErrorMessage = "Diện ưu tiên không hợp lệ.")]
    public string? DienUuTien { get; set; }

    // Quy tắc bổ sung của backend: ngày sinh phải có và không ở tương lai
    public IEnumerable<ValidationResult> Validate(ValidationContext context)
    {
        if (NgaySinh == default)
            yield return new ValidationResult("Ngày sinh không được để trống.", new[] { nameof(NgaySinh) });
        else if (NgaySinh > DateOnly.FromDateTime(DateTime.Today))
            yield return new ValidationResult("Ngày sinh không được ở tương lai.", new[] { nameof(NgaySinh) });
    }
}

// Dữ liệu frontend gửi lên khi cập nhật (sp_SinhVien_CapNhat)
// Trường nào null thì procedure giữ nguyên giá trị cũ (COALESCE),
// nên hiện chưa có cách xóa trắng một giá trị về NULL.
public class CapNhatSinhVienRequest
{
    [StringLength(15, ErrorMessage = "Số điện thoại tối đa 15 ký tự.")]
    public string? SDT { get; set; }

    [StringLength(200, ErrorMessage = "Quê quán tối đa 200 ký tự.")]
    public string? QueQuan { get; set; }

    [StringLength(100, ErrorMessage = "Khoa tối đa 100 ký tự.")]
    public string? Khoa { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Năm học phải từ 1 trở lên.")]
    public int? NamHoc { get; set; }

    [AllowedValues("Con thương binh/liệt sĩ", "Hộ nghèo", "Hộ cận nghèo", "Vùng sâu vùng xa", null,
        ErrorMessage = "Diện ưu tiên không hợp lệ.")]
    public string? DienUuTien { get; set; }
}