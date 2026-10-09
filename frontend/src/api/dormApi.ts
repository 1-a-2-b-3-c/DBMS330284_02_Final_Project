import { axiosClient } from './axiosClient'
import type {
  PhongDto,
  SinhVienTrongPhongDto,
  SinhVienDto,
  DanhMucSinhVienDto,
  BoLocSinhVienDto,
  ThemSinhVienRequest,
  ThemSinhVienResponse,
  CapNhatSinhVienRequest,
  DangKyDto,
  DuyetDonDangKyRequest,
  XepPhongRequest,
  KetQuaXepPhongResponse,
  HopDongDto,
  BoLocHopDongDto,
} from '@/types/dorm.types'

/**
 * Lấy danh sách phòng ký túc xá kèm bộ lọc theo khu, trạng thái và số chỗ trống.
 * Liên kết: Endpoint GET /api/phong (PhongController.cs) -> sp_Phong_TraCuu.
 * @param maKhu - Mã khu KTX cần lọc (ví dụ: 'A', 'B'), để undefined nếu lấy tất cả.
 * @param trangThai - Trạng thái phòng ('Đang hoạt động', 'Bảo trì', v.v.), để undefined nếu lấy tất cả.
 * @param isChiLayConCho - Nếu true, chỉ trả về các phòng còn chỗ trống (soChoTrong > 0).
 * @returns Danh sách phòng ký túc xá thỏa mãn điều kiện lọc.
 */
export const layDanhSachPhong = async (
  maKhu?: string,
  trangThai?: string,
  isChiLayConCho?: boolean
): Promise<PhongDto[]> => {
  const queryParams: Record<string, string | boolean> = {}
  if (maKhu && maKhu.trim() !== '') {
    queryParams.maKhu = maKhu.trim()
  }
  if (trangThai && trangThai.trim() !== '') {
    queryParams.trangThai = trangThai.trim()
  }
  if (typeof isChiLayConCho === 'boolean') {
    queryParams.chiConCho = isChiLayConCho
  }

  const phanHoi = await axiosClient.get<PhongDto[]>('/api/phong', { params: queryParams })
  return phanHoi.data
}

/**
 * Lấy danh sách sinh viên hiện đang cư trú trong một phòng cụ thể.
 * Liên kết: Endpoint GET /api/phong/{maPhong}/sinhvien (PhongController.cs) -> sp_Phong_XemSinhVien.
 * @param maPhong - Mã số định danh của phòng cần tra cứu.
 * @returns Danh sách sinh viên (mã và họ tên) đang ở trong phòng được chỉ định.
 */
export const laySinhVienTheoPhong = async (
  maPhong: number
): Promise<SinhVienTrongPhongDto[]> => {
  const phanHoi = await axiosClient.get<SinhVienTrongPhongDto[]>(
    `/api/phong/${maPhong}/sinhvien`
  )
  return phanHoi.data
}

/**
 * Tra cứu danh sách hồ sơ sinh viên trong hệ thống KTX theo nhiều tiêu chí.
 * Liên kết: Endpoint GET /api/ktx/sinhvien (QuanLySinhVienController.cs) -> sp_SinhVien_TraCuu.
 * @param boLoc - Bộ lọc tìm kiếm gồm maSV, hoTen, khoa, namHoc.
 * @returns Danh sách hồ sơ sinh viên tìm được.
 */
export const layDanhSachSinhVien = async (
  boLoc?: BoLocSinhVienDto
): Promise<SinhVienDto[]> => {
  const queryParams: Record<string, string | number> = {}
  if (boLoc?.maSV && boLoc.maSV.trim() !== '') {
    queryParams.maSV = boLoc.maSV.trim()
  }
  if (boLoc?.hoTen && boLoc.hoTen.trim() !== '') {
    queryParams.hoTen = boLoc.hoTen.trim()
  }
  if (boLoc?.khoa && boLoc.khoa.trim() !== '') {
    queryParams.khoa = boLoc.khoa.trim()
  }
  if (boLoc?.namHoc && boLoc.namHoc > 0) {
    queryParams.namHoc = boLoc.namHoc
  }

  const phanHoi = await axiosClient.get<SinhVienDto[]>('/api/ktx/sinhvien', {
    params: queryParams,
  })
  return phanHoi.data
}

