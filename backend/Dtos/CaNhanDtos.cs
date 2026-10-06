using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos;

// ===== Dữ liệu trả về =====

// sp_DangKyKTX_TraCuu
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

// vw_SinhVienDangO: phòng sinh viên đang ở
public class PhongCuaToiDto
{
    public int MaPhanPhong { get; set; }
    public int MaPhong { get; set; }
    public string SoPhong { get; set; } = "";
    public string TenKhu { get; set; } = "";
    public DateOnly NgayBatDau { get; set; }
    public DateOnly? NgayKetThuc { get; set; }
}

// Hóa đơn kèm tổng tiền, đã trả, còn nợ (tính bằng fn_TongTienHoaDon, fn_DaThanhToan, fn_ConNo)
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

// ===== Dữ liệu sinh viên gửi lên =====

// Sinh viên chỉ được sửa số điện thoại và quê quán.
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

// Khớp CK_ThanhToan_PhuongThuc và CK_ThanhToan_SoTien
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