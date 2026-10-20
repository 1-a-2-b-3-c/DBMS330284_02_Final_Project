using System.ComponentModel.DataAnnotations;
using System.Data;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Backend.Controllers;

[ApiController]
[Route("api/ktx/taichinh/thu-tien")]
[Authorize(Policy = "QuanLyTaiChinh")]
public sealed class ThuTienController : ControllerBase
{
    public sealed class GhiNhanThuTienRequest
    {
        [Range(1, int.MaxValue, ErrorMessage = "Mã hóa đơn không hợp lệ.")]
        public int MaHoaDon { get; set; }

        [Range(typeof(decimal), "0.01", "999999999999.99", ErrorMessage = "Số tiền phải lớn hơn 0.")]
        public decimal SoTien { get; set; }

        [Required(ErrorMessage = "Phương thức thanh toán là bắt buộc.")]
        public string PhuongThuc { get; set; } = "";

        [StringLength(100, ErrorMessage = "Mã giao dịch tối đa 100 ký tự.")]
        public string? MaGiaoDich { get; set; }
    }

    [HttpGet("lich-su/{maHoaDon:int}")]
    public IActionResult LichSu(int maHoaDon)
    {
        if (maHoaDon <= 0) return BadRequest(new { message = "Mã hóa đơn không hợp lệ." });
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Query(@"
            SELECT MaThanhToan, MaHoaDon, NgayThanhToan, SoTien,
                   PhuongThuc, TrangThai, MaGiaoDich
            FROM dbo.ThanhToan WHERE MaHoaDon = @MaHoaDon
            ORDER BY NgayThanhToan DESC, MaThanhToan DESC");
        cmd.AddParam("@MaHoaDon", maHoaDon);
        using var reader = cmd.ExecuteReader();
        return Ok(reader.ReadRows());
    }

    [HttpPost]
    public IActionResult GhiNhan([FromBody] GhiNhanThuTienRequest req)
    {
        if (req.PhuongThuc is not ("Tiền mặt" or "Chuyển khoản"))
            return BadRequest(new { message = "Chỉ hỗ trợ Tiền mặt hoặc Chuyển khoản." });
        var maGiaoDich = string.IsNullOrWhiteSpace(req.MaGiaoDich) ? null : req.MaGiaoDich.Trim();
        if (req.PhuongThuc == "Chuyển khoản" && maGiaoDich is null)
            return BadRequest(new { message = "Vui lòng nhập mã giao dịch chuyển khoản." });
        if (maGiaoDich?.Length > 100)
            return BadRequest(new { message = "Mã giao dịch quá dài." });
        if (req.MaHoaDon <= 0 || req.SoTien <= 0)
            return BadRequest(new { message = "Mã hóa đơn hoặc số tiền không hợp lệ." });

        using var conn = Database.GetConnection();
        conn.Open();
        using var tx = conn.BeginTransaction(IsolationLevel.Serializable);
        try
        {
            decimal? conNo = null;
            string? trangThai = null;
            using (var kiemTra = new SqlCommand(@"
                SELECT h.TrangThai,
                       CAST(ISNULL((SELECT SUM(ct.SoLuong * ct.DonGia - ct.MienGiam)
                                    FROM dbo.ChiTietHoaDon ct WHERE ct.MaHoaDon = h.MaHoaDon), 0)
                            - ISNULL((SELECT SUM(tt.SoTien) FROM dbo.ThanhToan tt
                                      WHERE tt.MaHoaDon = h.MaHoaDon AND tt.TrangThai = N'Thành công'), 0)
                            AS DECIMAL(18,2)) AS ConNo
                FROM dbo.HoaDon h WITH (UPDLOCK, HOLDLOCK)
                WHERE h.MaHoaDon = @MaHoaDon", conn, tx))
            {
                kiemTra.AddParam("@MaHoaDon", req.MaHoaDon);
                using var r = kiemTra.ExecuteReader();
                if (r.Read())
                {
                    trangThai = r.GetString(0);
                    conNo = r.GetDecimal(1);
                }
            }

            if (conNo is null)
                return LoiGiaoDich(tx, 404, "Không tìm thấy hóa đơn.");
            if (trangThai is "Đã hủy" or "Đã thanh toán")
                return LoiGiaoDich(tx, 409, "Hóa đơn đã hủy hoặc đã thanh toán.");
            if (conNo <= 0)
                return LoiGiaoDich(tx, 409, "Hóa đơn không còn công nợ.");
            if (req.SoTien > conNo)
                return LoiGiaoDich(tx, 400, "Số tiền thu không được vượt quá số còn nợ.");

            if (maGiaoDich is not null)
            {
                using var kiemTraMa = new SqlCommand(@"
                    SELECT COUNT(*) FROM dbo.ThanhToan WITH (UPDLOCK, HOLDLOCK)
                    WHERE PhuongThuc = N'Chuyển khoản' AND MaGiaoDich = @MaGiaoDich
                      AND TrangThai = N'Thành công'", conn, tx);
                kiemTraMa.AddParam("@MaGiaoDich", maGiaoDich);
                if ((int)kiemTraMa.ExecuteScalar()! > 0)
                    return LoiGiaoDich(tx, 409, "Mã giao dịch này đã được ghi nhận trước đó.");
            }

            int maThanhToan;
            using (var ghi = new SqlCommand(@"
                INSERT dbo.ThanhToan
                    (MaHoaDon, NgayThanhToan, SoTien, PhuongThuc, TrangThai, MaGiaoDich)
                VALUES (@MaHoaDon, SYSDATETIME(), @SoTien, @PhuongThuc, N'Thành công', @MaGiaoDich);
                SELECT CAST(SCOPE_IDENTITY() AS int);", conn, tx))
            {
                ghi.AddParam("@MaHoaDon", req.MaHoaDon);
                ghi.AddParam("@SoTien", req.SoTien);
                ghi.AddParam("@PhuongThuc", req.PhuongThuc);
                ghi.AddParam("@MaGiaoDich", maGiaoDich);
                maThanhToan = (int)ghi.ExecuteScalar()!;
            }

            using (var capNhat = new SqlCommand(@"
                UPDATE dbo.HoaDon
                SET TrangThai = CASE WHEN @ConNoConLai = 0 THEN N'Đã thanh toán'
                                    ELSE N'Thanh toán một phần' END
                WHERE MaHoaDon = @MaHoaDon AND TrangThai <> N'Đã hủy'", conn, tx))
            {
                capNhat.AddParam("@MaHoaDon", req.MaHoaDon);
                capNhat.AddParam("@ConNoConLai", conNo.Value - req.SoTien);
                capNhat.ExecuteNonQuery();
            }

            tx.Commit();
            return Ok(new { message = "Đã ghi nhận tiền thu vào SQL Server.", maThanhToan });
        }
        catch
        {
            try { tx.Rollback(); } catch (InvalidOperationException) { }
            throw;
        }
    }

    private IActionResult LoiGiaoDich(SqlTransaction tx, int status, string message)
    {
        tx.Rollback();
        return StatusCode(status, new { message });
    }
}
