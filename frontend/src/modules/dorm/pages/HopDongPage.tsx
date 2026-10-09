import React, { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Calendar,
  Building,
  User,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { khopChuoiTimKiem } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { layDanhSachHopDong, ketThucLuuTru } from '@/api/dormApi'
import type { HopDongDto } from '@/types/dorm.types'

/**
 * Màn hình Quản lý Hợp đồng Lưu trú KTX (Task A-06).
 * Cán bộ QLKTX theo dõi thời hạn hợp đồng, các trường hợp sắp hết hạn và xử lý kết thúc lưu trú (trả phòng).
 * @returns Giao diện quản lý hợp đồng lưu trú.
 */
export const HopDongPage: React.FC = () => {
  // Trạng thái danh sách hợp đồng
  const [danhSachHopDong, setDanhSachHopDong] = useState<HopDongDto[]>([])
  const [isLoadingHopDong, setIsLoadingHopDong] = useState<boolean>(true)

  // Bộ lọc
  const [tuKhoaMaSV, setTuKhoaMaSV] = useState<string>('')
  const [trangThaiLoc, setTrangThaiLoc] = useState<string>('TAT_CA')
  const [isLocSapHetHan, setIsLocSapHetHan] = useState<boolean>(false)

  // Trạng thái Dialog Xác nhận Kết thúc lưu trú (Thanh lý hợp đồng)
  const [hopDongDangKetThuc, setHopDongDangKetThuc] = useState<HopDongDto | null>(null)
  const [isMoDialogKetThuc, setIsMoDialogKetThuc] = useState<boolean>(false)
  const [isDangXuLyKetThuc, setIsDangXuLyKetThuc] = useState<boolean>(false)

  // Trạng thái Dialog Xem chi tiết hợp đồng
  const [hopDongXemChiTiet, setHopDongXemChiTiet] = useState<HopDongDto | null>(null)
  const [isMoDialogChiTiet, setIsMoDialogChiTiet] = useState<boolean>(false)

  /**
   * Tải danh sách hợp đồng từ Backend API.
   */
  const taiDanhSachHopDong = async (): Promise<void> => {
    setIsLoadingHopDong(true)
    try {
      const thamSoTrangThai = trangThaiLoc === 'TAT_CA' ? undefined : trangThaiLoc
      const thamSoSapHetHan = isLocSapHetHan ? 30 : undefined

      const ketQua = await layDanhSachHopDong({
        trangThai: thamSoTrangThai,
        sapHetHanTrongNgay: thamSoSapHetHan,
      })
      setDanhSachHopDong(ketQua)
    } catch {
      toast.error('Không thể tải danh sách hợp đồng lưu trú')
    } finally {
      setIsLoadingHopDong(false)
    }
  }

  useEffect(() => {
    taiDanhSachHopDong()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trangThaiLoc, isLocSapHetHan])

  /**
   * Lọc tức thì danh sách hợp đồng theo MSSV, họ tên hoặc số phòng (hỗ trợ không dấu, gõ dở).
   */
  const danhSachHopDongSauLoc = useMemo<HopDongDto[]>(() => {
    if (!tuKhoaMaSV.trim()) return danhSachHopDong
    return danhSachHopDong.filter(
      (hd) =>
        khopChuoiTimKiem(hd.maSV, tuKhoaMaSV) ||
        khopChuoiTimKiem(hd.hoTen, tuKhoaMaSV) ||
        khopChuoiTimKiem(hd.soPhong, tuKhoaMaSV) ||
        khopChuoiTimKiem(hd.tenKhu, tuKhoaMaSV)
    )
  }, [danhSachHopDong, tuKhoaMaSV])

  /**
   * Đặt lại các tiêu chí lọc về mặc định.
   */
  const datLaiBoLoc = (): void => {
    setTuKhoaMaSV('')
    setTrangThaiLoc('TAT_CA')
    setIsLocSapHetHan(false)
  }

  /**
   * Thống kê hợp đồng lưu trú theo các chỉ số quan trọng.
   */
  const thongKeHopDong = useMemo(() => {
    const tongSoHopDong = danhSachHopDong.length
    const soHopDongHieuLuc = danhSachHopDong.filter(
      (h) => h.trangThai === 'Có hiệu lực' || h.trangThai === 'CO_HIEU_LUC'
    ).length
    const soHopDongSapHetHan = danhSachHopDong.filter(
      (h) =>
        (h.trangThai === 'Có hiệu lực' || h.trangThai === 'CO_HIEU_LUC') &&
        typeof h.soNgayConLai === 'number' &&
        h.soNgayConLai >= 0 &&
        h.soNgayConLai <= 30
    ).length
    const soHopDongDaThanhLy = danhSachHopDong.filter(
      (h) => h.trangThai === 'Đã thanh lý' || h.trangThai === 'DA_THANH_LY'
    ).length

    return {
      tongSoHopDong,
      soHopDongHieuLuc,
      soHopDongSapHetHan,
      soHopDongDaThanhLy,
    }
  }, [danhSachHopDong])

  /**
   * Mở modal xác nhận kết thúc lưu trú và thanh lý hợp đồng.
   * @param hopDong - Hợp đồng cần thanh lý.
   */
  const moDialogXacNhanKetThuc = (hopDong: HopDongDto): void => {
    setHopDongDangKetThuc(hopDong)
    setIsMoDialogKetThuc(true)
  }

  /**
   * Xử lý gọi API kết thúc lưu trú của sinh viên.
   */
  const xuLyKetThucLuuTru = async (): Promise<void> => {
    if (!hopDongDangKetThuc) return

    setIsDangXuLyKetThuc(true)
    try {
      const ketQua = await ketThucLuuTru(hopDongDangKetThuc.maPhanPhong)
      toast.success(ketQua.message || 'Đã kết thúc lưu trú và thanh lý hợp đồng!')
      setIsMoDialogKetThuc(false)
      taiDanhSachHopDong()
    } catch {
      // Interceptor hiển thị lỗi
    } finally {
      setIsDangXuLyKetThuc(false)
    }
  }

  /**
   * Mở modal xem thông tin chi tiết hợp đồng và điều khoản.
   * @param hopDong - Hợp đồng cần xem.
   */
  const moDialogXemChiTiet = (hopDong: HopDongDto): void => {
    setHopDongXemChiTiet(hopDong)
    setIsMoDialogChiTiet(true)
  }

  /**
   * Hiển thị thời hạn hợp đồng và badge cảnh báo sắp hết hạn.
   * @param hopDong - Đối tượng hợp đồng.
   */
  const renderThoiHanHopDong = (hopDong: HopDongDto) => {
    if (hopDong.trangThai !== 'Có hiệu lực' && hopDong.trangThai !== 'CO_HIEU_LUC') {
      return <span className="text-xs text-slate-400">Đã kết thúc</span>
    }

    const soNgay = hopDong.soNgayConLai
    if (typeof soNgay !== 'number') {
      return <span className="text-xs text-slate-600">Không xác định</span>
    }

    if (soNgay < 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          Quá hạn {Math.abs(soNgay)} ngày
        </Badge>
      )
    }

    if (soNgay <= 30) {
      return (
        <Badge
          variant="secondary"
          className="border-amber-300 bg-amber-50 text-amber-800 text-xs font-medium"
        >
          <AlertTriangle className="mr-1 h-3 w-3 text-amber-600" />
          Còn {soNgay} ngày
        </Badge>
      )
    }

    return (
      <span className="text-xs font-medium text-slate-700">
        Còn {soNgay} ngày
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang & Nút làm mới */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý Hợp đồng Lưu trú KTX
          </h2>
          <p className="text-sm text-slate-500">
            Theo dõi thời hạn hợp đồng của sinh viên, cảnh báo hết hạn và thủ tục kết thúc lưu trú
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={taiDanhSachHopDong}
            disabled={isLoadingHopDong}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingHopDong ? 'animate-spin' : ''}`} />
            <span>Làm mới danh sách</span>
          </Button>
        </div>
      </div>

      {/* 4 Thẻ Thống kê KPI Hợp đồng */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tổng hợp đồng</span>
              <FileText className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {thongKeHopDong.tongSoHopDong}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Đang có hiệu lực</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {thongKeHopDong.soHopDongHieuLuc}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Sắp hết hạn (&le; 30 ngày)</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600">
              {thongKeHopDong.soHopDongSapHetHan}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Đã thanh lý</span>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-600">
              {thongKeHopDong.soHopDongDaThanhLy}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Thanh Bộ lọc Tra cứu Hợp đồng */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Tìm kiếm theo Mã SV */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tra cứu theo MSSV, họ tên hoặc số phòng..."
                value={tuKhoaMaSV}
                onChange={(e) => setTuKhoaMaSV(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>

            {/* Các tùy chọn lọc */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={trangThaiLoc}
                onChange={(e) => setTrangThaiLoc(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="TAT_CA">Tất cả trạng thái</option>
                <option value="Có hiệu lực">Có hiệu lực</option>
                <option value="Hết hạn">Hết hạn</option>
                <option value="Đã thanh lý">Đã thanh lý</option>
              </select>

              {/* Checkbox lọc hợp đồng sắp hết hạn */}
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={isLocSapHetHan}
                  onChange={(e) => setIsLocSapHetHan(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                />
                <span className="text-amber-800">Sắp hết hạn trong 30 ngày</span>
              </label>

              <Button
                variant="outline"
                size="sm"
                onClick={datLaiBoLoc}
                className="h-9 text-xs text-slate-600 hover:text-slate-900"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Đặt lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bảng danh sách Hợp đồng */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 py-3.5 px-6">
          <CardTitle className="text-base font-semibold text-slate-900">
            Danh sách Hợp đồng Lưu trú ({danhSachHopDongSauLoc.length} / {danhSachHopDong.length} hợp đồng)
          </CardTitle>
        </CardHeader>

        {isLoadingHopDong ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              <p className="text-sm">Đang tải danh sách hợp đồng...</p>
            </div>
          </div>
        ) : danhSachHopDongSauLoc.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <FileText className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">Không tìm thấy hợp đồng nào</p>
            <p className="text-xs text-slate-400 mt-1">
              Thử xóa bộ lọc hoặc tìm kiếm theo từ khóa khác
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/75">
                  <TableHead className="w-20">Mã HĐ</TableHead>
                  <TableHead>Sinh viên</TableHead>
                  <TableHead>Phòng ở</TableHead>
                  <TableHead>Ngày bắt đầu</TableHead>
                  <TableHead>Ngày kết thúc</TableHead>
                  <TableHead>Thời hạn còn lại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSachHopDongSauLoc.map((hd) => {
                  const isHieuLuc =
                    hd.trangThai === 'Có hiệu lực' || hd.trangThai === 'CO_HIEU_LUC'

                  return (
                    <TableRow key={hd.maHopDong} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono text-xs font-semibold text-slate-900">
                        #{hd.maHopDong}
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-slate-900">{hd.hoTen}</p>
                        <p className="text-xs text-slate-500">MSSV: {hd.maSV}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-semibold text-xs">
                          {hd.soPhong} ({hd.tenKhu})
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{hd.ngayBatDau}</TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {hd.ngayKetThuc || 'Vô thời hạn'}
                      </TableCell>
                      <TableCell>{renderThoiHanHopDong(hd)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={isHieuLuc ? 'default' : 'secondary'}
                          className={isHieuLuc ? 'bg-emerald-600 text-xs' : 'text-xs'}
                        >
                          {hd.trangThai}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moDialogXemChiTiet(hd)}
                            className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                          >
                            Chi tiết
                          </Button>

                          {isHieuLuc && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moDialogXacNhanKetThuc(hd)}
                              className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                            >
                              <LogOut className="mr-1 h-3.5 w-3.5" />
                              Trả phòng
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Modal 1: Xem chi tiết Hợp đồng */}
      <Dialog open={isMoDialogChiTiet} onOpenChange={setIsMoDialogChiTiet}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết Hợp đồng #{hopDongXemChiTiet?.maHopDong}</DialogTitle>
            <DialogDescription>
              Hợp đồng lưu trú ký túc xá và quyền lợi cư trú của sinh viên
            </DialogDescription>
          </DialogHeader>

          {hopDongXemChiTiet && (
            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-lg bg-slate-50 p-4 space-y-2.5">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Mã phân phòng:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    #{hopDongXemChiTiet.maPhanPhong}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Sinh viên:</span>
                  <span className="font-semibold text-slate-900">
                    {hopDongXemChiTiet.hoTen} ({hopDongXemChiTiet.maSV})
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Phòng lưu trú:</span>
                  <span className="font-medium text-slate-900">
                    Phòng {hopDongXemChiTiet.soPhong} - Khu {hopDongXemChiTiet.tenKhu}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Thời hạn:</span>
                  <span className="text-slate-800">
                    {hopDongXemChiTiet.ngayBatDau} &rarr; {hopDongXemChiTiet.ngayKetThuc || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Trạng thái:</span>
                  <Badge variant="outline">{hopDongXemChiTiet.trangThai}</Badge>
                </div>
                <div className="pt-1">
                  <span className="text-slate-500 text-xs block mb-1">Điều khoản cam kết:</span>
                  <p className="text-xs text-slate-700 bg-white p-2 rounded border border-slate-200">
                    {hopDongXemChiTiet.dieuKhoan || 'Thực hiện đầy đủ các quy chế lưu trú KTX.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMoDialogChiTiet(false)}
              className="w-full sm:w-auto"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Xác nhận Kết thúc Lưu trú & Thanh lý Hợp đồng */}
      <Dialog open={isMoDialogKetThuc} onOpenChange={setIsMoDialogKetThuc}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
              <DialogTitle>Xác nhận Kết thúc Lưu trú</DialogTitle>
            </div>
            <DialogDescription>
              Thao tác này dành cho sinh viên hoàn tất thủ tục trả phòng hoặc kết thúc hạn ở KTX.
            </DialogDescription>
          </DialogHeader>

          {hopDongDangKetThuc && (
            <div className="space-y-3 py-2 text-sm">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                <p className="text-xs text-slate-600">
                  <strong className="text-slate-900">Sinh viên:</strong>{' '}
                  {hopDongDangKetThuc.hoTen} (MSSV: {hopDongDangKetThuc.maSV})
                </p>
                <p className="text-xs text-slate-600">
                  <strong className="text-slate-900">Phòng đang ở:</strong>{' '}
                  Phòng {hopDongDangKetThuc.soPhong} ({hopDongDangKetThuc.tenKhu})
                </p>
                <p className="text-xs text-slate-600">
                  <strong className="text-slate-900">Mã phân phòng:</strong>{' '}
                  #{hopDongDangKetThuc.maPhanPhong}
                </p>
              </div>

              <div className="rounded-md border border-rose-200 bg-rose-50/60 p-3 text-xs text-rose-800">
                Khi xác nhận: Hệ thống sẽ tự động cập nhật ngày kết thúc thực tế, chuyển trạng thái
                hợp đồng sang <strong>Đã thanh lý</strong> và giải phóng 1 chỗ trống cho phòng{' '}
                {hopDongDangKetThuc.soPhong}.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMoDialogKetThuc(false)}
              disabled={isDangXuLyKetThuc}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={xuLyKetThucLuuTru}
              disabled={isDangXuLyKetThuc}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {isDangXuLyKetThuc ? 'Đang thanh lý...' : 'Xác nhận trả phòng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HopDongPage
