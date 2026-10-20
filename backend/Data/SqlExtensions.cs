using System.Data;
using System.Text.Json;
using Microsoft.Data.SqlClient;

namespace Backend.Data;

public static class SqlExtensions
{
    public static SqlCommand Proc(this SqlConnection conn, string name)
        => new(name, conn) { CommandType = CommandType.StoredProcedure };

    public static SqlCommand Query(this SqlConnection conn, string sql)
        => new(sql, conn);

    public static SqlParameter AddParam(this SqlCommand cmd, string name, object? value)
    {
        if (value is DateOnly d)
            value = d.ToDateTime(TimeOnly.MinValue);
        return cmd.Parameters.AddWithValue(name, value ?? DBNull.Value);
    }

    public static SqlParameter AddOutInt(this SqlCommand cmd, string name)
    {
        var p = new SqlParameter(name, SqlDbType.Int) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(p);
        return p;
    }

    public static string? GetStringOrNull(this SqlDataReader r, string col)
    {
        var i = r.GetOrdinal(col);
        return r.IsDBNull(i) ? null : r.GetString(i);
    }

    public static DateOnly GetDateOnly(this SqlDataReader r, string col)
        => DateOnly.FromDateTime(r.GetDateTime(r.GetOrdinal(col)));

    public static DateOnly? GetDateOnlyOrNull(this SqlDataReader r, string col)
    {
        var i = r.GetOrdinal(col);
        return r.IsDBNull(i) ? null : DateOnly.FromDateTime(r.GetDateTime(i));
    }

    public static List<Dictionary<string, object?>> ReadRows(this SqlDataReader r)
    {
        var list = new List<Dictionary<string, object?>>();
        while (r.Read())
        {
            var row = new Dictionary<string, object?>(r.FieldCount);
            for (var i = 0; i < r.FieldCount; i++)
            {
                var name = JsonNamingPolicy.CamelCase.ConvertName(r.GetName(i));
                if (r.IsDBNull(i)) row[name] = null;
                else if (r.GetDataTypeName(i) == "date") row[name] = DateOnly.FromDateTime(r.GetDateTime(i));
                else row[name] = r.GetValue(i);
            }
            list.Add(row);
        }
        return list;
    }
}