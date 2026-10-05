using Backend.Dtos;
using Backend.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/sinhvien")]
public class SinhVienController : ControllerBase
{
    private readonly SinhVienRepository _repo = new();

    // GET /api/sinhvien?maSV=&hoTen=&khoa=&namHoc=
    [HttpGet]
    public IActionResult TraCuu([FromQuery] string? maSV, [FromQuery] string? hoTen,
                                [FromQuery] string? khoa, [FromQuery] int? namHoc)
        => Ok(_repo.TraCuu(maSV, hoTen, khoa, namHoc));

    // GET /api/sinhvien/{maSV}
    [HttpGet("{maSV}")]
    public IActionResult LayMot(string maSV)
    {
        var sv = _repo.TraCuu(maSV, null, null, null).FirstOrDefault();
        return sv is null ? NotFound(new { message = "Không tìm thấy sinh viên." }) : Ok(sv);
    }

    // POST /api/sinhvien
    [HttpPost]
    public IActionResult Them([FromBody] ThemSinhVienRequest req)
    {
        _repo.Them(req);
        return CreatedAtAction(nameof(LayMot), new { maSV = req.MaSV }, new { message = "Thêm sinh viên thành công." });
    }

    // PUT /api/sinhvien/{maSV}
    [HttpPut("{maSV}")]
    public IActionResult CapNhat(string maSV, [FromBody] CapNhatSinhVienRequest req)
    {
        _repo.CapNhat(maSV, req);
        return Ok(new { message = "Cập nhật thành công." });
    }
}