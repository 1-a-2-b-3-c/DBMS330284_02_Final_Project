/**
 * Thông tin phòng KTX mà sinh viên hiện đang cư trú (khớp với Backend PhongCuaToiDto).
 */
export interface PhongCuaToiDto {
  maPhanPhong: number
  maPhong: number
  soPhong: string
  tenKhu: string
  ngayBatDau: string
  ngayKetThuc?: string | null
}

/**
 * Thông tin bạn cùng phòng của sinh viên (chỉ họ tên theo chính sách bảo mật).
 */
export interface BanCungPhongDto {
  hoTen: string
}

/**
 * Hóa đơn lệ phí dành cho sinh viên (khớp với Backend HoaDonDto).
 */
export interface HoaDonSinhVienDto {
  maHoaDon: number
  loaiHoaDon: string
  ngayLap: string
  hanThanhToan: string
  kyThu?: string | null
  trangThai: string
  tongTien: number
  daThanhToan: number
  conNo: number
}

/**
 * Chi tiết các khoản thu trong hóa đơn.
 */
export interface ChiTietHoaDonDto {
  tenKhoanThu: string
  soLuong: number
  donGia: number
  mienGiam: number
  thanhTien: number
}

/**
 * Biên bản vi phạm kỷ luật của sinh viên (khớp với Backend ViPhamDto).
 */
export interface ViPhamSinhVienDto {
  maViPham: number
  maSV: string
  hoTen: string
  ngayViPham: string
  ngayLapBienBan: string
  noiDung: string
  diaDiem?: string | null
  hinhThucXuLy: string
  trangThaiXuLy: string
}

/**
 * Yêu cầu nộp đơn đăng ký phòng KTX mới của sinh viên.
 */
export interface NopDonDangKyRequest {
  maLoaiPhong?: string
  ghiChu?: string
}

/**
 * Yêu cầu thanh toán hóa đơn của sinh viên.
 */
export interface ThanhToanRequest {
  soTien: number
  phuongThuc: string
  maGiaoDich?: string
}
