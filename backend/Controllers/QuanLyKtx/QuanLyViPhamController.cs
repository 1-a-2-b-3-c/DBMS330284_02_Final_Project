using Backend.Dtos;
using Backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

// Quản lý KTX và quản trị viên dùng chung policy "QuanLyKtx".
[ApiController]
[Route("api/ktx/vipham")]
[Authorize(Policy = "QuanLyKtx")]
public class QuanLyViPhamController : ControllerBase
{
    private readonly ViPhamRepository _repo = new();

    // GET /api/ktx/vipham?maSV=&trangThaiXuLy=&hinhThucXuLy=
    [HttpGet]
    public IActionResult TraCuu([FromQuery] string? maSV,
                                [FromQuery] string? trangThaiXuLy,
                                [FromQuery] string? hinhThucXuLy)
        => Ok(_repo.TraCuu(maSV, trangThaiXuLy, hinhThucXuLy));

    // GET /api/ktx/vipham/danh-muc
    [HttpGet("danh-muc")]
    public IActionResult DanhMuc() => Ok(new
    {
        hinhThucXuLy = new[] { "Nhắc nhở", "Cảnh cáo", "Buộc rời KTX" },
        trangThaiXuLy = new[] { "Chưa xử lý", "Đã xử lý" }
    });

    // GET /api/ktx/vipham/{maViPham}
    [HttpGet("{maViPham:int}")]
    public IActionResult LayMot(int maViPham)
    {
        var viPham = _repo.TraCuu(null, null, null, maViPham).FirstOrDefault();
        return viPham is null
            ? NotFound(new { message = "Không tìm thấy biên bản vi phạm." })
            : Ok(viPham);
    }

    // POST /api/ktx/vipham
    [HttpPost]
    public IActionResult Them([FromBody] ThemViPhamRequest req)
    {
        var maViPham = _repo.Them(req);
        return CreatedAtAction(nameof(LayMot), new { maViPham }, new
        {
            message = "Lập biên bản vi phạm thành công.",
            maViPham
        });
    }

    // PUT /api/ktx/vipham/{maViPham}
    [HttpPut("{maViPham:int}")]
    public IActionResult CapNhat(int maViPham, [FromBody] CapNhatViPhamRequest req)
    {
        _repo.CapNhat(maViPham, req);
        return Ok(new { message = "Cập nhật biên bản vi phạm thành công." });
    }

    // PATCH /api/ktx/vipham/{maViPham}/xu-ly
    [HttpPatch("{maViPham:int}/xu-ly")]
    public IActionResult XuLy(int maViPham)
    {
        var viPham = _repo.TraCuu(null, null, null, maViPham).FirstOrDefault();
        if (viPham is null)
            return NotFound(new { message = "Không tìm thấy biên bản vi phạm." });
        if (viPham.TrangThaiXuLy == "Đã xử lý")
            return Conflict(new { message = "Biên bản vi phạm đã được xử lý." });
        if (viPham.HinhThucXuLy == "Buộc rời KTX")
            return BadRequest(new { message = "Hãy dùng thao tác buộc rời KTX để kết thúc phân phòng và thanh lý hợp đồng." });

        _repo.XuLy(maViPham);
        return Ok(new { message = "Đã xử lý biên bản vi phạm." });
    }

    // PATCH /api/ktx/vipham/{maViPham}/buoc-roi-ktx
    [HttpPatch("{maViPham:int}/buoc-roi-ktx")]
    public IActionResult XuLyBuocRoiKtx(int maViPham)
    {
        var viPham = _repo.TraCuu(null, null, null, maViPham).FirstOrDefault();
        if (viPham is null)
            return NotFound(new { message = "Không tìm thấy biên bản vi phạm." });
        if (viPham.HinhThucXuLy != "Buộc rời KTX")
            return BadRequest(new { message = "Biên bản này không thuộc hình thức Buộc rời KTX." });
        if (viPham.TrangThaiXuLy == "Đã xử lý")
            return Conflict(new { message = "Biên bản vi phạm đã được xử lý." });

        _repo.XuLyBuocRoiKtx(maViPham);
        return Ok(new { message = "Đã xử lý vi phạm và kết thúc lưu trú tại KTX nếu sinh viên đang ở." });
    }
}
