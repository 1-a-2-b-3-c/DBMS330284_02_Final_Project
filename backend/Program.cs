using Backend.Data;

var builder = WebApplication.CreateBuilder(args);
Database.Init(builder.Configuration.GetConnectionString("Default")!);
builder.Services.AddControllers();

var app = builder.Build();

app.MapGet("/api/ping-db", () => Database.TestConnection()
    ? Results.Ok("Kết nối SQL Server thành công!")
    : Results.Problem("Không kết nối được SQL Server."));

app.MapControllers();
app.Run();