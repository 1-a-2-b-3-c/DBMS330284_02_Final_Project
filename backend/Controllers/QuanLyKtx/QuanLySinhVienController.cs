using Backend.Dtos;
using Backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

// Việc của quản lý KTX (QLKTX) và quản trị viên (ADMIN): kiểm tra bằng policy "QuanLyKtx".
[ApiController]
[Route("api/ktx/sinhvien")]
[Authorize(Policy = "QuanLyKtx")]
public class SinhVienController : ControllerBase
{
    private readonly SinhVienRepository _repo = new();
    private readonly IConfiguration _cfg;

    public SinhVienController(IConfiguration cfg) => _cfg = cfg;

    // GET /api/ktx/sinhvien?maSV=&hoTen=&khoa=&namHoc=
    [HttpGet]
    public IActionResult TraCuu([FromQuery] string? maSV, [FromQuery] string? hoTen,
                                [FromQuery] string? khoa, [FromQuery] int? namHoc)
        => Ok(_repo.TraCuu(maSV, hoTen, khoa, namHoc));

    // GET /api/ktx/sinhvien/danh-muc
    // Giá trị hợp lệ cho ô chọn (dropdown) ở frontend.
    // Giữ khớp với CK_SinhVien_GioiTinh, CK_SinhVien_DienUuTien và fn_TyLeGiam.
    [HttpGet("danh-muc")]
    public IActionResult DanhMuc() => Ok(new
    {
        gioiTinh = new[] { "Nam", "Nữ", "Khác" },
        dienUuTien = new[] { "Con thương binh/liệt sĩ", "Hộ nghèo", "Hộ cận nghèo", "Vùng sâu vùng xa" }
    });

    // GET /api/ktx/sinhvien/{maSV}
    [HttpGet("{maSV}")]
    public IActionResult LayMot(string maSV)
    {
        var sv = _repo.TraCuu(maSV, null, null, null).FirstOrDefault();
        return sv is null ? NotFound(new { message = "Không tìm thấy sinh viên." }) : Ok(sv);
    }

    // POST /api/ktx/sinhvien : thêm sinh viên và tự tạo tài khoản đăng nhập
    // Tên đăng nhập = mã sinh viên, mật khẩu ban đầu = mã sinh viên (sinh viên nên đổi sau khi đăng nhập)
    [HttpPost]
    public IActionResult Them([FromBody] ThemSinhVienRequest req)
    {
        var maVaiTro = _cfg["Auth:MaVaiTroSinhVien"];
        if (string.IsNullOrWhiteSpace(maVaiTro))
            return Problem("Chưa cấu hình Auth:MaVaiTroSinhVien trong appsettings.json.");

        _repo.ThemKemTaiKhoan(req, BCrypt.Net.BCrypt.HashPassword(req.MaSV), maVaiTro);

        return CreatedAtAction(nameof(LayMot), new { maSV = req.MaSV }, new
        {
            message = "Thêm sinh viên thành công.",
            tenDangNhap = req.MaSV,
            matKhauBanDau = req.MaSV
        });
    }

    // PUT /api/ktx/sinhvien/{maSV}
    [HttpPut("{maSV}")]
    public IActionResult CapNhat(string maSV, [FromBody] CapNhatSinhVienRequest req)
    {
        _repo.CapNhat(maSV, req);
        return Ok(new { message = "Cập nhật thành công." });
    }
}