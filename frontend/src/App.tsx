import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Toaster } from '@/components/ui/sonner'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { AdminLayout } from '@/layouts/AdminLayout'
import { StudentLayout } from '@/layouts/StudentLayout'
import { LoginPage } from '@/pages/LoginPage'
import { dormRoutes } from '@/routes/dormRoutes'
import { studentRoutes } from '@/routes/studentRoutes'

/**
 * Component điều hướng thông minh tại trang gốc (/):
 * Tự động chuyển hướng về trang chủ theo vai trò của người dùng nếu đã đăng nhập.
 * @returns Component Navigate tương ứng với quyền hạn người dùng.
 */
const DieuHuongTrangChu: React.FC = () => {
  const { nguoiDung, isDaDangNhap, isLoadingAuth } = useAuth()

  if (isLoadingAuth) {
    return null
  }

  if (!isDaDangNhap) {
    return <Navigate to="/login" replace />
  }

  if (nguoiDung?.maVaiTro === 'SV') {
    return <Navigate to="/student/profile" replace />
  }

  return <Navigate to="/admin/phong" replace />
}

/**
 * Ứng dụng chính của hệ thống Quản lý Ký túc xá (QuanLyKTX).
 * Khởi tạo Context xác thực, Sonner Toaster và toàn bộ hệ thống định tuyến phân quyền.
 * @returns Toàn bộ cây thành phần của ứng dụng Frontend.
 */
export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Tuyến đường Đăng nhập */}
          <Route path="/login" element={<LoginPage />} />

          {/* Phân hệ Quản trị & Lưu trú KTX (Dành cho QLKTX và ADMIN) */}
          <Route element={<ProtectedRoute cacVaiTroChoPhep={['QLKTX', 'ADMIN']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              {dormRoutes.map((tuyenDuong) => (
                <Route
                  key={tuyenDuong.path || 'admin-index'}
                  index={tuyenDuong.index}
                  path={tuyenDuong.path}
                  element={tuyenDuong.element}
                />
              ))}
            </Route>
          </Route>

          {/* Cổng dịch vụ Sinh viên (Dành cho vai trò SV) */}
          <Route element={<ProtectedRoute cacVaiTroChoPhep={['SV']} />}>
            <Route path="/student" element={<StudentLayout />}>
              {studentRoutes.map((tuyenDuong) => (
                <Route
                  key={tuyenDuong.path || 'student-index'}
                  index={tuyenDuong.index}
                  path={tuyenDuong.path}
                  element={tuyenDuong.element}
                />
              ))}
            </Route>
          </Route>

          {/* Điều hướng mặc định khi truy cập đường dẫn gốc hoặc không tìm thấy */}
          <Route path="/" element={<DieuHuongTrangChu />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  )
}

export default App
