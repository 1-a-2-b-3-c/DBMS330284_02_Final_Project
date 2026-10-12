import { axiosClient } from './axiosClient'
import type { SinhVienDto } from '@/types/dorm.types'
import type {
  PhongCuaToiDto,
  HoaDonSinhVienDto,
  ChiTietHoaDonDto,
  ViPhamSinhVienDto,
  NopDonDangKyRequest,
} from '@/types/student.types'
import type { DangKyDto, HopDongDto } from '@/types/dorm.types'

/**
 * Lấy thông tin hồ sơ của sinh viên đang đăng nhập.
 * Liên kết: Endpoint GET /api/me (MeController.cs) -> sp_SinhVien_TraCuu theo mã SV trong JWT token.
 * @returns Hồ sơ chi tiết của sinh viên.
 */
export const layHoSoSinhVien = async (): Promise<SinhVienDto> => {
  const response = await axiosClient.get<SinhVienDto>('/api/me')
  return response.data
}

/**
 * Cập nhật số điện thoại và quê quán của sinh viên đang đăng nhập.
 * Liên kết: Endpoint PUT /api/me (MeController.cs).
 * @param sdt - Số điện thoại mới của sinh viên.
 * @param queQuan - Quê quán mới.
 * @returns Thông báo thành công từ máy chủ.
 */
export const capNhatHoSoSinhVien = async (
  sdt: string,
  queQuan?: string
): Promise<{ message: string }> => {
  const response = await axiosClient.put<{ message: string }>('/api/me', {
    sdt,
    queQuan,
  })
  return response.data
}

/**
 * Lấy lịch sử và danh sách đơn đăng ký KTX của sinh viên đang đăng nhập.
 * Liên kết: Endpoint GET /api/me/dangky (MeController.cs) -> DangKyRepository.TraCuu.
 * @returns Danh sách các đơn đăng ký của bản thân.
 */
export const layDanhSachDangKyCuaToi = async (): Promise<DangKyDto[]> => {
  const response = await axiosClient.get<DangKyDto[]>('/api/me/dangky')
  return response.data
}

/**
 * Nộp đơn đăng ký nguyện vọng ở Ký túc xá mới.
 * Liên kết: Endpoint POST /api/me/dangky (MeController.cs).
 * Được bảo vệ bởi Trigger SQL Server kiểm tra trùng lặp và tình trạng đã ở KTX.
 * @param yeuCauDangKy - Loại phòng mong muốn và ghi chú nguyện vọng.
 * @returns Kết quả và mã số đơn đăng ký mới tạo.
 */
export const nopDonDangKyKtx = async (
  yeuCauDangKy: NopDonDangKyRequest
): Promise<{ message: string; maDangKy: number }> => {
  const response = await axiosClient.post<{ message: string; maDangKy: number }>(
    '/api/me/dangky',
    yeuCauDangKy
  )
  return response.data
}

/**
 * Tra cứu thông tin phòng KTX mà sinh viên hiện đang cư trú.
 * Liên kết: Endpoint GET /api/me/phong (MeController.cs) -> vw_SinhVienDangO.
 * @returns Danh sách phòng đang ở (thông thường là 1 phòng hiện hành).
 */
export const layPhongDangOCuaToi = async (): Promise<PhongCuaToiDto[]> => {
  const response = await axiosClient.get<PhongCuaToiDto[]>('/api/me/phong')
  return response.data
}

/**
 * Lấy danh sách họ tên các bạn cùng phòng hiện tại của sinh viên.
 * Liên kết: Endpoint GET /api/me/phong/ban-cung-phong (MeController.cs).
 * @returns Danh sách đối tượng chỉ chứa họ tên bạn cùng phòng (bảo mật MSSV).
 */
export const layDanhSachBanCungPhong = async (): Promise<{ hoTen: string }[]> => {
  const response = await axiosClient.get<{ hoTen: string }[]>('/api/me/phong/ban-cung-phong')
  return response.data
}

/**
 * Tra cứu hợp đồng lưu trú cá nhân của sinh viên.
 * Liên kết: Endpoint GET /api/me/hopdong (MeController.cs).
 * @param sapHetHanTrongNgay - Số ngày kiểm tra sắp hết hạn (ví dụ: 30 ngày).
 * @returns Danh sách hợp đồng lưu trú cá nhân.
 */
export const layHopDongCuaToi = async (
  sapHetHanTrongNgay?: number
): Promise<HopDongDto[]> => {
  const params: Record<string, number> = {}
  if (typeof sapHetHanTrongNgay === 'number') {
    params.sapHetHanTrongNgay = sapHetHanTrongNgay
  }
  const response = await axiosClient.get<HopDongDto[]>('/api/me/hopdong', { params })
  return response.data
}

/**
 * Tra cứu danh sách hóa đơn cá nhân (tiền phòng, điện, nước).
 * Liên kết: Endpoint GET /api/me/hoadon (MeController.cs) -> fn_TongTienHoaDon, fn_ConNo.
 * @returns Danh sách hóa đơn của sinh viên.
 */
export const layDanhSachHoaDonCuaToi = async (): Promise<HoaDonSinhVienDto[]> => {
  const response = await axiosClient.get<HoaDonSinhVienDto[]>('/api/me/hoadon')
  return response.data
}

/**
 * Xem chi tiết từng khoản phí trong một hóa đơn cụ thể.
 * Liên kết: Endpoint GET /api/me/hoadon/{maHoaDon} (MeController.cs).
 * @param maHoaDon - Mã số định danh hóa đơn.
 * @returns Thông tin tổng hợp hóa đơn và danh sách các mục chi tiết khoản thu.
 */
export const layChiTietHoaDonCuaToi = async (
  maHoaDon: number
): Promise<{ hoaDon: HoaDonSinhVienDto; chiTiet: ChiTietHoaDonDto[] }> => {
  const response = await axiosClient.get<{
    hoaDon: HoaDonSinhVienDto
    chiTiet: ChiTietHoaDonDto[]
  }>(`/api/me/hoadon/${maHoaDon}`)
  return response.data
}

/**
 * Thực hiện thanh toán trực tuyến cho một hóa đơn.
 * Liên kết: Endpoint POST /api/me/hoadon/{maHoaDon}/thanhtoan (MeController.cs).
 * @param maHoaDon - Mã số hóa đơn cần thanh toán.
 * @param soTien - Số tiền thanh toán.
 * @param phuongThuc - Phương thức thanh toán (Tiền mặt, Chuyển khoản...).
 * @param maGiaoDich - Mã giao dịch ngân hàng / cổng thanh toán.
 * @returns Thông báo và mã thanh toán được sinh ra.
 */
export const thanhToanHoaDonCuaToi = async (
  maHoaDon: number,
  soTien: number,
  phuongThuc: string,
  maGiaoDich?: string
): Promise<{ message: string; maThanhToan: number }> => {
  const response = await axiosClient.post<{ message: string; maThanhToan: number }>(
    `/api/me/hoadon/${maHoaDon}/thanhtoan`,
    {
      soTien,
      phuongThuc,
      maGiaoDich,
    }
  )
  return response.data
}

/**
 * Tra cứu các biên bản vi phạm kỷ luật của sinh viên đang đăng nhập.
 * Liên kết: Endpoint GET /api/me/vipham (MeController.cs) -> sp_ViPham_TraCuu.
 * @returns Danh sách các biên bản vi phạm nếu có.
 */
export const layDanhSachViPhamCuaToi = async (): Promise<ViPhamSinhVienDto[]> => {
  const response = await axiosClient.get<ViPhamSinhVienDto[]>('/api/me/vipham')
  return response.data
}
