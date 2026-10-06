using Backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/phong")]
[Authorize] // cần đăng nhập, sinh viên hay quản lý đều xem được
public class PhongController : ControllerBase
{
    private readonly PhongRepository _repo = new();

    // GET /api/phong?maKhu=&trangThai=&chiConCho=true
    // chiConCho=true: chỉ phòng đang hoạt động và còn chỗ trống (để sinh viên chọn khi chuyển phòng)
    [HttpGet]
    public IActionResult TraCuu([FromQuery] string? maKhu, [FromQuery] string? trangThai,
                                [FromQuery] bool chiConCho = false)
        => Ok(_repo.TraCuu(maKhu, trangThai, chiConCho));
}