using Backend.Data;

namespace Backend.Repositories;

public class HopDongRepository
{
    // sp_HopDong_TraCuu (đọc vw_HopDongChiTiet). Chưa biết hết các cột của view nên trả dạng "dòng".
    // sapHetHanTrongNgay = N: chỉ lấy hợp đồng còn hiệu lực sẽ hết hạn trong N ngày tới.
    public List<Dictionary<string, object?>> TraCuu(string? maSV, string? trangThai, int? sapHetHanTrongNgay)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_HopDong_TraCuu");
        cmd.AddParam("@MaSV", maSV);
        cmd.AddParam("@TrangThai", trangThai);
        cmd.AddParam("@SapHetHanTrongNgay", sapHetHanTrongNgay);
        using var r = cmd.ExecuteReader();
        return r.ReadRows();
    }

    public void KetThucLuuTru(int maPhanPhong)
    {
        using var conn = Database.GetConnection();
        conn.Open();
        using var cmd = conn.Proc("dbo.sp_KetThucPhanPhong");
        cmd.AddParam("@MaPhanPhong", maPhanPhong);
        cmd.ExecuteNonQuery();
    }
}