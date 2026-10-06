namespace Backend.Dtos;

// Một dòng của vw_PhongChiTiet (qua sp_Phong_TraCuu)
public class PhongDto
{
    public int MaPhong { get; set; }
    public string SoPhong { get; set; } = "";
    public string MaKhu { get; set; } = "";
    public string TenKhu { get; set; } = "";
    public string MaLoaiPhong { get; set; } = "";
    public string TenLoaiPhong { get; set; } = "";
    public int SoNguoiToiDa { get; set; }
    public decimal DonGia { get; set; }
    public string TrangThai { get; set; } = "";
    public int SoNguoiDangO { get; set; }
    public int SoChoTrong { get; set; }
}