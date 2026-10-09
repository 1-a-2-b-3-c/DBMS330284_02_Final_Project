import React, { useState, useEffect, useMemo } from 'react'
import {
  BedDouble,
  Users,
  Search,
  Filter,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  AlertCircle,
  Home,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { layDanhSachPhong, laySinhVienTheoPhong } from '@/api/dormApi'
import type { PhongDto, SinhVienTrongPhongDto } from '@/types/dorm.types'
import { khopChuoiTimKiem } from '@/lib/utils'

/** Danh sách các khu cố định trong toàn bộ hệ thống KTX */
const DANH_SACH_KHU_CHUAN = ['A', 'B', 'C'] as const

/**
 * Màn hình Tra cứu Sơ đồ & Tình trạng Phòng Ký túc xá (Task A-01).
 * Cán bộ QLKTX có thể theo dõi tỷ lệ lấp đầy, số chỗ trống theo từng khu và danh sách SV lưu trú.
 * @returns Giao diện quản lý phòng KTX.
 */
export const PhongPage: React.FC = () => {
  // Trạng thái dữ liệu danh sách phòng
  const [danhSachPhong, setDanhSachPhong] = useState<PhongDto[]>([])
  const [isLoadingDanhSachPhong, setIsLoadingDanhSachPhong] = useState<boolean>(true)

  // Trạng thái bộ lọc
  const [maKhuLoc, setMaKhuLoc] = useState<string>('TAT_CA')
  const [trangThaiLoc, setTrangThaiLoc] = useState<string>('TAT_CA')
  const [isChiLayConCho, setIsChiLayConCho] = useState<boolean>(false)
  const [tuKhoaTimKiem, setTuKhoaTimKiem] = useState<string>('')
  const [cheDoHienThi, setCheDoHienThi] = useState<'grid' | 'table'>('grid')

  // Trạng thái Dialog xem sinh viên trong phòng
  const [phongDangChon, setPhongDangChon] = useState<PhongDto | null>(null)
  const [danhSachSinhVienTrongPhong, setDanhSachSinhVienTrongPhong] = useState<SinhVienTrongPhongDto[]>([])
  const [isLoadingSinhVienTrongPhong, setIsLoadingSinhVienTrongPhong] = useState<boolean>(false)
  const [isMoDialogSinhVien, setIsMoDialogSinhVien] = useState<boolean>(false)

  /**
   * Tải danh sách phòng từ Backend API với các tiêu chí lọc đã chọn.
   */
  const taiDuLieuPhong = async (): Promise<void> => {
    setIsLoadingDanhSachPhong(true)
    try {
      const thamSoKhu = maKhuLoc === 'TAT_CA' ? undefined : maKhuLoc
      const thamSoTrangThai = trangThaiLoc === 'TAT_CA' ? undefined : trangThaiLoc
      const ketQua = await layDanhSachPhong(thamSoKhu, thamSoTrangThai, isChiLayConCho)
      setDanhSachPhong(ketQua)
    } catch {
      toast.error('Không thể tải danh sách phòng ký túc xá')
    } finally {
      setIsLoadingDanhSachPhong(false)
    }
  }

  // Tự động tải lại khi đổi khu, trạng thái hoặc checkbox chỉ còn chỗ
  useEffect(() => {
    taiDuLieuPhong()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maKhuLoc, trangThaiLoc, isChiLayConCho])

  /**
   * Lọc cục bộ danh sách phòng theo từ khóa tìm kiếm (hỗ trợ tiếng Việt không dấu, gõ dở).
   */
  const danhSachPhongSauLoc = useMemo<PhongDto[]>(() => {
    if (!tuKhoaTimKiem.trim()) {
      return danhSachPhong
    }
    return danhSachPhong.filter(
      (phong) =>
        khopChuoiTimKiem(phong.soPhong, tuKhoaTimKiem) ||
        khopChuoiTimKiem(phong.tenLoaiPhong, tuKhoaTimKiem) ||
        khopChuoiTimKiem(phong.tenKhu, tuKhoaTimKiem) ||
        khopChuoiTimKiem(`Khu ${phong.maKhu}`, tuKhoaTimKiem)
    )
  }, [danhSachPhong, tuKhoaTimKiem])

  /**
   * Thống kê tổng số phòng, sức chứa, số người đang ở và số chỗ còn trống.
   */
  const thongKeTongQuan = useMemo(() => {
    const tongSoPhong = danhSachPhong.length
    const tongChoToiDa = danhSachPhong.reduce((tong, p) => tong + p.soNguoiToiDa, 0)
    const tongNguoiDangO = danhSachPhong.reduce((tong, p) => tong + p.soNguoiDangO, 0)
    const tongChoConTrong = danhSachPhong.reduce((tong, p) => tong + p.soChoTrong, 0)
    const tyLeLapDay = tongChoToiDa > 0 ? Math.round((tongNguoiDangO / tongChoToiDa) * 100) : 0

    return {
      tongSoPhong,
      tongChoToiDa,
      tongNguoiDangO,
      tongChoConTrong,
      tyLeLapDay,
    }
  }, [danhSachPhong])

  /**
   * Mở modal và gọi API lấy danh sách sinh viên hiện đang cư trú trong phòng.
   * @param phong - Thông tin phòng được chọn.
   */
  const moDialogXemSinhVien = async (phong: PhongDto): Promise<void> => {
    setPhongDangChon(phong)
    setIsMoDialogSinhVien(true)
    setIsLoadingSinhVienTrongPhong(true)
    try {
      const ketQuaSinhVien = await laySinhVienTheoPhong(phong.maPhong)
      setDanhSachSinhVienTrongPhong(ketQuaSinhVien)
    } catch {
      toast.error('Không thể lấy danh sách sinh viên trong phòng này')
      setDanhSachSinhVienTrongPhong([])
    } finally {
      setIsLoadingSinhVienTrongPhong(false)
    }
  }

  /**
   * Định dạng số tiền sang định dạng VNĐ.
   * @param soTien - Giá trị tiền tệ.
   * @returns Chuỗi định dạng hiển thị kèm đơn vị đ.
   */
  const dinhDangTien = (soTien: number): string => {
    return new Intl.NumberFormat('vi-VN').format(soTien) + ' đ'
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang & các nút thao tác nhanh */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Sơ đồ & Tình trạng Phòng KTX
          </h2>
          <p className="text-sm text-slate-500">
            Theo dõi sức chứa, tỷ lệ lấp đầy và danh sách sinh viên lưu trú từng phòng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={taiDuLieuPhong}
            disabled={isLoadingDanhSachPhong}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingDanhSachPhong ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
            <Button
              variant={cheDoHienThi === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setCheDoHienThi('grid')}
              className="h-8 px-2.5"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={cheDoHienThi === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setCheDoHienThi('table')}
              className="h-8 px-2.5"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 5 Thẻ Thống kê Tổng quan (KPI Cards) */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tổng số phòng</span>
              <Home className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{thongKeTongQuan.tongSoPhong}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tổng chỗ ở</span>
              <BedDouble className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{thongKeTongQuan.tongChoToiDa}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Đang lưu trú</span>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-600">{thongKeTongQuan.tongNguoiDangO}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Chỗ còn trống</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{thongKeTongQuan.tongChoConTrong}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tỷ lệ lấp đầy</span>
              <span className="text-xs font-semibold text-slate-700">{thongKeTongQuan.tyLeLapDay}%</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full transition-all duration-500 ${
                  thongKeTongQuan.tyLeLapDay > 90
                    ? 'bg-rose-500'
                    : thongKeTongQuan.tyLeLapDay > 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(thongKeTongQuan.tyLeLapDay, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Thanh Điều khiển & Bộ lọc Tra cứu */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Ô tìm kiếm nhanh */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo số phòng, khu hoặc loại phòng..."
                value={tuKhoaTimKiem}
                onChange={(e) => setTuKhoaTimKiem(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>

            {/* Các dropdown lọc */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="h-3.5 w-3.5" />
                <span>Khu:</span>
              </div>
              <select
                value={maKhuLoc}
                onChange={(e) => setMaKhuLoc(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="TAT_CA">Tất cả Khu</option>
                {DANH_SACH_KHU_CHUAN.map((maKhu) => (
                  <option key={maKhu} value={maKhu}>
                    Khu {maKhu}
                  </option>
                ))}
              </select>

              <select
                value={trangThaiLoc}
                onChange={(e) => setTrangThaiLoc(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="TAT_CA">Mọi trạng thái</option>
                <option value="Hoạt động">Hoạt động</option>
                <option value="Bảo trì">Bảo trì</option>
                <option value="Đóng">Đóng</option>
              </select>

              {/* Checkbox lọc chỉ phòng còn chỗ */}
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={isChiLayConCho}
                  onChange={(e) => setIsChiLayConCho(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                />
                <span>Chỉ phòng còn chỗ</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nội dung danh sách phòng */}
      {isLoadingDanhSachPhong ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
            <p className="text-sm">Đang tải danh sách phòng...</p>
          </div>
        </div>
      ) : danhSachPhongSauLoc.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="flex h-48 flex-col items-center justify-center text-center">
            <BedDouble className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">Không tìm thấy phòng phù hợp</p>
            <p className="text-xs text-slate-400 mt-1">
              Vui lòng thử thay đổi bộ lọc hoặc xóa từ khóa tìm kiếm
            </p>
          </CardContent>
        </Card>
      ) : cheDoHienThi === 'grid' ? (
        /* Chế độ Grid Cards trực quan */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {danhSachPhongSauLoc.map((phong) => {
            const isHetCho = phong.soChoTrong <= 0
            const tyLePhong =
              phong.soNguoiToiDa > 0
                ? Math.round((phong.soNguoiDangO / phong.soNguoiToiDa) * 100)
                : 0

            return (
              <Card
                key={phong.maPhong}
                className="group relative cursor-pointer border-slate-200 transition-all hover:border-slate-400 hover:shadow-md"
                onClick={() => moDialogXemSinhVien(phong)}
              >
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900">
                          {phong.soPhong}
                        </span>
                        <Badge variant="outline" className="text-[11px] font-normal">
                          Khu {phong.maKhu}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{phong.tenLoaiPhong}</p>
                    </div>

                    {phong.trangThai === 'Hoạt động' ? (
                      <Badge
                        className={
                          isHetCho
                            ? 'bg-slate-500 hover:bg-slate-600 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }
                      >
                        {isHetCho ? 'Hết chỗ' : `Còn ${phong.soChoTrong} chỗ`}
                      </Badge>
                    ) : phong.trangThai === 'Bảo trì' ? (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                        Bảo trì
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-600 hover:bg-rose-700 text-white">
                        {phong.trangThai}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4 pt-0 space-y-3">
                  {/* Thanh tiến độ số lượng người */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Đang ở: {phong.soNguoiDangO} / {phong.soNguoiToiDa} người</span>
                      <span>{tyLePhong}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full ${
                          isHetCho
                            ? 'bg-rose-500'
                            : tyLePhong >= 75
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${tyLePhong}%` }}
                      />
                    </div>
                  </div>

                  {/* Giá phòng & nút xem SV */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <span className="text-xs font-semibold text-slate-700">
                      {dinhDangTien(phong.donGia)}/kỳ
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                      onClick={(e) => {
                        e.stopPropagation()
                        moDialogXemSinhVien(phong)
                      }}
                    >
                      <Users className="mr-1 h-3.5 w-3.5" />
                      Xem SV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* Chế độ Bảng chi tiết */
        <Card className="border-slate-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/75">
                <TableHead className="w-24">Số phòng</TableHead>
                <TableHead>Khu</TableHead>
                <TableHead>Loại phòng</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-center">Sức chứa</TableHead>
                <TableHead className="text-center">Đang ở</TableHead>
                <TableHead className="text-center">Còn trống</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {danhSachPhongSauLoc.map((phong) => (
                <TableRow key={phong.maPhong} className="hover:bg-slate-50/50">
                  <TableCell className="font-semibold text-slate-900">
                    {phong.soPhong}
                  </TableCell>
                  <TableCell>{phong.tenKhu} ({phong.maKhu})</TableCell>
                  <TableCell className="text-slate-600">{phong.tenLoaiPhong}</TableCell>
                  <TableCell className="text-right font-medium">
                    {dinhDangTien(phong.donGia)}
                  </TableCell>
                  <TableCell className="text-center">{phong.soNguoiToiDa}</TableCell>
                  <TableCell className="text-center font-medium text-blue-600">
                    {phong.soNguoiDangO}
                  </TableCell>
                  <TableCell className="text-center font-medium text-emerald-600">
                    {phong.soChoTrong}
                  </TableCell>
                  <TableCell>
                    {phong.trangThai === 'Hoạt động' ? (
                      <Badge
                        className={
                          phong.soChoTrong <= 0
                            ? 'bg-slate-500 hover:bg-slate-600 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }
                      >
                        {phong.soChoTrong <= 0 ? 'Hoạt động (Hết chỗ)' : 'Hoạt động'}
                      </Badge>
                    ) : phong.trangThai === 'Bảo trì' ? (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                        Bảo trì
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-600 hover:bg-rose-700 text-white">
                        {phong.trangThai}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moDialogXemSinhVien(phong)}
                      className="h-8 text-xs"
                    >
                      <Users className="mr-1 h-3.5 w-3.5" />
                      Xem SV ({phong.soNguoiDangO})
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modal/Dialog Danh sách sinh viên trong phòng */}
      <Dialog open={isMoDialogSinhVien} onOpenChange={setIsMoDialogSinhVien}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-slate-700" />
              <span>Phòng {phongDangChon?.soPhong} - Khu {phongDangChon?.maKhu}</span>
            </DialogTitle>
            <DialogDescription>
              {phongDangChon?.tenLoaiPhong} • Đang ở: {phongDangChon?.soNguoiDangO} / {phongDangChon?.soNguoiToiDa} người
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {isLoadingSinhVienTrongPhong ? (
              <div className="flex h-32 items-center justify-center">
                <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                <span className="ml-2 text-xs text-slate-500">Đang lấy danh sách...</span>
              </div>
            ) : danhSachSinhVienTrongPhong.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-center text-slate-500">
                <AlertCircle className="h-8 w-8 text-slate-300 mb-1" />
                <p className="text-sm font-medium">Hiện tại phòng chưa có sinh viên lưu trú</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {danhSachSinhVienTrongPhong.map((sinhVien, index) => (
                  <div
                    key={sinhVien.maSV}
                    className="flex items-center justify-between p-3 text-sm hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{sinhVien.hoTen}</p>
                        <p className="text-xs text-slate-500">MSSV: {sinhVien.maSV}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Đang ở
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PhongPage
