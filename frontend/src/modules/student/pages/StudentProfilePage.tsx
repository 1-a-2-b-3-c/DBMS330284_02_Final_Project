import React, { useState, useEffect } from 'react'
import {
  User,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  ShieldCheck,
  CreditCard,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { layHoSoSinhVien, capNhatHoSoSinhVien } from '@/api/studentApi'
import type { SinhVienDto } from '@/types/dorm.types'

/**
 * Màn hình Hồ sơ Cá nhân Sinh viên (Task A-07).
 * Cho phép sinh viên tra cứu lý lịch trích ngang, thông tin học vụ và cập nhật SĐT, quê quán cá nhân.
 * @returns Giao diện hồ sơ cá nhân sinh viên.
 */
export const StudentProfilePage: React.FC = () => {
  // Trạng thái hồ sơ sinh viên
  const [hoSoSinhVien, setHoSoSinhVien] = useState<SinhVienDto | null>(null)
  const [isLoadingHoSo, setIsLoadingHoSo] = useState<boolean>(true)

  // Trạng thái biểu mẫu cập nhật
  const [soDienThoaiMoi, setSoDienThoaiMoi] = useState<string>('')
  const [queQuanMoi, setQueQuanMoi] = useState<string>('')
  const [isDangLuuThayDoi, setIsDangLuuThayDoi] = useState<boolean>(false)

  /**
   * Tải thông tin hồ sơ sinh viên từ Backend API (/api/me).
   */
  const taiDuLieuHoSo = async (): Promise<void> => {
    setIsLoadingHoSo(true)
    try {
      const ketQua = await layHoSoSinhVien()
      setHoSoSinhVien(ketQua)
      setSoDienThoaiMoi(ketQua.sdt || '')
      setQueQuanMoi(ketQua.queQuan || '')
    } catch {
      toast.error('Không thể tải thông tin hồ sơ cá nhân')
    } finally {
      setIsLoadingHoSo(false)
    }
  }

  useEffect(() => {
    taiDuLieuHoSo()
  }, [])

  /**
   * Xử lý lưu các thay đổi thông tin liên lạc của sinh viên.
   */
  const xuLyCapNhatThongTin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!soDienThoaiMoi.trim()) {
      toast.warning('Số điện thoại không được để trống')
      return
    }

    setIsDangLuuThayDoi(true)
    try {
      const phanHoi = await capNhatHoSoSinhVien(
        soDienThoaiMoi.trim(),
        queQuanMoi.trim() || undefined
      )
      toast.success(phanHoi.message || 'Cập nhật thông tin thành công!')
      taiDuLieuHoSo()
    } catch {
      // Toast hiển thị qua axios interceptor
    } finally {
      setIsDangLuuThayDoi(false)
    }
  }

  const kyTuDaiDien =
    hoSoSinhVien?.hoTen
      ?.split(' ')
      .pop()
      ?.substring(0, 2)
      .toUpperCase() || 'SV'

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Hồ sơ Cá nhân Sinh viên
          </h2>
          <p className="text-sm text-slate-500">
            Thông tin định danh học vụ và liên lạc cá nhân trong hệ thống ký túc xá
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={taiDuLieuHoSo}
            disabled={isLoadingHoSo}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingHoSo ? 'animate-spin' : ''}`} />
            <span>Làm mới dữ liệu</span>
          </Button>
        </div>
      </div>

      {isLoadingHoSo ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
            <p className="text-sm">Đang tải hồ sơ sinh viên...</p>
          </div>
        </div>
      ) : !hoSoSinhVien ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="flex h-48 flex-col items-center justify-center text-center">
            <AlertCircle className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">Chưa có thông tin hồ sơ</p>
            <p className="text-xs text-slate-400 mt-1">
              Vui lòng liên hệ Ban quản lý KTX để kích hoạt hồ sơ sinh viên của bạn
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Cột 1: Thẻ thông tin cá nhân tổng quan & chính sách */}
          <Card className="border-slate-200 shadow-sm lg:col-span-1">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 shadow-inner">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-slate-900 text-lg font-bold text-white">
                    {kyTuDaiDien}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-lg font-bold text-slate-900">
                {hoSoSinhVien.hoTen}
              </CardTitle>
              <CardDescription className="text-xs">
                Mã SV: <strong className="font-mono text-slate-800">{hoSoSinhVien.maSV}</strong>
              </CardDescription>

              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                <Badge variant="outline" className="text-xs">
                  {hoSoSinhVien.gioiTinh}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Sinh viên năm {hoSoSinhVien.namHoc}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 text-xs space-y-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                  Khoa / Viện:
                </span>
                <span className="font-medium text-slate-800 text-right">
                  {hoSoSinhVien.khoa || 'Chưa cập nhật'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Ngày sinh:
                </span>
                <span className="font-medium text-slate-800">{hoSoSinhVien.ngaySinh}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                  Số CCCD:
                </span>
                <span className="font-mono font-medium text-slate-800">
                  {hoSoSinhVien.cccd || 'Chưa có'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                  Diện ưu tiên:
                </span>
                <span>
                  {hoSoSinhVien.dienUuTien ? (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-[11px]">
                      {hoSoSinhVien.dienUuTien}
                    </Badge>
                  ) : (
                    <span className="text-slate-400">Không có</span>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Cột 2 & 3: Biểu mẫu cập nhật thông tin liên lạc */}
          <Card className="border-slate-200 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Thông tin Liên lạc & Quê quán
              </CardTitle>
              <CardDescription>
                Theo quy định, sinh viên có thể chủ động cập nhật số điện thoại và địa chỉ quê quán khi có thay đổi.
              </CardDescription>
            </CardHeader>

            <form onSubmit={xuLyCapNhatThongTin}>
              <CardContent className="space-y-4">
                {/* Thông báo chính sách */}
                <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3.5 text-xs text-blue-800 flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-900">Lưu ý về dữ liệu học vụ:</p>
                    <p className="mt-0.5 text-blue-700">
                      Mã số sinh viên, họ tên, ngày sinh, CCCD và diện ưu tiên được đồng bộ trực tiếp từ phòng Đào tạo. Nếu có sai sót, vui lòng liên hệ văn phòng Ban quản lý KTX để điều chỉnh.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      Số điện thoại cá nhân <span className="text-red-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="0912345678"
                      value={soDienThoaiMoi}
                      onChange={(e) => setSoDienThoaiMoi(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Dùng để nhận SMS/thông báo hóa đơn và lịch nhắc kiểm tra phòng
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      Quê quán / Nơi cư trú thường trú
                    </label>
                    <Input
                      placeholder="Tỉnh/Thành phố hoặc địa chỉ thường trú"
                      value={queQuanMoi}
                      onChange={(e) => setQueQuanMoi(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Địa chỉ ghi trên CCCD của sinh viên
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t border-slate-100 pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={isDangLuuThayDoi}
                  className="bg-slate-900 text-white hover:bg-slate-800 text-xs gap-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{isDangLuuThayDoi ? 'Đang cập nhật...' : 'Lưu thông tin liên lạc'}</span>
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

export default StudentProfilePage
