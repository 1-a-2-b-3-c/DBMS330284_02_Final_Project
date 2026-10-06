using Backend.Dtos;
using Backend.Repositories;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

// Tài khoản sinh viên do hệ thống tự tạo khi quản lý thêm sinh viên (POST /api/sinhvien),
// nên ở đây không có chức năng tự đăng ký.
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly TaiKhoanRepository _repo = new();
    private readonly TokenService _token;

    public AuthController(TokenService token) => _token = token;

    // POST /api/auth/dang-nhap
    [HttpPost("dang-nhap")]
    public IActionResult DangNhap([FromBody] DangNhapRequest req)
    {
        var tk = _repo.DangNhap(req.TenDangNhap);
        // Sai tên hay sai mật khẩu đều trả cùng một câu để không lộ tài khoản nào tồn tại
        if (tk is null || !KhopMatKhau(req.MatKhau, tk.MatKhauHash))
            return Unauthorized(new { message = "Sai tên đăng nhập hoặc mật khẩu." });

        return Ok(new
        {
            token = _token.TaoToken(tk),
            maTaiKhoan = tk.MaTaiKhoan,
            tenDangNhap = tk.TenDangNhap,
            maSV = tk.MaSV,
            maVaiTro = tk.MaVaiTro,
            tenVaiTro = tk.TenVaiTro
        });
    }

    // POST /api/auth/doi-mat-khau (cần đăng nhập)
    [Authorize]
    [HttpPost("doi-mat-khau")]
    public IActionResult DoiMatKhau([FromBody] DoiMatKhauRequest req)
    {
        var tenDangNhap = User.FindFirst("tenDangNhap")!.Value;
        var maTaiKhoan = User.FindFirst("maTaiKhoan")!.Value;

        var tk = _repo.DangNhap(tenDangNhap);
        if (tk is null || !KhopMatKhau(req.MatKhauCu, tk.MatKhauHash))
            return BadRequest(new { message = "Mật khẩu cũ không đúng." });

        _repo.DoiMatKhau(maTaiKhoan, BCrypt.Net.BCrypt.HashPassword(req.MatKhauMoi));
        return Ok(new { message = "Đổi mật khẩu thành công." });
    }

    // Hash không đúng định dạng BCrypt (ví dụ mật khẩu thô nhập tay vào DB) sẽ ném lỗi, coi như không khớp
    private static bool KhopMatKhau(string matKhau, string hash)
    {
        try { return BCrypt.Net.BCrypt.Verify(matKhau, hash); }
        catch { return false; }
    }
}