/**
 * Lấy danh mục giá trị chuẩn cho các trường dropdown sinh viên (giới tính, diện ưu tiên).
 * Liên kết: Endpoint GET /api/ktx/sinhvien/danh-muc (QuanLySinhVienController.cs).
 * @returns Danh mục các tùy chọn hợp lệ khớp với Database Check Constraints.
 */
export const layDanhMucSinhVien = async (): Promise<DanhMucSinhVienDto> => {
  const phanHoi = await axiosClient.get<DanhMucSinhVienDto>('/api/ktx/sinhvien/danh-muc')
  return phanHoi.data
}

/**
 * Lấy thông tin chi tiết một sinh viên theo mã số sinh viên.
 * Liên kết: Endpoint GET /api/ktx/sinhvien/{maSV} (QuanLySinhVienController.cs).
 * @param maSV - Mã số sinh viên cần tra cứu.
 * @returns Thông tin hồ sơ sinh viên.
 */
export const layChiTietSinhVien = async (maSV: string): Promise<SinhVienDto> => {
  const phanHoi = await axiosClient.get<SinhVienDto>(`/api/ktx/sinhvien/${maSV}`)
  return phanHoi.data
}

/**
 * Thêm mới một hồ sơ sinh viên vào hệ thống và tự động tạo tài khoản KTX.
 * Liên kết: Endpoint POST /api/ktx/sinhvien (QuanLySinhVienController.cs) -> sp_SinhVien_Them.
 * Mật khẩu ban đầu mặc định được cấp bằng chính mã sinh viên.
 * @param duLieuSinhVien - Dữ liệu biểu mẫu thêm sinh viên mới.
 * @returns Thông tin tài khoản được cấp và thông báo từ hệ thống.
 */
export const themSinhVienMoi = async (
  duLieuSinhVien: ThemSinhVienRequest
): Promise<ThemSinhVienResponse> => {
  const phanHoi = await axiosClient.post<ThemSinhVienResponse>(
    '/api/ktx/sinhvien',
    duLieuSinhVien
  )
  return phanHoi.data
}

/**
 * Cập nhật thông tin hồ sơ của sinh viên trong KTX.
 * Liên kết: Endpoint PUT /api/ktx/sinhvien/{maSV} (QuanLySinhVienController.cs) -> sp_SinhVien_CapNhat.
 * @param maSV - Mã số sinh viên cần cập nhật.
 * @param duLieuCapNhat - Các trường thông tin cần thay đổi (SĐT, Quê quán, Khoa, Năm học, Diện ưu tiên).
 * @returns Thông báo kết quả từ máy chủ.
 */
export const capNhatSinhVien = async (
  maSV: string,
  duLieuCapNhat: CapNhatSinhVienRequest
): Promise<{ message: string }> => {
  const phanHoi = await axiosClient.put<{ message: string }>(
    `/api/ktx/sinhvien/${maSV}`,
    duLieuCapNhat
  )
  return phanHoi.data
}

/**
 * Lấy toàn bộ danh sách đơn đăng ký lưu trú KTX đang chờ duyệt hoặc đã xử lý.
 * Liên kết: Endpoint GET /api/ktx/dangky (QuanLyDangKyController.cs) -> sp_DangKyKTX_TraCuu.
 * @param maSV - Lọc theo mã sinh viên nộp đơn.
 * @param trangThai - Trạng thái lọc ('CHO_DUYET', 'DA_DUYET', 'TU_CHOI').
 * @returns Danh sách các đơn đăng ký lưu trú.
 */
export const layDanhSachDonDangKy = async (
  maSV?: string,
  trangThai?: string
): Promise<DangKyDto[]> => {
  const queryParams: Record<string, string> = {}
  if (maSV && maSV.trim() !== '') {
    queryParams.maSV = maSV.trim()
  }
  if (trangThai && trangThai.trim() !== '') {
    queryParams.trangThai = trangThai.trim()
  }

  const phanHoi = await axiosClient.get<DangKyDto[]>('/api/ktx/dangky', {
    params: queryParams,
  })
  return phanHoi.data
}

