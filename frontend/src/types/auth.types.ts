/**
 * Kiểu định nghĩa các mã vai trò được phép trong hệ thống Quản lý KTX.
 * - QLKTX: Quản lý Ký túc xá (phụ trách phòng, duyệt đơn, hợp đồng)
 * - SV: Sinh viên (tra cứu phòng cá nhân, nộp đơn, hóa đơn)
 * - ADMIN: Quản trị viên hệ thống (phân quyền, quản lý tài khoản)
 */
export type MaVaiTroNguoiDung = 'QLKTX' | 'SV' | 'ADMIN'

/**
 * Cấu trúc thông tin của người dùng đang đăng nhập trong hệ thống.
 */
export interface NguoiDungHienTai {
  maTaiKhoan: string
  tenDangNhap: string
  maVaiTro: MaVaiTroNguoiDung | string
  tenVaiTro?: string
  maSV?: string | null
}

/**
 * Payload phản hồi từ Backend endpoint POST /api/auth/dang-nhap.
 */
export interface DangNhapPhanHoiDto {
  token: string
  maTaiKhoan: string
  tenDangNhap: string
  maVaiTro: string
  tenVaiTro: string
  maSV: string | null
}

/**
 * Context quản lý trạng thái phiên làm việc và quyền hạn người dùng.
 */
export interface AuthContextType {
  nguoiDung: NguoiDungHienTai | null
  chuoiToken: string | null
  isLoadingAuth: boolean
  isDaDangNhap: boolean
  hasRole: (maVaiTroYeuCau: string | string[]) => boolean
  dangNhapVoiDuLieu: (duLieuPhanHoi: DangNhapPhanHoiDto) => void
  dangXuat: () => void
  thietLapTaiKhoanGiaLap: (maVaiTro: MaVaiTroNguoiDung) => void
}
