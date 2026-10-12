import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

interface ProtectedRouteProps {
  /**
   * Danh sách các mã vai trò được phép truy cập route này (ví dụ: ['QLKTX', 'ADMIN']).
   * Nếu không truyền, chỉ cần đã đăng nhập là được truy cập.
   */
  cacVaiTroChoPhep?: string[]
}

/**
 * Component bảo vệ các tuyến đường yêu cầu xác thực và phân quyền vai trò.
 * @param props - Thuộc tính cấu hình danh sách vai trò cho phép.
 * @returns Component Outlet nếu hợp lệ, màn hình loading khi đang kiểm tra, hoặc chuyển hướng/báo lỗi quyền.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ cacVaiTroChoPhep }) => {
  const { nguoiDung, isDaDangNhap, isLoadingAuth, dangXuat } = useAuth()

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
          <p className="text-sm font-medium">Đang xác thực phiên làm việc...</p>
        </div>
      </div>
    )
  }

  if (!isDaDangNhap) {
    return <Navigate to="/login" replace />
  }

  // Kiểm tra quyền hạn vai trò
  if (cacVaiTroChoPhep && cacVaiTroChoPhep.length > 0) {
    const isCoQuyenTruyCap = cacVaiTroChoPhep.includes(nguoiDung?.maVaiTro || '')

    if (!isCoQuyenTruyCap) {
      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
          <Card className="w-full max-w-md border-red-200 shadow-sm">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <CardTitle className="mt-4 text-xl font-bold text-slate-900">
                Từ chối quyền truy cập
              </CardTitle>
              <CardDescription className="text-slate-500">
                Tài khoản của bạn ({nguoiDung?.tenDangNhap} - {nguoiDung?.maVaiTro}) không có quyền truy cập vào chức năng này.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (nguoiDung?.maVaiTro === 'SV') {
                    window.location.href = '/student'
                  } else {
                    window.location.href = '/admin'
                  }
                }}
              >
                Về trang chủ của bạn
              </Button>
              <Button variant="ghost" onClick={dangXuat}>
                Đăng xuất tài khoản
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  return <Outlet />
}

export default ProtectedRoute