/**
 * Phê duyệt hoặc từ chối đơn đăng ký KTX của sinh viên.
 * Liên kết: Endpoint PATCH /api/ktx/dangky/{maDangKy}/duyet (QuanLyDangKyController.cs).
 * @param maDangKy - Mã số đơn đăng ký cần xét duyệt.
 * @param yeuCauDuyet - Trạng thái duyệt (chấp nhận/từ chối) và lý do ghi chú.
 * @returns Thông báo kết quả từ máy chủ.
 */
export const duyetDonDangKy = async (
  maDangKy: number,
  yeuCauDuyet: DuyetDonDangKyRequest
): Promise<{ message: string; trangThai: string }> => {
  const phanHoi = await axiosClient.patch<{ message: string; trangThai: string }>(
    `/api/ktx/dangky/${maDangKy}/duyet`,
    yeuCauDuyet
  )
  return phanHoi.data
}

/**
 * Xếp phòng lưu trú cho đơn đăng ký đã được phê duyệt.
 * Liên kết: Endpoint POST /api/ktx/dangky/{maDangKy}/xep-phong (QuanLyDangKyController.cs).
 * @param maDangKy - Mã đơn đăng ký đã được chấp thuận.
 * @param yeuCauXepPhong - Thông tin xếp phòng gồm mã phòng, ngày bắt đầu, ngày kết thúc và điều khoản.
 * @returns Kết quả phân phòng và hợp đồng mới được tạo.
 */
export const xepPhongLuuTru = async (
  maDangKy: number,
  yeuCauXepPhong: XepPhongRequest
): Promise<KetQuaXepPhongResponse> => {
  const phanHoi = await axiosClient.post<KetQuaXepPhongResponse>(
    `/api/ktx/dangky/${maDangKy}/xep-phong`,
    yeuCauXepPhong
  )
  return phanHoi.data
}

/**
 * Lấy danh sách hợp đồng lưu trú trong KTX.
 * Liên kết: Endpoint GET /api/ktx/hopdong (QuanLyHopDongController.cs) -> sp_HopDong_TraCuu.
 * @param boLoc - Bộ lọc tìm kiếm theo mã SV, trạng thái ('Có hiệu lực', 'Đã thanh lý') hoặc sắp hết hạn.
 * @returns Danh sách hợp đồng lưu trú.
 */
export const layDanhSachHopDong = async (
  boLoc?: BoLocHopDongDto
): Promise<HopDongDto[]> => {
  const queryParams: Record<string, string | number> = {}
  if (boLoc?.maSV && boLoc.maSV.trim() !== '') {
    queryParams.maSV = boLoc.maSV.trim()
  }
  if (boLoc?.trangThai && boLoc.trangThai.trim() !== '') {
    queryParams.trangThai = boLoc.trangThai.trim()
  }
  if (typeof boLoc?.sapHetHanTrongNgay === 'number' && boLoc.sapHetHanTrongNgay >= 0) {
    queryParams.sapHetHanTrongNgay = boLoc.sapHetHanTrongNgay
  }

  const phanHoi = await axiosClient.get<HopDongDto[]>('/api/ktx/hopdong', {
    params: queryParams,
  })
  return phanHoi.data
}

/**
 * Kết thúc lưu trú và thanh lý hợp đồng của sinh viên (khi trả phòng).
 * Liên kết: Endpoint PATCH /api/ktx/hopdong/phan-phong/{maPhanPhong}/ket-thuc (QuanLyHopDongController.cs).
 * @param maPhanPhong - Mã phân phòng của sinh viên cần kết thúc.
 * @returns Thông báo kết quả từ máy chủ.
 */
export const ketThucLuuTru = async (
  maPhanPhong: number
): Promise<{ message: string }> => {
  const phanHoi = await axiosClient.patch<{ message: string }>(
    `/api/ktx/hopdong/phan-phong/${maPhanPhong}/ket-thuc`
  )
  return phanHoi.data
}
