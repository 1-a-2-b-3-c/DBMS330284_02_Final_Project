import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Home,
  Users,
  Calendar,
  Building,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { layPhongDangOCuaToi, layDanhSachBanCungPhong } from '@/api/studentApi'
import type { PhongCuaToiDto } from '@/types/student.types'

/**
 * Màn hình Tra cứu Phòng của tôi & Bạn cùng phòng (Task A-09).
 * Giúp sinh viên nắm rõ thông tin phòng đang ở, thời hạn lưu trú và danh sách thành viên cùng phòng.
 * @returns Giao diện phòng ký túc xá cá nhân.
 */
export const StudentRoomPage: React.FC = () => {
  // Trạng thái dữ liệu phòng và bạn cùng phòng
  const [phongHienTai, setPhongHienTai] = useState<PhongCuaToiDto | null>(null)
  const [danhSachBanCungPhong, setDanhSachBanCungPhong] = useState<{ hoTen: string }[]>([])
  const [isLoadingDuLieu, setIsLoadingDuLieu] = useState<boolean>(true)

  /**
   * Tải thông tin phòng và bạn cùng phòng từ Backend (/api/me/phong, /api/me/phong/ban-cung-phong).
   */
  const taiDuLieuPhong = async (): Promise<void> => {
    setIsLoadingDuLieu(true)
    try {
      const [dsPhong, dsBan] = await Promise.all([
        layPhongDangOCuaToi(),
        layDanhSachBanCungPhong(),
      ])

      if (dsPhong.length > 0) {
        setPhongHienTai(dsPhong[0])
      } else {
        setPhongHienTai(null)
      }
      setDanhSachBanCungPhong(dsBan)
    } catch {
      toast.error('Không thể tải thông tin phòng lưu trú')
    } finally {
      setIsLoadingDuLieu(false)
    }
  }

  useEffect(() => {
    taiDuLieuPhong()
  }, [])

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang & Nút làm mới */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Phòng của tôi & Bạn cùng phòng
          </h2>
          <p className="text-sm text-slate-500">
            Chi tiết phòng ký túc xá đang cư trú và danh sách thành viên trong phòng
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={taiDuLieuPhong}
            disabled={isLoadingDuLieu}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingDuLieu ? 'animate-spin' : ''}`} />
            <span>Làm mới dữ liệu</span>
          </Button>
        </div>
      </div>

      {isLoadingDuLieu ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
            <p className="text-sm">Đang tải thông tin phòng ở...</p>
          </div>
        </div>
      ) : !phongHienTai ? (
        /* Trường hợp sinh viên chưa có phòng lưu trú */
        <Card className="border-dashed border-slate-300">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
              <Home className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Bạn hiện chưa được xếp phòng lưu trú
            </h3>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              Hệ thống chưa ghi nhận phân bổ phòng ký túc xá đang có hiệu lực của bạn. Hãy gửi đơn đăng ký nếu bạn có nhu cầu nội trú.
            </p>
            <div className="mt-5">
              <Button asChild className="bg-slate-900 text-white hover:bg-slate-800 text-xs gap-2">
                <Link to="/student/register-dorm">
                  <Send className="h-4 w-4" />
                  <span>Đăng ký phòng KTX ngay</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Trường hợp sinh viên đang có phòng lưu trú */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Cột 1 & 2: Thẻ thông tin phòng chi tiết */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-900 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Phòng Lưu trú Hiện tại
                    </span>
                    <div className="mt-1 flex items-baseline gap-3">
                      <h1 className="text-4xl font-extrabold tracking-tight">
                        Phòng {phongHienTai.soPhong}
                      </h1>
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium">
                        Đang lưu trú
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">
                      {phongHienTai.tenKhu}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3 text-white backdrop-blur">
                    <Building className="h-7 w-7" />
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5 space-y-1">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-slate-400" />
                      Mã phân phòng:
                    </span>
                    <p className="font-mono text-sm font-bold text-slate-900">
                      #{phongHienTai.maPhanPhong}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5 space-y-1">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Ngày bắt đầu ở:
                    </span>
                    <p className="text-sm font-semibold text-slate-900">
                      {phongHienTai.ngayBatDau}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5 space-y-1">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Ngày kết thúc dự kiến:
                    </span>
                    <p className="text-sm font-semibold text-slate-900">
                      {phongHienTai.ngayKetThuc || 'Theo thời hạn HĐ'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nội quy sinh hoạt phòng KTX */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Quy định sinh hoạt tại phòng</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 space-y-2">
                <p>• Giữ gìn vệ sinh chung, tắt các thiết bị điện khi ra khỏi phòng.</p>
                <p>• Giờ đóng cửa cổng ký túc xá: <strong>23:00 hàng ngày</strong>.</p>
                <p>• Tuyệt đối không nấu ăn bằng bếp gas, không đưa người ngoài vào ngủ qua đêm.</p>
                <p>• Phản ánh sự cố điện nước trực tiếp qua Văn phòng Ban Quản lý Tầng 1.</p>
              </CardContent>
            </Card>
          </div>

          {/* Cột 3: Danh sách các bạn cùng phòng */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-700" />
                    <span>Bạn Cùng Phòng</span>
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {danhSachBanCungPhong.length} thành viên
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Danh sách sinh viên đang cư trú cùng phòng với bạn
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-2">
                {danhSachBanCungPhong.length === 0 ? (
                  <div className="flex h-36 flex-col items-center justify-center text-center text-slate-400 p-4">
                    <Sparkles className="h-8 w-8 text-slate-300 mb-1" />
                    <p className="text-xs">Hiện tại chưa có bạn cùng phòng nào khác</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {danhSachBanCungPhong.map((ban, index) => {
                      const tenVietTat = ban.hoTen
                        .split(' ')
                        .pop()
                        ?.substring(0, 2)
                        .toUpperCase() || 'SV'

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-slate-200">
                              <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
                                {tenVietTat}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-xs font-semibold text-slate-900">{ban.hoTen}</p>
                              <p className="text-[11px] text-slate-400">Thành viên cùng phòng</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] text-slate-500">
                            Nội trú
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentRoomPage
