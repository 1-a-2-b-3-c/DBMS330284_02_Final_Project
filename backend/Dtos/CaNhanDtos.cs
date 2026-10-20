using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos;

public class DangKyDto
{
    public int MaDangKy { get; set; }
    public string MaSV { get; set; } = "";
    public string HoTen { get; set; } = "";
    public string? MaLoaiPhong { get; set; }
    public string? TenLoaiPhong { get; set; }
    public DateOnly NgayDangKy { get; set; }
    public string TrangThai { get; set; } = "";
    public string? GhiChu { get; set; }
}

public class PhongCuaToiDto
{
    public int MaPhanPhong { get; set; }
    public int MaPhong { get; set; }
    public string SoPhong { get; set; } = "";
    public string TenKhu { get; set; } = "";
    public DateOnly NgayBatDau { get; set; }
    public DateOnly? NgayKetThuc { get; set; }
}

public class HoaDonDto
{
    public int MaHoaDon { get; set; }
    public string LoaiHoaDon { get; set; } = "";
    public DateOnly NgayLap { get; set; }
    public DateOnly HanThanhToan { get; set; }
    public DateOnly? KyThu { get; set; }
    public string TrangThai { get; set; } = "";
    public decimal TongTien { get; set; }
    public decimal DaThanhToan { get; set; }
    public decimal ConNo { get; set; }
}

public class ChiTietHoaDonDto
{
    public string TenKhoanThu { get; set; } = "";
    public int SoLuong { get; set; }
    public decimal DonGia { get; set; }
    public decimal MienGiam { get; set; }
    public decimal ThanhTien { get; set; }
}

// sp_ViPham_TraCuu
public class ViPhamDto
{
    public int MaViPham { get; set; }
    public string MaSV { get; set; } = "";
    public string HoTen { get; set; } = "";
    public DateOnly NgayViPham { get; set; }
    public DateOnly NgayLapBienBan { get; set; }
    public string NoiDung { get; set; } = "";
    public string? DiaDiem { get; set; }
    public string HinhThucXuLy { get; set; } = "";
    public string TrangThaiXuLy { get; set; } = "";
}

public class CapNhatHoSoRequest
{
    [StringLength(15, ErrorMessage = "Số điện thoại tối đa 15 ký tự.")]
    public string? SDT { get; set; }

    [StringLength(200, ErrorMessage = "Quê quán tối đa 200 ký tự.")]
    public string? QueQuan { get; set; }
}

public class TaoDangKyRequest
{
    [StringLength(10, ErrorMessage = "Mã loại phòng tối đa 10 ký tự.")]
    public string? MaLoaiPhong { get; set; }

    [StringLength(255, ErrorMessage = "Ghi chú tối đa 255 ký tự.")]
    public string? GhiChu { get; set; }
}

public class XetDuyetDangKyRequest
{
    [Required(ErrorMessage = "Cần chọn chấp nhận hoặc từ chối đơn đăng ký.")]
    public bool? ChapNhan { get; set; }

    [StringLength(255, ErrorMessage = "Ghi chú tối đa 255 ký tự.")]
    public string? GhiChu { get; set; }
}

public class XepPhongRequest : IValidatableObject
{
    [Range(1, int.MaxValue, ErrorMessage = "Mã phòng phải lớn hơn 0.")]
    public int MaPhong { get; set; }

    public DateOnly NgayBatDau { get; set; }

    public DateOnly NgayKetThuc { get; set; }

    public string? DieuKhoan { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (NgayBatDau == default)
            yield return new ValidationResult("Ngày bắt đầu không được để trống.", new[] { nameof(NgayBatDau) });

        if (NgayKetThuc == default)
            yield return new ValidationResult("Ngày kết thúc không được để trống.", new[] { nameof(NgayKetThuc) });
        else if (NgayBatDau != default && NgayKetThuc <= NgayBatDau)
            yield return new ValidationResult("Ngày kết thúc phải sau ngày bắt đầu.", new[] { nameof(NgayKetThuc) });
    }
}

public class ThanhToanRequest
{
    [Range(0.01, 1_000_000_000_000.0, ErrorMessage = "Số tiền phải lớn hơn 0.")]
    public decimal SoTien { get; set; }

    [Required(ErrorMessage = "Phương thức thanh toán không được để trống.")]
    [AllowedValues("Tiền mặt", "Chuyển khoản", "Ví điện tử",
        ErrorMessage = "Phương thức phải là Tiền mặt, Chuyển khoản hoặc Ví điện tử.")]
    public string PhuongThuc { get; set; } = "";

    [StringLength(100, ErrorMessage = "Mã giao dịch tối đa 100 ký tự.")]
    public string? MaGiaoDich { get; set; }
}