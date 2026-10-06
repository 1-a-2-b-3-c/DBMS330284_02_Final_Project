using Backend.Dtos;
using Backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

// Chức năng của sinh viên đang đăng nhập. Mã sinh viên luôn lấy từ token (claim "maSV"),
// không nhận từ frontend, nên sinh viên này không thể xem hay sửa dữ liệu của sinh viên khác.
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

    // ===== Hồ sơ =====

    // GET /api/me
    [HttpGet]
    public IActionResult HoSo()
    {
        var sv = _sinhVien.TraCuu(MaSV, null, null, null).FirstOrDefault();
        return sv is null ? NotFound(new { message = "Không tìm thấy sinh viên." }) : Ok(sv);
    }

    // PUT /api/me : chỉ sửa số điện thoại, quê quán
    [HttpPut]
    public IActionResult CapNhatHoSo([FromBody] CapNhatHoSoRequest req)
    {
        _sinhVien.CapNhat(MaSV, new CapNhatSinhVienRequest { SDT = req.SDT, QueQuan = req.QueQuan });
        return Ok(new { message = "Cập nhật hồ sơ thành công." });
    }

    // ===== Đăng ký KTX =====

    // GET /api/me/dangky
    [HttpGet("dangky")]
    public IActionResult DanhSachDangKy() => Ok(_dangKy.TraCuu(MaSV, null));

    // POST /api/me/dangky
    [HttpPost("dangky")]
    public IActionResult TaoDangKy([FromBody] TaoDangKyRequest req)
    {
        // Đơn trùng và sinh viên đang ở KTX đã bị trigger trg_DangKyKTX_KiemTra chặn (trả 400 kèm câu tiếng Việt)
        var maLoaiPhong = string.IsNullOrWhiteSpace(req.MaLoaiPhong) ? null : req.MaLoaiPhong;
        var ma = _dangKy.Them(MaSV, maLoaiPhong, req.GhiChu);
        return Ok(new { message = "Đã gửi đơn đăng ký.", maDangKy = ma });
    }

    // ===== Phòng đang ở =====

    // GET /api/me/phong
    [HttpGet("phong")]
    public IActionResult PhongCuaToi() => Ok(_phong.PhongDangO(MaSV));

    // GET /api/me/phong/ban-cung-phong : chỉ trả họ tên, không trả mã sinh viên của người khác
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

    // ===== Hợp đồng =====

    // GET /api/me/hopdong?sapHetHanTrongNgay=30
    [HttpGet("hopdong")]
    public IActionResult HopDong([FromQuery] int? sapHetHanTrongNgay)
        => Ok(_hopDong.TraCuu(MaSV, null, sapHetHanTrongNgay));

    // ===== Hóa đơn và thanh toán =====

    // GET /api/me/hoadon
    [HttpGet("hoadon")]
    public IActionResult DanhSachHoaDon() => Ok(_hoaDon.DanhSachCuaSV(MaSV));

    // GET /api/me/hoadon/{maHoaDon}
    [HttpGet("hoadon/{maHoaDon:int}")]
    public IActionResult ChiTietHoaDon(int maHoaDon)
    {
        var hoaDon = _hoaDon.DanhSachCuaSV(MaSV).FirstOrDefault(h => h.MaHoaDon == maHoaDon);
        if (hoaDon is null)
            return NotFound(new { message = "Không tìm thấy hóa đơn." });

        return Ok(new { hoaDon, chiTiet = _hoaDon.ChiTiet(maHoaDon) });
    }

    // POST /api/me/hoadon/{maHoaDon}/thanhtoan
    [HttpPost("hoadon/{maHoaDon:int}/thanhtoan")]
    public IActionResult ThanhToan(int maHoaDon, [FromBody] ThanhToanRequest req)
    {
        if (!_hoaDon.DanhSachCuaSV(MaSV).Any(h => h.MaHoaDon == maHoaDon))
            return NotFound(new { message = "Không tìm thấy hóa đơn." });

        var ma = _hoaDon.ThanhToan(maHoaDon, req.SoTien, req.PhuongThuc, req.MaGiaoDich);
        return Ok(new { message = "Thanh toán thành công.", maThanhToan = ma });
    }

    // ===== Vi phạm =====

    // GET /api/me/vipham
    [HttpGet("vipham")]
    public IActionResult ViPham() => Ok(_viPham.TraCuu(MaSV, null));
}