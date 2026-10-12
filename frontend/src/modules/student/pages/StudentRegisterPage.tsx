import React, { useState, useEffect } from 'react'
import {
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  Info,
  Building2,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
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
import { layDanhSachDangKyCuaToi, nopDonDangKyKtx } from '@/api/studentApi'
import type { DangKyDto } from '@/types/dorm.types'
import type { NopDonDangKyRequest } from '@/types/student.types'

/** Danh mục các loại phòng tiêu chuẩn trong hệ thống KTX */
const DANH_MUC_LOAI_PHONG = [
  { ma: 'P2', ten: 'Phòng 2 người', gia: '900.000 đ/kỳ', moTa: 'Phòng riêng tư, điều hòa' },
  { ma: 'P4', ten: 'Phòng 4 người', gia: '600.000 đ/kỳ', moTa: 'Phòng tiêu chuẩn 4 người' },
  { ma: 'P6', ten: 'Phòng 6 người', gia: '400.000 đ/kỳ', moTa: 'Phòng kinh tế 6 người' },
] as const

/**
 * Màn hình Nộp đơn Đăng ký ở KTX & Lịch sử Xét duyệt của Sinh viên (Task A-08).
 * Cho phép sinh viên đăng ký nguyện vọng phòng và theo dõi trạng thái phản hồi thời gian thực từ QLKTX.
 * @returns Giao diện nộp đơn và danh sách đơn cá nhân.
 */
export const StudentRegisterPage: React.FC = () => {
  // Trạng thái danh sách đơn đăng ký cá nhân
  const [danhSachDon, setDanhSachDon] = useState<DangKyDto[]>([])
  const [isLoadingDanhSach, setIsLoadingDanhSach] = useState<boolean>(true)

  // Trạng thái biểu mẫu nộp đơn
  const [maLoaiPhongChon, setMaLoaiPhongChon] = useState<string>('P4')
  const [ghiChuNguyenVong, setGhiChuNguyenVong] = useState<string>('')
  const [isDangGuiDon, setIsDangGuiDon] = useState<boolean>(false)

  /**
   * Tải lịch sử đơn đăng ký của sinh viên từ Backend (/api/me/dangky).
   */
  const taiLichSuDangKy = async (): Promise<void> => {
    setIsLoadingDanhSach(true)
    try {
      const ketQua = await layDanhSachDangKyCuaToi()
      setDanhSachDon(ketQua)
    } catch {
      toast.error('Không thể tải lịch sử đơn đăng ký')
    } finally {
      setIsLoadingDanhSach(false)
    }
  }

  useEffect(() => {
    taiLichSuDangKy()
  }, [])

  /**
   * Xử lý nộp đơn đăng ký nguyện vọng mới lên Backend.
   */
  const xuLyNopDon = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    setIsDangGuiDon(true)
    try {
      const duLieuGui: NopDonDangKyRequest = {
        maLoaiPhong: maLoaiPhongChon || undefined,
        ghiChu: ghiChuNguyenVong.trim() || undefined,
      }

      const phanHoi = await nopDonDangKyKtx(duLieuGui)
      toast.success(phanHoi.message || 'Đã nộp đơn đăng ký thành công!')
      setGhiChuNguyenVong('')
      taiLichSuDangKy()
    } catch {
      // Interceptor đã bắt và hiển thị thông báo lỗi từ Trigger DB
    } finally {
      setIsDangGuiDon(false)
    }
  }

  /**
   * Render badge trạng thái xét duyệt của đơn.
   * @param trangThai - Trạng thái của đơn đăng ký.
   */
  const renderBadgeTrangThai = (trangThai: string) => {
    switch (trangThai) {
      case 'CHO_DUYET':
      case 'Chờ duyệt':
        return (
          <Badge
            variant="outline"
            className="border-amber-300 bg-amber-50 text-amber-700 font-medium text-xs"
          >
            <Clock className="mr-1 h-3 w-3" />
            Đang chờ duyệt
          </Badge>
        )
      case 'DA_DUYET':
      case 'Đã duyệt':
        return (
          <Badge
            variant="outline"
            className="border-emerald-300 bg-emerald-50 text-emerald-700 font-medium text-xs"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Đã chấp thuận
          </Badge>
        )
      case 'TU_CHOI':
      case 'Từ chối':
        return (
          <Badge
            variant="outline"
            className="border-rose-300 bg-rose-50 text-rose-700 font-medium text-xs"
          >
            <XCircle className="mr-1 h-3 w-3" />
            Từ chối tiếp nhận
          </Badge>
        )
      default:
        return <Badge variant="secondary">{trangThai}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang & Nút tải lại */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Đăng ký Lưu trú Ký túc xá
          </h2>
          <p className="text-sm text-slate-500">
            Gửi đơn đăng ký chỗ ở theo kỳ học và theo dõi kết quả xét duyệt từ Ban quản lý
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={taiLichSuDangKy}
            disabled={isLoadingDanhSach}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingDanhSach ? 'animate-spin' : ''}`} />
            <span>Làm mới danh sách</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cột Trái: Biểu mẫu Nộp đơn Đăng ký mới */}
        <Card className="border-slate-200 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Send className="h-4 w-4 text-slate-700" />
              <span>Nộp Đơn Đăng ký Mới</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Điền nguyện vọng lưu trú và loại phòng mong muốn
            </CardDescription>
          </CardHeader>

          <form onSubmit={xuLyNopDon}>
            <CardContent className="space-y-4 text-xs">
              {/* Lưu ý quy định */}
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-amber-800 flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-900">Quy định nộp đơn:</p>
                  <p className="mt-0.5 text-amber-700">
                    Mỗi sinh viên chỉ được có tối đa 1 đơn chờ duyệt. Nếu bạn đã có hợp đồng KTX còn hiệu lực, bạn không thể nộp đơn mới.
                  </p>
                </div>
              </div>

              {/* Lựa chọn loại phòng */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Loại phòng mong muốn
                </label>
                <div className="space-y-2">
                  {DANH_MUC_LOAI_PHONG.map((lp) => (
                    <label
                      key={lp.ma}
                      className={`flex cursor-pointer items-start justify-between rounded-lg border p-2.5 transition-colors ${
                        maLoaiPhongChon === lp.ma
                          ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                          : 'border-slate-200 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="loaiPhong"
                          value={lp.ma}
                          checked={maLoaiPhongChon === lp.ma}
                          onChange={(e) => setMaLoaiPhongChon(e.target.value)}
                          className="text-slate-900 focus:ring-slate-400"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{lp.ten}</p>
                          <p className="text-[11px] text-slate-500">{lp.moTa}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-700 text-[11px]">{lp.gia}</span>
                    </label>
                  ))}

                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 transition-colors ${
                      maLoaiPhongChon === ''
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                        : 'border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="loaiPhong"
                      value=""
                      checked={maLoaiPhongChon === ''}
                      onChange={(e) => setMaLoaiPhongChon(e.target.value)}
                      className="text-slate-900 focus:ring-slate-400"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">Không yêu cầu loại phòng</p>
                      <p className="text-[11px] text-slate-500">Ban quản lý KTX tự sắp xếp theo chỗ trống</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Nguyện vọng / Ghi chú */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Ghi chú nguyện vọng cá nhân
                </label>
                <textarea
                  rows={3}
                  maxLength={255}
                  placeholder="Ví dụ: Mong muốn ở tầng 2, có bạn cùng lớp muốn ghép chung..."
                  value={ghiChuNguyenVong}
                  onChange={(e) => setGhiChuNguyenVong(e.target.value)}
                  className="w-full rounded-md border border-slate-200 p-2.5 text-xs focus:border-slate-400 focus:outline-none"
                />
                <p className="text-right text-[10px] text-slate-400">
                  {ghiChuNguyenVong.length}/255 ký tự
                </p>
              </div>
            </CardContent>

            <CardFooter className="border-t border-slate-100 pt-3">
              <Button
                type="submit"
                disabled={isDangGuiDon}
                className="w-full bg-slate-900 text-white hover:bg-slate-800 text-xs gap-2"
              >
                <Send className="h-4 w-4" />
                <span>{isDangGuiDon ? 'Đang gửi đơn...' : 'Gửi đơn đăng ký KTX'}</span>
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Cột Phải: Bảng Lịch sử các Đơn đăng ký của sinh viên */}
        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-slate-100 py-3.5 px-6">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
              <span>Lịch sử Đơn Đăng ký ({danhSachDon.length} đơn)</span>
            </CardTitle>
          </CardHeader>

          {isLoadingDanhSach ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                <p className="text-sm">Đang tải lịch sử đăng ký...</p>
              </div>
            </div>
          ) : danhSachDon.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center p-6">
              <FileText className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-700">Bạn chưa nộp đơn đăng ký KTX nào</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Hãy chọn loại phòng mong muốn ở cột bên trái và gửi đơn để Ban quản lý xem xét bố trí chỗ ở
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/75">
                    <TableHead className="w-20">Mã đơn</TableHead>
                    <TableHead>Loại phòng</TableHead>
                    <TableHead>Ngày gửi</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ghi chú / Phản hồi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {danhSachDon.map((don) => (
                    <TableRow key={don.maDangKy} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono text-xs font-semibold text-slate-900">
                        #{don.maDangKy}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {don.tenLoaiPhong || don.maLoaiPhong || 'Tùy chọn'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {don.ngayDangKy}
                        </span>
                      </TableCell>
                      <TableCell>{renderBadgeTrangThai(don.trangThai)}</TableCell>
                      <TableCell className="max-w-[200px] text-xs text-slate-600">
                        {don.ghiChu || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default StudentRegisterPage
