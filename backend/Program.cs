using System.Text;
using Backend.Data;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
Database.Init(builder.Configuration.GetConnectionString("Default")!);

// Controller + bắt lỗi SQL Server + gom lỗi kiểm tra dữ liệu về dạng { "message": "..." }
builder.Services.AddControllers(o => o.Filters.Add<Backend.SqlExceptionFilter>())
    .ConfigureApiBehaviorOptions(o =>
    {
        o.InvalidModelStateResponseFactory = ctx =>
        {
            var message = string.Join(" ", ctx.ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage));
            return new BadRequestObjectResult(new { message });
        };
    });

builder.Services.AddSingleton<TokenService>();

// Cho phép frontend (chạy ở cổng khác) gọi API
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

// Đăng nhập bằng JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false; // giữ nguyên tên claim như maSV, maTaiKhoan
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

// Chính sách "SinhVien": đã đăng nhập và tài khoản gắn với một mã sinh viên
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("SinhVien", p => p.RequireAuthenticatedUser().RequireClaim("maSV"))
    // Chính sách "QuanLyKtx": quản lý KTX hoặc quản trị viên (claim maVaiTro lấy từ token)
    .AddPolicy("QuanLyKtx", p => p.RequireAuthenticatedUser().RequireClaim("maVaiTro", "QLKTX", "ADMIN"));

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/ping-db", () => Database.TestConnection()
    ? Results.Ok("Kết nối SQL Server thành công!")
    : Results.Problem("Không kết nối được SQL Server."));

app.MapControllers();
app.Run();