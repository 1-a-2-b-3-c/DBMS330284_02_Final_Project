using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos;

public class ThemViPhamRequest : IValidatableObject
{
    [Required(ErrorMessage = "Mã sinh viên không được để trống.")]
    [StringLength(15, ErrorMessage = "Mã sinh viên tối đa 15 ký tự.")]
    public string MaSV { get; set; } = "";

    public DateOnly NgayViPham { get; set; }

    [Required(ErrorMessage = "Nội dung vi phạm không được để trống.")]
    [StringLength(500, ErrorMessage = "Nội dung vi phạm tối đa 500 ký tự.")]
    public string NoiDung { get; set; } = "";

    [Required(ErrorMessage = "Hình thức xử lý không được để trống.")]
    [AllowedValues("Nhắc nhở", "Cảnh cáo", "Buộc rời KTX",
        ErrorMessage = "Hình thức xử lý không hợp lệ.")]
    public string HinhThucXuLy { get; set; } = "";

    [StringLength(200, ErrorMessage = "Địa điểm tối đa 200 ký tự.")]
    public string? DiaDiem { get; set; }

    public DateOnly? NgayLapBienBan { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        if (NgayViPham == default)
            yield return new ValidationResult("Ngày vi phạm không được để trống.", new[] { nameof(NgayViPham) });
        else if (NgayViPham > today)
            yield return new ValidationResult("Ngày vi phạm không được vượt quá ngày hiện tại.", new[] { nameof(NgayViPham) });

        if (NgayLapBienBan is { } ngayLap && ngayLap < NgayViPham)
            yield return new ValidationResult("Ngày lập biên bản không được trước ngày vi phạm.", new[] { nameof(NgayLapBienBan) });
    }
}

public class CapNhatViPhamRequest : IValidatableObject
{
    public DateOnly? NgayViPham { get; set; }

    [StringLength(500, ErrorMessage = "Nội dung vi phạm tối đa 500 ký tự.")]
    public string? NoiDung { get; set; }

    [StringLength(200, ErrorMessage = "Địa điểm tối đa 200 ký tự.")]
    public string? DiaDiem { get; set; }

    [AllowedValues("Nhắc nhở", "Cảnh cáo", "Buộc rời KTX", null,
        ErrorMessage = "Hình thức xử lý không hợp lệ.")]
    public string? HinhThucXuLy { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (NgayViPham is { } ngayViPham)
        {
            if (ngayViPham == default)
                yield return new ValidationResult("Ngày vi phạm không hợp lệ.", new[] { nameof(NgayViPham) });
            else if (ngayViPham > DateOnly.FromDateTime(DateTime.Today))
                yield return new ValidationResult("Ngày vi phạm không được vượt quá ngày hiện tại.", new[] { nameof(NgayViPham) });
        }

        if (NoiDung is null && DiaDiem is null && HinhThucXuLy is null && NgayViPham is null)
            yield return new ValidationResult("Cần cung cấp ít nhất một thông tin để cập nhật.");
        else if (NoiDung is not null && string.IsNullOrWhiteSpace(NoiDung))
            yield return new ValidationResult("Nội dung vi phạm không được để trống.", new[] { nameof(NoiDung) });
    }
}
