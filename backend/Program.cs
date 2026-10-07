using System.Text;
using Backend.Data;
using Backend.Repositories;
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
builder.Services.AddScoped<TaiKhoanRepository>();

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
        o.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var maTaiKhoan = context.Principal?.FindFirst("maTaiKhoan")?.Value;
                if (string.IsNullOrWhiteSpace(maTaiKhoan))
                {
                    context.Fail("Token không chứa mã tài khoản.");
                    return;
                }

                var repo = context.HttpContext.RequestServices.GetRequiredService<TaiKhoanRepository>();
                if (!await repo.DangHoatDongAsync(maTaiKhoan, context.HttpContext.RequestAborted))
                    context.Fail("Tài khoản đã bị khóa hoặc không còn tồn tại.");
            }
        };
    });

// Chính sách "SinhVien": đã đăng nhập và tài khoản gắn với một mã sinh viên
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("SinhVien", p => p.RequireAuthenticatedUser().RequireClaim("maSV"))
    // Chính sách "QuanLyKtx": chỉ quản lý KTX được dùng API nghiệp vụ KTX.
    .AddPolicy("QuanLyKtx", p => p.RequireAuthenticatedUser().RequireClaim("maVaiTro", "QLKTX"))
    // Chính sách "Admin": quản trị viên (claim maVaiTro lấy từ token)
    .AddPolicy("Admin", p => p.RequireAuthenticatedUser().RequireClaim("maVaiTro", "ADMIN"))
    // Chính sách "QuanLyTaiChinh": chỉ quản lý tài chính được dùng API nghiệp vụ tài chính.
    .AddPolicy("QuanLyTaiChinh", p => p.RequireAuthenticatedUser().RequireClaim("maVaiTro", "QLTC"));

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/ping-db", () => Database.TestConnection()
    ? Results.Ok("Kết nối SQL Server thành công!")
    : Results.Problem("Không kết nối được SQL Server."));

app.MapControllers();
app.Run();