using Backend.Dtos;
using Backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/ktx/dangky")]
[Authorize(Policy = "QuanLyKtx")]
public class QuanLyDangKyController : ControllerBase
{
    private readonly DangKyRepository _repo = new();

    // GET /api/ktx/dangky?maSV=&trangThai=
    [HttpGet]
    public IActionResult TraCuu([FromQuery] string? maSV, [FromQuery] string? trangThai)
        => Ok(_repo.TraCuu(maSV, trangThai));

    // PATCH /api/ktx/dangky/{maDangKy}/duyet
    [HttpPatch("{maDangKy:int}/duyet")]
    public IActionResult XetDuyet(int maDangKy, [FromBody] XetDuyetDangKyRequest req)
    {
        if (maDangKy <= 0)
            return BadRequest(new { message = "Mã đăng ký phải lớn hơn 0." });

        var chapNhan = req.ChapNhan!.Value;
        _repo.Duyet(maDangKy, chapNhan, req.GhiChu);

        return Ok(new
        {
            message = chapNhan
                ? "Đã duyệt đơn đăng ký KTX."
                : "Đã từ chối đơn đăng ký KTX.",
            trangThai = chapNhan ? "Đã duyệt" : "Từ chối"
        });
    }

    // POST /api/ktx/dangky/{maDangKy}/xep-phong
    [HttpPost("{maDangKy:int}/xep-phong")]
    public IActionResult XepPhong(int maDangKy, [FromBody] XepPhongRequest req)
    {
        if (maDangKy <= 0)
            return BadRequest(new { message = "Mã đăng ký phải lớn hơn 0." });

        var (maPhanPhong, maHopDong) = _repo.XepPhong(maDangKy, req);
        return Ok(new
        {
            message = "Xếp phòng và tạo hợp đồng thành công.",
            maDangKy,
            maPhanPhong,
            maHopDong
        });
    }
}
