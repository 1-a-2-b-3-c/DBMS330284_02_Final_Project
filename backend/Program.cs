using Backend.Data.Database;
using Backend.Data.SqlExceptionFilter;

var builder = WebApplication.CreateBuilder(args);
Database.Init(builder.Configuration.GetConnectionString("Default")!);
builder.Services.AddControllers(options =>
    options.Filters.Add(new SqlExceptionFilter()));

var app = builder.Build();

app.MapGet("/api/ping-db", () => Database.TestConnection()
    ? Results.Ok("Kết nối SQL Server thành công!")
    : Results.Problem("Không kết nối được SQL Server."));

app.MapControllers();
app.Run();