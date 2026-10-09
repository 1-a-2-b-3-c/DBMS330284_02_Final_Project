import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'

/**
 * Địa chỉ API cơ sở lấy từ biến môi trường hoặc cổng mặc định của Backend .NET.
 */
const duongDanApiCoSo: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5272'

/**
 * Khóa định danh để lưu trữ JWT token trong LocalStorage của trình duyệt.
 */
export const KHOA_LUU_TRU_TOKEN = 'quanlyktx_access_token'

/**
 * Đối tượng cấu hình Axios dùng chung cho toàn bộ dự án Frontend.
 * Đã cấu hình timeout và headers mặc định dạng JSON.
 */
export const axiosClient: AxiosInstance = axios.create({
  baseURL: duongDanApiCoSo,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

/**
 * Can thiệp trước khi gửi request để đính kèm JWT token vào HTTP Header.
 * @param cauHinhRequest - Cấu hình HTTP request chuẩn bị được gửi đi.
 * @returns Cấu hình request sau khi đã thêm header Authorization (nếu có token).
 */
axiosClient.interceptors.request.use(
  (cauHinhRequest: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const chuoiTokenHienTai = localStorage.getItem(KHOA_LUU_TRU_TOKEN)
    if (chuoiTokenHienTai && cauHinhRequest.headers) {
      cauHinhRequest.headers.Authorization = `Bearer ${chuoiTokenHienTai}`
    }
    return cauHinhRequest
  },
  (loiRequest) => {
    return Promise.reject(loiRequest)
  }
)

/**
 * Xử lý response trả về từ Backend:
 * - Trả về dữ liệu trực tiếp nếu thành công.
 * - Bắt lỗi có cấu trúc { message: "..." } và hiển thị cảnh báo Sonner Toast nếu thất bại.
 * @param phanHoiThanhCong - Đối tượng response nhận về từ Backend.
 * @returns Dữ liệu response thô hoặc lỗi được bắt và đóng gói.
 */
axiosClient.interceptors.response.use(
  (phanHoiThanhCong: AxiosResponse): AxiosResponse => {
    return phanHoiThanhCong
  },
  (loiPhanHoi) => {
    const thongTinLoi = loiPhanHoi?.response?.data
    const maTrangThaiHttp = loiPhanHoi?.response?.status

    let thongDiepLoi: string = 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'

    if (thongTinLoi && typeof thongTinLoi.message === 'string' && thongTinLoi.message.trim().length > 0) {
      thongDiepLoi = thongTinLoi.message
    } else if (maTrangThaiHttp === 401) {
      thongDiepLoi = 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.'
    } else if (maTrangThaiHttp === 403) {
      thongDiepLoi = 'Bạn không có quyền thực hiện thao tác này.'
    } else if (maTrangThaiHttp === 404) {
      thongDiepLoi = 'Không tìm thấy dữ liệu yêu cầu.'
    } else if (maTrangThaiHttp === 500) {
      thongDiepLoi = 'Lỗi hệ thống máy chủ. Vui lòng liên hệ quản trị viên.'
    }

    // Hiển thị thông báo Toast cảnh báo người dùng
    toast.error(thongDiepLoi)

    if (maTrangThaiHttp === 401) {
      // Xóa token hết hạn và phát sự kiện hết phiên
      localStorage.removeItem(KHOA_LUU_TRU_TOKEN)
      window.dispatchEvent(new Event('auth:het_han_phien'))
    }

    return Promise.reject(loiPhanHoi)
  }
)

export default axiosClient
