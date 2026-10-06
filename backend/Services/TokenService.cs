using System.Security.Claims;
using System.Text;
using Backend.Dtos;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Services;

// Tạo JWT sau khi đăng nhập thành công. Cấu hình lấy từ mục "Jwt" trong appsettings.json.
// Token chứa maSV: các endpoint /api/me lấy mã sinh viên từ token, không tin dữ liệu frontend gửi lên.
public class TokenService
{
    private readonly IConfiguration _cfg;

    public TokenService(IConfiguration cfg) => _cfg = cfg;

    public string TaoToken(TaiKhoanDto tk)
    {
        var claims = new List<Claim>
        {
            new("maTaiKhoan", tk.MaTaiKhoan),
            new("tenDangNhap", tk.TenDangNhap),
            new("maVaiTro", tk.MaVaiTro),
            new("tenVaiTro", tk.TenVaiTro)
        };
        if (tk.MaSV is not null)
            claims.Add(new Claim("maSV", tk.MaSV));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_cfg["Jwt:Key"]!));
        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = _cfg["Jwt:Issuer"],
            Audience = _cfg["Jwt:Audience"],
            Expires = DateTime.UtcNow.AddHours(_cfg.GetValue("Jwt:HetHanGio", 8)),
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        };

        return new JsonWebTokenHandler().CreateToken(descriptor);
    }
}