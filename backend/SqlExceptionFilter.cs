using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Data.SqlClient;

namespace Backend.Data.SqlExceptionFilter;

// Bắt lỗi từ SQL Server cho mọi Controller:
// - Lỗi THROW 5xxxx trong procedure (lỗi nghiệp vụ) -> 400 kèm nội dung tiếng Việt
// - 2627 / 2601 (trùng khóa) -> 409
// - 547 (vi phạm khóa ngoại / CHECK) -> 400
public class SqlExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        if (context.Exception is not SqlException ex) return;

        var (status, message) = ex.Number switch
        {
            >= 50000 => (400, ex.Message),
            2627 or 2601 => (409, "Dữ liệu bị trùng (khóa chính hoặc giá trị duy nhất đã tồn tại)."),
            547 => (400, "Dữ liệu vi phạm ràng buộc (khóa ngoại hoặc điều kiện kiểm tra)."),
            _ => (500, "Lỗi cơ sở dữ liệu: " + ex.Message)
        };

        context.Result = new ObjectResult(new { message }) { StatusCode = status };
        context.ExceptionHandled = true;
    }
}