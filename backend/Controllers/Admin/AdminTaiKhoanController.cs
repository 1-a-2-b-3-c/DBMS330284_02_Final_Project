using Backend.Dtos;
using Backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

// Admin-only endpoints for managing user accounts.
[ApiController]
[Route("api/admin/tai-khoan")]
[Authorize(Policy = "Admin")]
public class AdminTaiKhoanController : ControllerBase
{
    private static readonly HashSet<string> VaiTroQuanLy =
        new(StringComparer.Ordinal) { "QLKTX", "QLTC", "ADMIN" };
    private static readonly HashSet<string> VaiTroTaiKhoan =
        new(StringComparer.Ordinal) { "SV", "QLKTX", "QLTC", "ADMIN" };

    private readonly TaiKhoanRepository _repo = new();

    [HttpGet]
    public IActionResult DanhSach([FromQuery] string? tuKhoa,
                                  [FromQuery] string? maVaiTro,
                                  [FromQuery] bool? trangThai)
    {
        if (maVaiTro is not null && !VaiTroTaiKhoan.Contains(maVaiTro))
            return BadRequest(new { message = "Vai trò lọc không hợp lệ." });

        return Ok(_repo.DanhSachQuanLy(tuKhoa, maVaiTro, trangThai));
    }

    [HttpGet("{maTaiKhoan}")]
    public IActionResult LayMot(string maTaiKhoan)
    {
        var taiKhoan = _repo.LayTaiKhoanQuanLy(maTaiKhoan);
        return taiKhoan is null
            ? NotFound(new { message = "Không tìm thấy tài khoản." })
            : Ok(taiKhoan);
    }

    [HttpPost]
    public IActionResult Tao([FromBody] TaoTaiKhoanQuanLyRequest req)
    {
        if (!VaiTroQuanLy.Contains(req.MaVaiTro))
            return BadRequest(new { message = "Chỉ được tạo tài khoản QLKTX, QLTC hoặc ADMIN." });

        _repo.TaoTaiKhoanQuanLy(req, BCrypt.Net.BCrypt.HashPassword(req.MatKhau));
        return CreatedAtAction(nameof(LayMot), new { maTaiKhoan = req.MaTaiKhoan }, new
        {
            message = "Tạo tài khoản thành công.",
            maTaiKhoan = req.MaTaiKhoan,
            tenDangNhap = req.TenDangNhap,
            maVaiTro = req.MaVaiTro
        });
    }

    [HttpPatch("{maTaiKhoan}/trang-thai")]
    public IActionResult DatTrangThai(string maTaiKhoan, [FromBody] TrangThaiTaiKhoanRequest req)
    {
        if (req.TrangThai is not bool trangThai)
            return BadRequest(new { message = "Trạng thái tài khoản không được để trống." });

        var maNguoiThucHien = User.FindFirst("maTaiKhoan")!.Value;
        _repo.DatTrangThai(maTaiKhoan, trangThai, maNguoiThucHien);
        return Ok(new
        {
            message = trangThai ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản.",
            maTaiKhoan,
            trangThai
        });
    }

    [HttpPost("{maTaiKhoan}/dat-lai-mat-khau")]
    public IActionResult DatLaiMatKhau(string maTaiKhoan, [FromBody] DatLaiMatKhauRequest req)
    {
        _repo.DatLaiMatKhauQuanLy(maTaiKhoan, BCrypt.Net.BCrypt.HashPassword(req.MatKhauMoi));
        return Ok(new { message = "Đặt lại mật khẩu thành công." });
    }
}
