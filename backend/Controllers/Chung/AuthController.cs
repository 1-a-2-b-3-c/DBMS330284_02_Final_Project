using Backend.Dtos;
using Backend.Repositories;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly TaiKhoanRepository _repo = new();
    private readonly TokenService _token;

    public AuthController(TokenService token) => _token = token;

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

    private static bool KhopMatKhau(string matKhau, string hash)
    {
        try { return BCrypt.Net.BCrypt.Verify(matKhau, hash); }
        catch { return false; }
    }
}