using Microsoft.Data.SqlClient;

namespace Backend.Data.Database;

public static class SqlExtensions
{
    // Thêm tham số; giá trị null được đổi thành DBNull để SQL Server hiểu là NULL
    // (khi null, procedure sẽ dùng giá trị mặc định = NULL của nó)
    public static SqlParameter AddParam(this SqlCommand cmd, string name, object? value)
    {
        if (value is DateOnly d)
            value = d.ToDateTime(TimeOnly.MinValue);
        return cmd.Parameters.AddWithValue(name, value ?? DBNull.Value);
    }

    public static string? GetStringOrNull(this SqlDataReader r, string col)
    {
        var i = r.GetOrdinal(col);
        return r.IsDBNull(i) ? null : r.GetString(i);
    }

    public static DateOnly GetDateOnly(this SqlDataReader r, string col)
        => DateOnly.FromDateTime(r.GetDateTime(r.GetOrdinal(col)));
}