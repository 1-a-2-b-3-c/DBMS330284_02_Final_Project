import React, { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BedDouble,
  Users,
  ClipboardCheck,
  FileText,
  Receipt,
  AlertTriangle,
  Shield,
  Menu,
  X,
  LogOut,
  Bell,
  Building2,
  ChevronDown,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MucMenuDieuHuong {
  tieuDe: string
  duongDan: string
  icon: React.ComponentType<{ className?: string }>
  nhom: 'luu-tru' | 'tai-chinh' | 'he-thong'
}

/**
 * Danh sách menu dành cho Ban quản lý Ký túc xá và Quản trị viên.
 */
const DANH_SACH_MENU_ADMIN: MucMenuDieuHuong[] = [
  // Nhóm Quản lý Lưu trú KTX
  {
    tieuDe: 'Sơ đồ & Phòng KTX',
    duongDan: '/admin/phong',
    icon: BedDouble,
    nhom: 'luu-tru',
  },
  {
    tieuDe: 'Hồ sơ Sinh viên',
    duongDan: '/admin/sinh-vien',
    icon: Users,
    nhom: 'luu-tru',
  },
  {
    tieuDe: 'Xét duyệt Đăng ký',
    duongDan: '/admin/dang-ky',
    icon: ClipboardCheck,
    nhom: 'luu-tru',
  },
  {
    tieuDe: 'Hợp đồng Lưu trú',
    duongDan: '/admin/hop-dong',
    icon: FileText,
    nhom: 'luu-tru',
  },
  // Nhóm Tài chính & Kỷ luật
  {
    tieuDe: 'Hóa đơn & Thu phí',
    duongDan: '/admin/tai-chinh',
    icon: Receipt,
    nhom: 'tai-chinh',
  },
  {
    tieuDe: 'Biên bản Vi phạm',
    duongDan: '/admin/vi-pham',
    icon: AlertTriangle,
    nhom: 'tai-chinh',
  },
  // Nhóm Hệ thống & Phân quyền
  {
    tieuDe: 'Tài khoản & Phân quyền',
    duongDan: '/admin/tai-khoan',
    icon: Shield,
    nhom: 'he-thong',
  },
]

/**
 * Khung layout chuẩn hóa dành cho Quản lý KTX (QLKTX) và Quản trị viên (ADMIN).
 * Thiết kế chuẩn shadcn/ui Dashboard với Sidebar collapsible và Topbar điều khiển.
 * @returns Giao diện layout bao bọc vùng hiển thị nội dung chính Outlet.
 */
export const AdminLayout: React.FC = () => {
  const { nguoiDung, dangXuat } = useAuth()
  const navigate = useNavigate()
  const [isMoSidebarMobile, setIsMoSidebarMobile] = useState<boolean>(false)

  const xuLyDangXuat = (): void => {
    dangXuat()
    navigate('/login')
  }

  const kyTuDaiDien = nguoiDung?.tenDangNhap?.substring(0, 2).toUpperCase() || 'QL'

  return (
    <div className="flex min-h-screen w-full bg-slate-50/50">
      {/* Sidebar trên Desktop */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        {/* Logo & Tên Hệ thống */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-slate-900">QuanLyKTX</h1>
            <p className="text-xs text-slate-500">Ban Quản lý Ký túc xá</p>
          </div>
        </div>

        {/* Danh sách Menu Sidebar */}
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 space-y-6">
          {/* Nhóm Lưu trú */}
          <div>
            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Quản lý Lưu trú
            </div>
            <nav className="flex flex-col gap-1">
              {DANH_SACH_MENU_ADMIN.filter((m) => m.nhom === 'luu-tru').map((muc) => {
                const IconComponent = muc.icon
                return (
                  <NavLink
                    key={muc.duongDan}
                    to={muc.duongDan}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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

          {/* Nhóm Tài chính & Kỷ luật */}
          <div>
            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tài chính & Kỷ luật
            </div>
            <nav className="flex flex-col gap-1">
              {DANH_SACH_MENU_ADMIN.filter((m) => m.nhom === 'tai-chinh').map((muc) => {
                const IconComponent = muc.icon
                return (
                  <NavLink
                    key={muc.duongDan}
                    to={muc.duongDan}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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

          {/* Nhóm Quản trị Hệ thống */}
          <div>
            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hệ thống & Phân quyền
            </div>
            <nav className="flex flex-col gap-1">
              {DANH_SACH_MENU_ADMIN.filter((m) => m.nhom === 'he-thong').map((muc) => {
                const IconComponent = muc.icon
                return (
                  <NavLink
                    key={muc.duongDan}
                    to={muc.duongDan}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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

      </aside>

      {/* Vùng chính gồm Topbar và Content cuộn độc lập */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar chuẩn shadcn */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Nút bật/tắt sidebar trên thiết bị di động */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMoSidebarMobile(!isMoSidebarMobile)}
            >
              {isMoSidebarMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

          </div>

          {/* Phía bên phải Topbar: Thông báo và User Dropdown */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative text-slate-600">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-slate-100 focus:outline-none">
                  <Avatar className="h-8 w-8 border border-slate-200">
                    <AvatarFallback className="bg-slate-900 text-xs font-semibold text-white">
                      {kyTuDaiDien}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-medium text-slate-900 leading-none">
                      {nguoiDung?.tenDangNhap || 'Cán bộ QLKTX'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {nguoiDung?.tenVaiTro || nguoiDung?.maVaiTro || 'Quản lý KTX'}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Tài khoản hiện tại</DropdownMenuLabel>
                <div className="px-2 py-1 text-xs text-slate-500">
                  Mã TK: {nguoiDung?.maTaiKhoan || 'N/A'}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/admin/tai-khoan')}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  <span>Thông tin tài khoản</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={xuLyDangXuat}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Sidebar dạng Mobile Drawer khi mở */}
        {isMoSidebarMobile && (
          <div
            className="fixed inset-0 z-50 bg-black/40 md:hidden"
            onClick={() => setIsMoSidebarMobile(false)}
          >
            <div
              className="h-full w-64 bg-white p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="font-bold text-slate-900">QuanLyKTX</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMoSidebarMobile(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="mt-4 flex flex-col gap-1">
                {DANH_SACH_MENU_ADMIN.map((muc) => {
                  const IconComponent = muc.icon
                  return (
                    <Link
                      key={muc.duongDan}
                      to={muc.duongDan}
                      onClick={() => setIsMoSidebarMobile(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{muc.tieuDe}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Vùng nội dung cuộn độc lập */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
