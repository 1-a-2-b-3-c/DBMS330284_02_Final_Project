/**
 * Thông tin chi tiết của một phòng trong Ký túc xá (khớp với Backend PhongDto).
 */
export interface PhongDto {
  maPhong: number
  soPhong: string
  maKhu: string
  tenKhu: string
  maLoaiPhong: string
  tenLoaiPhong: string
  soNguoiToiDa: number
  donGia: number
  trangThai: string
  soNguoiDangO: number
  soChoTrong: number
}

/**
 * Thông tin rút gọn sinh viên đang cư trú trong phòng (từ sp_Phong_XemSinhVien).
 */
export interface SinhVienTrongPhongDto {
  maSV: string
  hoTen: string
}

/**
 * Bộ lọc phục vụ tra cứu danh sách phòng.
 */
export interface BoLocPhongDto {
  maKhu?: string
  trangThai?: string
  isChiLayConCho?: boolean
}

/**
 * Thông tin hồ sơ sinh viên lưu trữ trong hệ thống KTX (khớp với Backend SinhVienDto).
 */
export interface SinhVienDto {
  maSV: string
  hoTen: string
  ngaySinh: string
  gioiTinh: 'Nam' | 'Nữ' | 'Khác' | string
  queQuan?: string | null
  cccd?: string | null
  sdt: string
  khoa?: string | null
  namHoc: number
  dienUuTien?: string | null
}

/**
 * Danh mục chuẩn cho các ô chọn nhập liệu sinh viên (từ endpoint /api/ktx/sinhvien/danh-muc).
 */
export interface DanhMucSinhVienDto {
  gioiTinh: string[]
  dienUuTien: string[]
}

/**
 * Bộ lọc tra cứu danh sách sinh viên.
 */
export interface BoLocSinhVienDto {
  maSV?: string
  hoTen?: string
  khoa?: string
  namHoc?: number
}

/**
 * Payload khi tạo mới sinh viên (khớp với Backend ThemSinhVienRequest).
 */
export interface ThemSinhVienRequest {
  maSV: string
  hoTen: string
  ngaySinh: string
  gioiTinh: string
  sdt: string
  namHoc: number
  queQuan?: string
  cccd?: string
  khoa?: string
  dienUuTien?: string | null
}

/**
 * Kết quả trả về sau khi thêm mới sinh viên kèm tài khoản khởi tạo.
 */
export interface ThemSinhVienResponse {
  message: string
  tenDangNhap: string
  matKhauBanDau: string
}

/**
 * Payload khi cập nhật thông tin sinh viên (khớp với Backend CapNhatSinhVienRequest).
 */
export interface CapNhatSinhVienRequest {
  sdt?: string
  queQuan?: string
  khoa?: string
  namHoc?: number
  dienUuTien?: string | null
}

/**
 * Đơn đăng ký ở Ký túc xá (khớp với Backend DangKyDto).
 */
export interface DangKyDto {
  maDangKy: number
  maSV: string
  hoTen: string
  maLoaiPhong?: string | null
  tenLoaiPhong?: string | null
  ngayDangKy: string
  trangThai: 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI' | string
  ghiChu?: string | null
}

/**
 * Payload khi xét duyệt đơn đăng ký KTX.
 */
export interface DuyetDonDangKyRequest {
  chapNhan: boolean
  ghiChu?: string
}

/**
 * Payload khi xếp phòng cho sinh viên có đơn đã duyệt.
 */
export interface XepPhongRequest {
  maPhong: number
  ngayBatDau: string
  ngayKetThuc: string
  dieuKhoan?: string
}

/**
 * Phản hồi sau khi phân phòng và lập hợp đồng thành công.
 */
export interface KetQuaXepPhongResponse {
  message: string
  maDangKy: number
  maPhanPhong: number
  maHopDong: number
}

/**
 * Thông tin hợp đồng lưu trú (khớp với Backend HopDongDto và view vw_HopDongChiTiet).
 */
export interface HopDongDto {
  maHopDong: number
  maPhanPhong: number
  maSV: string
  hoTen: string
  soPhong: string
  tenKhu: string
  ngayBatDau: string
  ngayKetThuc?: string | null
  soNgayConLai?: number | null
  trangThai: string
  dieuKhoan?: string | null
}

/**
 * Bộ lọc phục vụ tra cứu danh sách hợp đồng lưu trú.
 */
export interface BoLocHopDongDto {
  maSV?: string
  trangThai?: string
  sapHetHanTrongNgay?: number
}
