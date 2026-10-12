import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { KHOA_LUU_TRU_TOKEN } from '@/api/axiosClient'
import type { AuthContextType, NguoiDungHienTai, DangNhapPhanHoiDto, MaVaiTroNguoiDung } from '@/types/auth.types'

const KHOA_LUU_TRU_NGUOIDUNG = 'quanlyktx_thongtin_nguoidung'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Giải mã phần payload của JWT token để trích xuất thông tin người dùng nếu cần.
 * @param tokenJwt - Chuỗi JSON Web Token.
 * @returns Object chứa các claims hoặc null nếu giải mã thất bại.
 */
function giaiMaPayloadJwt(tokenJwt: string): Record<string, unknown> | null {
  try {
    const cacPhanCuaToken = tokenJwt.split('.')
    if (cacPhanCuaToken.length !== 3) {
      return null
    }
    const chuoiPayloadGiaiMa = atob(cacPhanCuaToken[1].replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(chuoiPayloadGiaiMa)))
  } catch {
    return null
  }
}

/**
 * Provider quản lý trạng thái xác thực, phiên làm việc và phân quyền trong toàn ứng dụng.
 * @param children - Các component con cần quyền truy cập trạng thái xác thực.
 * @returns Component React Provider bao bọc cây thư mục giao diện.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [nguoiDung, setNguoiDung] = useState<NguoiDungHienTai | null>(null)
  const [chuoiToken, setChuoiToken] = useState<string | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true)

  // Khôi phục trạng thái đăng nhập từ LocalStorage khi khởi chạy ứng dụng
  useEffect(() => {
    try {
      const tokenLuuTru = localStorage.getItem(KHOA_LUU_TRU_TOKEN)
      const nguoiDungLuuTru = localStorage.getItem(KHOA_LUU_TRU_NGUOIDUNG)

      if (tokenLuuTru && nguoiDungLuuTru) {
        setChuoiToken(tokenLuuTru)
        setNguoiDung(JSON.parse(nguoiDungLuuTru) as NguoiDungHienTai)
      } else if (tokenLuuTru) {
        // Dự phòng: Có token nhưng mất cache người dùng, tự động phân tích payload JWT
        const claims = giaiMaPayloadJwt(tokenLuuTru)
        if (claims && claims.maTaiKhoan && claims.maVaiTro) {
          const nguoiDungKhoiPhuc: NguoiDungHienTai = {
            maTaiKhoan: String(claims.maTaiKhoan),
            tenDangNhap: String(claims.tenDangNhap || claims.maTaiKhoan),
            maVaiTro: String(claims.maVaiTro),
            tenVaiTro: claims.tenVaiTro ? String(claims.tenVaiTro) : undefined,
            maSV: claims.maSV ? String(claims.maSV) : null,
          }
          setChuoiToken(tokenLuuTru)
          setNguoiDung(nguoiDungKhoiPhuc)
          localStorage.setItem(KHOA_LUU_TRU_NGUOIDUNG, JSON.stringify(nguoiDungKhoiPhuc))
        }
      }
    } catch {
      localStorage.removeItem(KHOA_LUU_TRU_TOKEN)
      localStorage.removeItem(KHOA_LUU_TRU_NGUOIDUNG)
    } finally {
      setIsLoadingAuth(false)
    }
  }, [])

  /**
   * Đăng xuất người dùng hiện tại và xóa sạch dữ liệu phiên lưu trữ.
   */
  const dangXuat = useCallback((): void => {
    localStorage.removeItem(KHOA_LUU_TRU_TOKEN)
    localStorage.removeItem(KHOA_LUU_TRU_NGUOIDUNG)
    setChuoiToken(null)
    setNguoiDung(null)
  }, [])

  // Lắng nghe sự kiện hết hạn phiên từ axios interceptor
  useEffect(() => {
    const xuLyHetHanPhien = () => {
      dangXuat()
    }
    window.addEventListener('auth:het_han_phien', xuLyHetHanPhien)
    return () => {
      window.removeEventListener('auth:het_han_phien', xuLyHetHanPhien)
    }
  }, [dangXuat])

  /**
   * Cập nhật thông tin phiên sau khi đăng nhập thành công qua Backend API.
   * @param duLieuPhanHoi - Dữ liệu trả về từ API /api/auth/dang-nhap.
   */
  const dangNhapVoiDuLieu = useCallback((duLieuPhanHoi: DangNhapPhanHoiDto): void => {
    const thongTinNguoiDung: NguoiDungHienTai = {
      maTaiKhoan: duLieuPhanHoi.maTaiKhoan,
      tenDangNhap: duLieuPhanHoi.tenDangNhap,
      maVaiTro: duLieuPhanHoi.maVaiTro,
      tenVaiTro: duLieuPhanHoi.tenVaiTro,
      maSV: duLieuPhanHoi.maSV,
    }

    localStorage.setItem(KHOA_LUU_TRU_TOKEN, duLieuPhanHoi.token)
    localStorage.setItem(KHOA_LUU_TRU_NGUOIDUNG, JSON.stringify(thongTinNguoiDung))

    setChuoiToken(duLieuPhanHoi.token)
    setNguoiDung(thongTinNguoiDung)
  }, [])

  /**
   * Thiết lập phiên làm việc giả lập để hỗ trợ dev độc lập không phụ thuộc màn đăng nhập.
   * @param maVaiTro - Mã vai trò muốn giả lập ('QLKTX' | 'SV' | 'ADMIN').
   */
  const thietLapTaiKhoanGiaLap = useCallback((maVaiTro: MaVaiTroNguoiDung): void => {
    const tenVaiTroMacDinh =
      maVaiTro === 'QLKTX'
        ? 'Quản lý KTX'
        : maVaiTro === 'SV'
        ? 'Sinh viên'
        : 'Quản trị viên'

    const taiKhoanGiaLap: NguoiDungHienTai = {
      maTaiKhoan: `MOCK_${maVaiTro}_01`,
      tenDangNhap: `mock_${maVaiTro.toLowerCase()}`,
      maVaiTro: maVaiTro,
      tenVaiTro: tenVaiTroMacDinh,
      maSV: maVaiTro === 'SV' ? 'SV00000001' : null,
    }

    // Token giả lập định dạng JWT hợp lệ cho dev frontend
    const tokenGiaLap = `mock-token-${maVaiTro.toLowerCase()}-session`

    localStorage.setItem(KHOA_LUU_TRU_TOKEN, tokenGiaLap)
    localStorage.setItem(KHOA_LUU_TRU_NGUOIDUNG, JSON.stringify(taiKhoanGiaLap))

    setChuoiToken(tokenGiaLap)
    setNguoiDung(taiKhoanGiaLap)
  }, [])

  /**
   * Kiểm tra người dùng hiện tại có chứa vai trò yêu cầu hay không.
   * @param maVaiTroYeuCau - Mã vai trò đơn lẻ hoặc mảng các mã vai trò được cấp quyền.
   * @returns True nếu có quyền, ngược lại là false.
   */
  const hasRole = useCallback(
    (maVaiTroYeuCau: string | string[]): boolean => {
      if (!nguoiDung) {
        return false
      }
      if (Array.isArray(maVaiTroYeuCau)) {
        return maVaiTroYeuCau.includes(nguoiDung.maVaiTro)
      }
      return nguoiDung.maVaiTro === maVaiTroYeuCau
    },
    [nguoiDung]
  )

  const isDaDangNhap = Boolean(chuoiToken && nguoiDung)

  return (
    <AuthContext.Provider
      value={{
        nguoiDung,
        chuoiToken,
        isLoadingAuth,
        isDaDangNhap,
        hasRole,
        dangNhapVoiDuLieu,
        dangXuat,
        thietLapTaiKhoanGiaLap,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Custom Hook truy cập trạng thái xác thực trong các component React.
 * @returns Đối tượng AuthContextType đầy đủ phương thức và trạng thái.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider')
  }
  return context
}
