using System.ComponentModel.DataAnnotations;

namespace Backend.Dtos;

// Dòng trả về từ sp_TaiKhoan_DangNhap (chỉ dùng trong backend, KHÔNG trả ra frontend vì có hash)
public class TaiKhoanDto
{
    public string MaTaiKhoan { get; set; } = "";
    public string TenDangNhap { get; set; } = "";
    public string MatKhauHash { get; set; } = "";
    public string? MaSV { get; set; }
    public string MaVaiTro { get; set; } = "";
    public string TenVaiTro { get; set; } = "";
}

public class DangNhapRequest
{
    [Required(ErrorMessage = "Tên đăng nhập không được để trống.")]
    public string TenDangNhap { get; set; } = "";

    [Required(ErrorMessage = "Mật khẩu không được để trống.")]
    public string MatKhau { get; set; } = "";
}

public class DoiMatKhauRequest
{
    [Required(ErrorMessage = "Mật khẩu cũ không được để trống.")]
    public string MatKhauCu { get; set; } = "";

    [Required(ErrorMessage = "Mật khẩu mới không được để trống.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu mới phải từ 6 đến 100 ký tự.")]
    public string MatKhauMoi { get; set; } = "";
}