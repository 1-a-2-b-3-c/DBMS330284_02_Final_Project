using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Data.SqlClient;

namespace Backend;

// Bắt lỗi từ SQL Server cho mọi Controller:
// - Lỗi THROW 5xxxx trong procedure (lỗi nghiệp vụ)  -> 400 kèm nội dung tiếng Việt
// - 2627 / 2601 (trùng khóa hoặc giá trị UNIQUE)      -> 409
// - 547 (vi phạm FOREIGN KEY / CHECK)                 -> 400
// Với 2627 / 2601 / 547, tìm tên constraint trong thông báo gốc để trả câu dễ hiểu.
// Chỉ cần thêm constraint mà người dùng có thể gặp thật (UNIQUE, PRIMARY KEY, FOREIGN KEY);
// constraint CHECK thường đã được Dto kiểm tra trước.
public class SqlExceptionFilter : IExceptionFilter
{
    private static readonly Dictionary<string, string> ConstraintMessages = new()
    {
        // Sinh viên
        ["PK_SinhVien"] = "Mã sinh viên đã tồn tại.",
        ["UQ_SinhVien_CCCD"] = "CCCD đã được dùng cho sinh viên khác.",
        ["CK_SinhVien_NamHoc"] = "Năm học phải từ 1 trở lên.",
        ["CK_SinhVien_GioiTinh"] = "Giới tính phải là Nam, Nữ hoặc Khác.",
        ["CK_SinhVien_DienUuTien"] = "Diện ưu tiên không hợp lệ.",

        // Tài khoản
        ["PK_TaiKhoan"] = "Sinh viên này đã có tài khoản.",
        ["UQ_TaiKhoan_MaSV"] = "Sinh viên này đã có tài khoản.",
        ["UQ_TaiKhoan_TenDangNhap"] = "Tên đăng nhập đã được sử dụng.",
        ["FK_TaiKhoan_SinhVien"] = "Mã sinh viên không tồn tại trong hệ thống.",
        ["FK_TaiKhoan_VaiTro"] = "Vai trò không tồn tại (kiểm tra Auth:MaVaiTroSinhVien trong appsettings.json).",

        // Đăng ký KTX, chuyển phòng
        ["FK_DangKyKTX_LoaiPhong"] = "Loại phòng không tồn tại.",
        ["FK_ChuyenPhong_PhongMoi"] = "Phòng mới không tồn tại.",

        // Vi phạm
        ["FK_ViPham_SinhVien"] = "Mã sinh viên không tồn tại trong hệ thống.",
        ["CK_ViPham_HinhThucXuLy"] = "Hình thức xử lý vi phạm không hợp lệ.",
        ["CK_ViPham_TrangThaiXuLy"] = "Trạng thái xử lý vi phạm không hợp lệ.",
        ["CK_ViPham_Ngay"] = "Ngày lập biên bản không được trước ngày vi phạm.",
    };

    public void OnException(ExceptionContext context)
    {
        if (context.Exception is not SqlException ex) return;

        var (status, message) = ex.Number switch
        {
            50174 => (404, ex.Message),
            50173 or 50175 => (409, ex.Message),
            >= 50000 => (400, ex.Message),
            2627 or 2601 => (409, TimMoTa(ex.Message) ?? "Dữ liệu bị trùng (khóa chính hoặc giá trị duy nhất đã tồn tại)."),
            547 => (400, TimMoTa(ex.Message) ?? "Dữ liệu vi phạm ràng buộc (khóa ngoại hoặc điều kiện kiểm tra)."),
            _ => (500, "Lỗi cơ sở dữ liệu: " + ex.Message)
        };

        context.Result = new ObjectResult(new { message }) { StatusCode = status };
        context.ExceptionHandled = true;
    }

    private static string? TimMoTa(string sqlMessage)
    {
        foreach (var (name, text) in ConstraintMessages)
            if (sqlMessage.Contains(name, StringComparison.OrdinalIgnoreCase))
                return text;
        return null;
    }
}