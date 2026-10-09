import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Home,
  Send,
  FileCheck,
  CreditCard,
  User,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface MucMenuSinhVien {
  tieuDe: string
  duongDan: string
  icon: React.ComponentType<{ className?: string }>
}

/**
 * Danh sách menu dành cho Cổng Dịch vụ Sinh viên (Student Portal).
 */
const DANH_SACH_MENU_SINH_VIEN: MucMenuSinhVien[] = [
  {
    tieuDe: 'Hồ sơ Cá nhân',
    duongDan: '/student/profile',
    icon: User,
  },
  {
    tieuDe: 'Phòng của tôi',
    duongDan: '/student/my-room',
    icon: Home,
  },
  {
    tieuDe: 'Đăng ký KTX',
    duongDan: '/student/register-dorm',
    icon: Send,
  },
  {
    tieuDe: 'Hợp đồng & Kỷ luật',
    duongDan: '/student/contracts',
    icon: FileCheck,
  },
  {
    tieuDe: 'Hóa đơn của tôi',
    duongDan: '/student/invoices',
    icon: CreditCard,
  },
]

/**
 * Khung layout Portal dành riêng cho Sinh viên (SV).
 * Thiết kế giao diện thân thiện, dạng Card và thanh điều hướng ngang trên Desktop, dễ thao tác trên Mobile.
 * @returns Khung giao diện Portal bao bọc nội dung các trang nghiệp vụ của sinh viên.
 */
export const StudentLayout: React.FC = () => {
  const { nguoiDung, dangXuat } = useAuth()
  const navigate = useNavigate()

  const xuLyDangXuat = (): void => {
    dangXuat()
    navigate('/login')
  }

  const kyTuDaiDien = nguoiDung?.tenDangNhap?.substring(0, 2).toUpperCase() || 'SV'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header chính của Cổng Sinh viên */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Tên Cổng */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">KTX Student Portal</span>
                <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-normal">
                  Ký túc xá Đại học
                </Badge>
              </div>
              <p className="text-xs text-slate-500">Cổng Dịch vụ & Lưu trú Sinh viên</p>
            </div>
          </div>

          {/* User info & Hành động */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-right">
              <div>
                <p className="text-sm font-semibold text-slate-900 leading-none">
                  {nguoiDung?.tenDangNhap || 'Sinh viên'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  MSSV: {nguoiDung?.maSV || nguoiDung?.maTaiKhoan || 'Chưa cập nhật'}
                </p>
              </div>
            </div>

            <Avatar className="h-9 w-9 border border-slate-200">
              <AvatarFallback className="bg-slate-900 text-xs font-semibold text-white">
                {kyTuDaiDien}
              </AvatarFallback>
            </Avatar>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={xuLyDangXuat}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </Button>
          </div>
        </div>

        {/* Thanh Điều hướng Tabs ngang */}
        <div className="border-t border-slate-100 bg-slate-50/50">
          <div className="mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-2 py-2">
              {DANH_SACH_MENU_SINH_VIEN.map((muc) => {
                const IconComponent = muc.icon
                return (
                  <NavLink
                    key={muc.duongDan}
                    to={muc.duongDan}
                    className={({ isActive }) =>
                      `flex items-center gap-2 whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                      }`
                    }
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{muc.tieuDe}</span>
                  </NavLink>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Vùng nội dung chính */}
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Footer chân trang */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <p>© 2026 Hệ thống Quản lý Ký túc xá - Phân hệ Sinh viên</p>
      </footer>
    </div>
  )
}

export default StudentLayout
