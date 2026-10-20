using System.ComponentModel.DataAnnotations;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/ktx/taichinh/khoan-thu")]
[Authorize(Policy = "QuanLyTaiChinh")]
public sealed class KhoanThuController : ControllerBase
{
    public sealed class KhoanThuRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập tên khoản thu.")]
        [StringLength(100, ErrorMessage = "Tên khoản thu tối đa 100 ký tự.")]
        public string TenKhoanThu { get; set; } = "";

        [Range(typeof(decimal), "0", "999999999999.99", ErrorMessage = "Đơn giá phải từ 0 đến 999.999.999.999,99 đồng.")]
        public decimal DonGiaMacDinh { get; set; }

        [StringLength(255, ErrorMessage = "Mô tả tối đa 255 ký tự.")]
        public string? MoTa { get; set; }

        public bool TrangThai { get; set; } = true;
    }

    public sealed class TrangThaiKhoanThuRequest
    {
        public bool TrangThai { get; set; }
    }

    [HttpGet]
    public IActionResult DanhSach()
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Query(@"
            SELECT MaKhoanThu, TenKhoanThu, DonGiaMacDinh, MoTa, TrangThai
            FROM dbo.KhoanThu ORDER BY MaKhoanThu");
        using var r = cmd.ExecuteReader();
        return Ok(r.ReadRows());
    }

    [HttpPost]
    public IActionResult Tao([FromBody] KhoanThuRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.TenKhoanThu))
            return BadRequest(new { message = "Tên khoản thu không được để trống." });
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Query(@"
            INSERT dbo.KhoanThu (TenKhoanThu, DonGiaMacDinh, MoTa, TrangThai)
            VALUES (@Ten, @DonGia, @MoTa, @TrangThai);
            SELECT CAST(SCOPE_IDENTITY() AS int);");
        cmd.AddParam("@Ten", req.TenKhoanThu.Trim());
        cmd.AddParam("@DonGia", req.DonGiaMacDinh);
        cmd.AddParam("@MoTa", string.IsNullOrWhiteSpace(req.MoTa) ? null : req.MoTa.Trim());
        cmd.AddParam("@TrangThai", req.TrangThai);
        var id = (int)cmd.ExecuteScalar()!;
        return StatusCode(201, new { message = "Đã tạo khoản thu.", maKhoanThu = id });
    }

    [HttpPut("{id:int}")]
    public IActionResult Sua(int id, [FromBody] KhoanThuRequest req)
    {
        if (id <= 0) return BadRequest(new { message = "Mã khoản thu không hợp lệ." });
        if (string.IsNullOrWhiteSpace(req.TenKhoanThu))
            return BadRequest(new { message = "Tên khoản thu không được để trống." });
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Query(@"
            UPDATE dbo.KhoanThu
            SET TenKhoanThu = @Ten, DonGiaMacDinh = @DonGia,
                MoTa = @MoTa, TrangThai = @TrangThai
            WHERE MaKhoanThu = @Id;
            SELECT @@ROWCOUNT;");
        cmd.AddParam("@Id", id);
        cmd.AddParam("@Ten", req.TenKhoanThu.Trim());
        cmd.AddParam("@DonGia", req.DonGiaMacDinh);
        cmd.AddParam("@MoTa", string.IsNullOrWhiteSpace(req.MoTa) ? null : req.MoTa.Trim());
        cmd.AddParam("@TrangThai", req.TrangThai);
        if ((int)cmd.ExecuteScalar()! == 0)
            return NotFound(new { message = "Không tìm thấy khoản thu." });
        return Ok(new { message = "Đã cập nhật khoản thu." });
    }

    [HttpPatch("{id:int}/trang-thai")]
    public IActionResult DoiTrangThai(int id, [FromBody] TrangThaiKhoanThuRequest req)
    {
        if (id <= 0) return BadRequest(new { message = "Mã khoản thu không hợp lệ." });
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Query(@"
            UPDATE dbo.KhoanThu SET TrangThai = @TrangThai WHERE MaKhoanThu = @Id;
            SELECT @@ROWCOUNT;");
        cmd.AddParam("@Id", id);
        cmd.AddParam("@TrangThai", req.TrangThai);
        if ((int)cmd.ExecuteScalar()! == 0)
            return NotFound(new { message = "Không tìm thấy khoản thu." });
        return Ok(new { message = req.TrangThai ? "Đã kích hoạt khoản thu." : "Đã tạm ngừng khoản thu." });
    }
}
