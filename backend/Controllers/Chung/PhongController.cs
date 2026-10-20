using Backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/phong")]
[Authorize] 
public class PhongController : ControllerBase
{
    private readonly PhongRepository _repo = new();

    [HttpGet]
    public IActionResult TraCuu([FromQuery] string? maKhu, [FromQuery] string? trangThai,
                                [FromQuery] bool chiConCho = false)
        => Ok(_repo.TraCuu(maKhu, trangThai, chiConCho));

    [Authorize(Policy = "QuanLyKtx")]
    [HttpGet("{maPhong:int}/sinhvien")]
    public IActionResult SinhVienTrongPhong(int maPhong)
    {
        if (maPhong <= 0)
            return BadRequest(new { message = "Mã phòng phải lớn hơn 0." });

        var sinhVien = _repo.NguoiTrongPhong(maPhong)
            .Select(sv => new { maSV = sv.MaSV, hoTen = sv.HoTen });
        return Ok(sinhVien);
    }
}