using Microsoft.Data.SqlClient;

namespace Backend.Data.Database;

public static class Database
{
    private static string _connStr = "";

    public static void Init(string connStr) => _connStr = connStr;

    public static SqlConnection GetConnection() => new SqlConnection(_connStr);

    public static bool TestConnection()
    {
        try
        {
            using var conn = GetConnection();
            conn.Open();
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine("Lỗi kết nối: " + ex.Message);
            return false;
        }
    }
}