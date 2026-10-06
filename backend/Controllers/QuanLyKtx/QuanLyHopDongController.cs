using Backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/ktx/hopdong")]
[Authorize(Policy = "QuanLyKtx")]
public class QuanLyHopDongController : ControllerBase
{
    private readonly HopDongRepository _repo = new();

    // GET /api/ktx/hopdong?maSV=&trangThai=&sapHetHanTrongNgay=
    [HttpGet]
    public IActionResult TraCuu([FromQuery] string? maSV,
                                [FromQuery] string? trangThai,
                                [FromQuery] int? sapHetHanTrongNgay)
    {
        if (sapHetHanTrongNgay < 0)
            return BadRequest(new { message = "Số ngày sắp hết hạn không được âm." });

        return Ok(_repo.TraCuu(maSV, trangThai, sapHetHanTrongNgay));
    }

    // PATCH /api/ktx/hopdong/phan-phong/{maPhanPhong}/ket-thuc
    [HttpPatch("phan-phong/{maPhanPhong:int}/ket-thuc")]
    public IActionResult KetThucLuuTru(int maPhanPhong)
    {
        if (maPhanPhong <= 0)
            return BadRequest(new { message = "Mã phân phòng phải lớn hơn 0." });

        _repo.KetThucLuuTru(maPhanPhong);
        return Ok(new { message = "Đã kết thúc lưu trú và thanh lý hợp đồng." });
    }
}
