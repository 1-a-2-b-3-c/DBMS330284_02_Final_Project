using Backend.Dtos;
using Backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/me")]
[Authorize(Policy = "SinhVien")]
public class MeController : ControllerBase
{
    private readonly SinhVienRepository _sinhVien = new();
    private readonly DangKyRepository _dangKy = new();
    private readonly PhongRepository _phong = new();
    private readonly HopDongRepository _hopDong = new();
    private readonly HoaDonRepository _hoaDon = new();
    private readonly ViPhamRepository _viPham = new();

    private string MaSV => User.FindFirst("maSV")!.Value;

    [HttpGet]
    public IActionResult HoSo()
    {
        var sv = _sinhVien.TraCuu(MaSV, null, null, null).FirstOrDefault();
        return sv is null ? NotFound(new { message = "Không tìm thấy sinh viên." }) : Ok(sv);
    }

    [HttpPut]
    public IActionResult CapNhatHoSo([FromBody] CapNhatHoSoRequest req)
    {
        _sinhVien.CapNhat(MaSV, new CapNhatSinhVienRequest { SDT = req.SDT, QueQuan = req.QueQuan });
        return Ok(new { message = "Cập nhật hồ sơ thành công." });
    }

    [HttpGet("dangky")]
    public IActionResult DanhSachDangKy() => Ok(_dangKy.TraCuu(MaSV, null));

    [HttpPost("dangky")]
    public IActionResult TaoDangKy([FromBody] TaoDangKyRequest req)
    {
        var maLoaiPhong = string.IsNullOrWhiteSpace(req.MaLoaiPhong) ? null : req.MaLoaiPhong;
        var ma = _dangKy.Them(MaSV, maLoaiPhong, req.GhiChu);
        return Ok(new { message = "Đã gửi đơn đăng ký.", maDangKy = ma });
    }

    [HttpGet("phong")]
    public IActionResult PhongCuaToi() => Ok(_phong.PhongDangO(MaSV));

    [HttpGet("phong/ban-cung-phong")]
    public IActionResult BanCungPhong()
    {
        var phong = _phong.PhongDangO(MaSV).FirstOrDefault();
        if (phong is null) return Ok(Array.Empty<object>());

        var ds = _phong.NguoiTrongPhong(phong.MaPhong)
            .Where(x => x.MaSV != MaSV)
            .Select(x => new { hoTen = x.HoTen });
        return Ok(ds);
    }

    [HttpGet("hopdong")]
    public IActionResult HopDong([FromQuery] int? sapHetHanTrongNgay)
        => Ok(_hopDong.TraCuu(MaSV, null, sapHetHanTrongNgay));

    [HttpGet("hoadon")]
    public IActionResult DanhSachHoaDon() => Ok(_hoaDon.DanhSachCuaSV(MaSV));

    [HttpGet("hoadon/{maHoaDon:int}")]
    public IActionResult ChiTietHoaDon(int maHoaDon)
    {
        var hoaDon = _hoaDon.DanhSachCuaSV(MaSV).FirstOrDefault(h => h.MaHoaDon == maHoaDon);
        if (hoaDon is null)
            return NotFound(new { message = "Không tìm thấy hóa đơn." });

        return Ok(new { hoaDon, chiTiet = _hoaDon.ChiTiet(maHoaDon) });
    }

    [HttpPost("hoadon/{maHoaDon:int}/thanhtoan")]
    public IActionResult ThanhToan(int maHoaDon, [FromBody] ThanhToanRequest req)
    {
        if (!_hoaDon.DanhSachCuaSV(MaSV).Any(h => h.MaHoaDon == maHoaDon))
            return NotFound(new { message = "Không tìm thấy hóa đơn." });

        var ma = _hoaDon.ThanhToan(maHoaDon, req.SoTien, req.PhuongThuc, req.MaGiaoDich);
        return Ok(new { message = "Thanh toán thành công.", maThanhToan = ma });
    }

    [HttpGet("vipham")]
    public IActionResult ViPham() => Ok(_viPham.TraCuu(MaSV, null));
}