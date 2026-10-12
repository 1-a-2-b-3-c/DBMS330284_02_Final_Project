import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Lock, User, LogIn } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { axiosClient } from '@/api/axiosClient'
import type { DangNhapPhanHoiDto } from '@/types/auth.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'

/**
 * Trang Đăng nhập hệ thống Ký túc xá.
 * Hỗ trợ xác thực thực tế với Backend API và cung cấp chế độ Mock nhanh cho Developer.
 * @returns Giao diện form đăng nhập và lựa chọn vai trò thử nghiệm.
 */
export const LoginPage: React.FC = () => {
  const [tenDangNhap, setTenDangNhap] = useState<string>('')
  const [matKhau, setMatKhau] = useState<string>('')
  const [isLoadingDangNhap, setIsLoadingDangNhap] = useState<boolean>(false)

  const { dangNhapVoiDuLieu } = useAuth()
  const navigate = useNavigate()

  /**
   * Xử lý gửi thông tin đăng nhập đến Backend /api/auth/dang-nhap.
   * @param e - Sự kiện Submit của Form HTML.
   */
  const xuLyDangNhapThucTe = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!tenDangNhap.trim() || !matKhau.trim()) {
      toast.warning('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.')
      return
    }

    try {
      setIsLoadingDangNhap(true)
      const phanHoi = await axiosClient.post<DangNhapPhanHoiDto>('/api/auth/dang-nhap', {
        tenDangNhap: tenDangNhap.trim(),
        matKhau: matKhau.trim(),
      })

      const duLieuNguoiDung = phanHoi.data
      dangNhapVoiDuLieu(duLieuNguoiDung)
      toast.success(`Đăng nhập thành công! Xin chào ${duLieuNguoiDung.tenDangNhap}`)

      if (duLieuNguoiDung.maVaiTro === 'SV') {
        navigate('/student')
      } else {
        navigate('/admin')
      }
    } catch {
      // Lỗi đã được axiosClient interceptor hiển thị qua Toast
    } finally {
      setIsLoadingDangNhap(false)
    }
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-slate-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
            <Building2 className="h-7 w-7" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Hệ thống Quản lý KTX
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={xuLyDangNhapThucTe} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Tên đăng nhập</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Nhập tên đăng nhập hoặc MSSV"
                  className="pl-9"
                  value={tenDangNhap}
                  onChange={(e) => setTenDangNhap(e.target.value)}
                  disabled={isLoadingDangNhap}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={matKhau}
                  onChange={(e) => setMatKhau(e.target.value)}
                  disabled={isLoadingDangNhap}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
              disabled={isLoadingDangNhap}
            >
              {isLoadingDangNhap ? (
                'Đang xác thực...'
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Đăng nhập hệ thống
                </>
              )}
            </Button>
          </form>

        </CardContent>

        <CardFooter className="flex justify-center border-t border-slate-100 py-3 text-xs text-slate-400">
          Hệ thống Quản lý Ký túc xá Đại học
        </CardFooter>
      </Card>
    </div>
  )
}

export default LoginPage
