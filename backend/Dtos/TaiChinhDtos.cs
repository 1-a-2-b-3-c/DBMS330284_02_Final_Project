using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos;

public class LapHoaDonRequest : IValidatableObject
{
    [StringLength(15, ErrorMessage = "Mã sinh viên tối đa 15 ký tự.")]
    public string? MaSV { get; set; }

    [StringLength(10, ErrorMessage = "Tên phòng tối đa 10 ký tự.")]
    public string? TenPhong { get; set; }

    [StringLength(100, ErrorMessage = "Tên khu tối đa 100 ký tự.")]
    public string? TenKhu { get; set; }

    [Required(ErrorMessage = "Loại hóa đơn không được để trống.")]
    [AllowedValues("Tiền phòng", "Điện nước", ErrorMessage = "Loại hóa đơn phải là Tiền phòng hoặc Điện nước.")]
    public string LoaiHoaDon { get; set; } = "";

    public DateOnly HanThanhToan { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Mã khoản thu phải lớn hơn 0.")]
    public int MaKhoanThu { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0.")]
    public int SoLuong { get; set; } = 1;

    public DateOnly? KyThu { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var coMaSV = !string.IsNullOrWhiteSpace(MaSV);
        var coTenPhong = !string.IsNullOrWhiteSpace(TenPhong);
        var coTenKhu = !string.IsNullOrWhiteSpace(TenKhu);

        if (coMaSV == coTenPhong)
            yield return new ValidationResult(
                "Phải cung cấp mã sinh viên hoặc tên phòng, không được cung cấp cả hai.",
                new[] { nameof(MaSV), nameof(TenPhong) });

        if (coTenPhong != coTenKhu)
            yield return new ValidationResult(
                "Khi lập hóa đơn theo phòng, phải cung cấp cả tên phòng và tên khu.",
                new[] { nameof(TenPhong), nameof(TenKhu) });

        if (HanThanhToan == default)
            yield return new ValidationResult("Hạn thanh toán không được để trống.", new[] { nameof(HanThanhToan) });
        else if (HanThanhToan < DateOnly.FromDateTime(DateTime.Today))
            yield return new ValidationResult("Hạn thanh toán không được trước ngày lập hóa đơn.", new[] { nameof(HanThanhToan) });

        if (LoaiHoaDon == "Điện nước" && KyThu is null)
            yield return new ValidationResult("Hóa đơn điện nước phải có kỳ thu.", new[] { nameof(KyThu) });
    }
}

public class ThemChiTietHoaDonRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "Mã khoản thu phải lớn hơn 0.")]
    public int MaKhoanThu { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0.")]
    public int SoLuong { get; set; } = 1;

    [Range(0, 1_000_000_000_000.0, ErrorMessage = "Đơn giá không được âm.")]
    public decimal? DonGia { get; set; }

    [Range(0, 1_000_000_000_000.0, ErrorMessage = "Miễn giảm không được âm.")]
    public decimal? MienGiam { get; set; }
}
