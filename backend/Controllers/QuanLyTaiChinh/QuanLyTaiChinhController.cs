using Backend.Dtos;
using Backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/ktx/taichinh")]
[Authorize(Policy = "QuanLyTaiChinh")]
public class QuanLyTaiChinhController : ControllerBase
{
    private readonly TaiChinhRepository _repo = new();

    [HttpGet("cong-no")]
    public IActionResult CongNo([FromQuery] string? maSV,
                               [FromQuery] string? trangThai,
                               [FromQuery] string? loaiHoaDon)
        => Ok(_repo.CongNo(maSV, trangThai, loaiHoaDon));

    [HttpGet("hoa-don-qua-han")]
    public IActionResult HoaDonQuaHan([FromQuery] string? maSV)
        => Ok(_repo.HoaDonQuaHan(maSV));

    [HttpGet("doanh-thu")]
    public IActionResult DoanhThu([FromQuery] int? nam, [FromQuery] string? loaiHoaDon)
    {
        if (nam is <= 0)
            return BadRequest(new { message = "Năm phải lớn hơn 0." });

        return Ok(_repo.DoanhThu(nam, loaiHoaDon));
    }

    [HttpGet("hoa-don/{maHoaDon:int}")]
    public IActionResult LayHoaDon(int maHoaDon)
    {
        if (maHoaDon <= 0)
            return BadRequest(new { message = "Mã hóa đơn phải lớn hơn 0." });

        var hoaDon = _repo.LayHoaDon(maHoaDon);
        if (hoaDon is null)
            return NotFound(new { message = "Không tìm thấy hóa đơn." });

        return Ok(new { hoaDon, chiTiet = _repo.ChiTietHoaDon(maHoaDon) });
    }

    [HttpPost("hoa-don")]
    public IActionResult LapHoaDon([FromBody] LapHoaDonRequest req)
    {
        var maHoaDons = _repo.LapHoaDon(req);
        if (maHoaDons.Count == 0)
            return NotFound(new { message = "Không tìm thấy sinh viên đang ở hoặc sinh viên nào đang ở phòng đã chọn." });

        return CreatedAtAction(nameof(LayHoaDon), new { maHoaDon = maHoaDons[0] }, new
        {
            message = $"Lập thành công {maHoaDons.Count} hóa đơn.",
            soLuongHoaDon = maHoaDons.Count,
            maHoaDons
        });
    }

    [HttpPost("hoa-don/{maHoaDon:int}/chi-tiet")]
    public IActionResult ThemChiTiet(int maHoaDon, [FromBody] ThemChiTietHoaDonRequest req)
    {
        if (maHoaDon <= 0)
            return BadRequest(new { message = "Mã hóa đơn phải lớn hơn 0." });

        _repo.ThemChiTietHoaDon(maHoaDon, req);
        return CreatedAtAction(nameof(LayHoaDon), new { maHoaDon }, new
        {
            message = "Thêm chi tiết hóa đơn thành công.",
            maHoaDon
        });
    }

    [HttpPatch("hoa-don/{maHoaDon:int}/huy")]
    public IActionResult HuyHoaDon(int maHoaDon)
    {
        if (maHoaDon <= 0)
            return BadRequest(new { message = "Mã hóa đơn phải lớn hơn 0." });

        _repo.HuyHoaDon(maHoaDon);
        return Ok(new { message = "Đã hủy hóa đơn." });
    }
}
