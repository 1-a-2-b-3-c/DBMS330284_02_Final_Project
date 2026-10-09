import React, { useState, useEffect, useMemo } from 'react'
import {
  ClipboardCheck,
  Search,
  RefreshCw,
  Check,
  X,
  BedDouble,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
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
import {
  layDanhSachDonDangKy,
  duyetDonDangKy,
  xepPhongLuuTru,
  layDanhSachPhong,
} from '@/api/dormApi'
import type {
  DangKyDto,
  DuyetDonDangKyRequest,
  XepPhongRequest,
  PhongDto,
} from '@/types/dorm.types'

/**
 * Màn hình Xét duyệt Đơn Đăng ký KTX & Xếp phòng Lưu trú (Tasks A-04 & A-05).
 * Cán bộ QLKTX duyệt hoặc từ chối đơn của sinh viên, sau đó phân phòng và tạo hợp đồng trực tiếp.
 * @returns Giao diện quản lý xét duyệt đơn và xếp phòng.
 */
export const DangKyPage: React.FC = () => {
  // Trạng thái danh sách đơn đăng ký
  const [danhSachDonDangKy, setDanhSachDonDangKy] = useState<DangKyDto[]>([])
  const [isLoadingDanhSachDon, setIsLoadingDanhSachDon] = useState<boolean>(true)

  // Bộ lọc
  const [trangThaiLoc, setTrangThaiLoc] = useState<string>('CHO_DUYET')
  const [tuKhoaMaSV, setTuKhoaMaSV] = useState<string>('')
  const [tuKhoaHoTen, setTuKhoaHoTen] = useState<string>('')

  // Trạng thái Dialog Phê duyệt / Từ chối đơn (Task A-04)
  const [donDangXetDuyet, setDonDangXetDuyet] = useState<DangKyDto | null>(null)
  const [isMoDialogDuyet, setIsMoDialogDuyet] = useState<boolean>(false)
  const [isDangXuLyDuyet, setIsDangXuLyDuyet] = useState<boolean>(false)
  const [formDuyetDon, setFormDuyetDon] = useState<DuyetDonDangKyRequest>({
    chapNhan: true,
    ghiChu: '',
  })

  // Trạng thái Dialog Xếp phòng & Lập Hợp đồng (Task A-05)
  const [donDangXepPhong, setDonDangXepPhong] = useState<DangKyDto | null>(null)
  const [isMoDialogXepPhong, setIsMoDialogXepPhong] = useState<boolean>(false)
  const [danhSachPhongConCho, setDanhSachPhongConCho] = useState<PhongDto[]>([])
  const [isLoadingPhongConCho, setIsLoadingPhongConCho] = useState<boolean>(false)
  const [isDangXuLyXepPhong, setIsDangXuLyXepPhong] = useState<boolean>(false)

  // Ngày mặc định: Bắt đầu từ hôm nay, kết thúc sau 5 tháng (kỳ học)
  const ngayHomNay = useMemo(() => new Date().toISOString().split('T')[0], [])
  const ngayKetThucMacDinh = useMemo(() => {
    const ngay = new Date()
    ngay.setMonth(ngay.getMonth() + 5)
    return ngay.toISOString().split('T')[0]
  }, [])

  const [formXepPhong, setFormXepPhong] = useState<XepPhongRequest>({
    maPhong: 0,
    ngayBatDau: ngayHomNay,
    ngayKetThuc: ngayKetThucMacDinh,
    dieuKhoan: 'Sinh viên chấp hành nghiêm nội quy ký túc xá và thanh toán các khoản phí đúng hạn.',
  })

  /**
   * Tải danh sách đơn đăng ký từ Backend.
   */
  const taiDanhSachDon = async (): Promise<void> => {
    setIsLoadingDanhSachDon(true)
    try {
      const thamSoTrangThai = trangThaiLoc === 'TAT_CA' ? undefined : trangThaiLoc
      const ketQua = await layDanhSachDonDangKy(undefined, thamSoTrangThai)
      setDanhSachDonDangKy(ketQua)
    } catch {
      toast.error('Không thể tải danh sách đơn đăng ký')
    } finally {
      setIsLoadingDanhSachDon(false)
    }
  }

  useEffect(() => {
    taiDanhSachDon()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trangThaiLoc])

  /**
   * Lọc danh sách tức thì theo MSSV hoặc họ tên (hỗ trợ tiếng Việt không dấu, gõ dở).
   */
  const danhSachDonSauLoc = useMemo<DangKyDto[]>(() => {
    return danhSachDonDangKy.filter((don) => {
      if (tuKhoaMaSV.trim() && !khopChuoiTimKiem(don.maSV, tuKhoaMaSV)) {
        return false
      }
      if (tuKhoaHoTen.trim() && !khopChuoiTimKiem(don.hoTen, tuKhoaHoTen)) {
        return false
      }
      return true
    })
  }, [danhSachDonDangKy, tuKhoaMaSV, tuKhoaHoTen])

  /**
   * Đặt lại bộ lọc tìm kiếm về mặc định.
   */
  const datLaiBoLoc = (): void => {
    setTuKhoaMaSV('')
    setTuKhoaHoTen('')
    setTrangThaiLoc('CHO_DUYET')
  }

  /**
   * Thống kê số lượng đơn theo từng trạng thái.
   */
  const thongKeDon = useMemo(() => {
    const tongSoDon = danhSachDonDangKy.length
    const soDonChoDuyet = danhSachDonDangKy.filter(
      (d) => d.trangThai === 'CHO_DUYET' || d.trangThai === 'Chờ duyệt'
    ).length
    const soDonDaDuyet = danhSachDonDangKy.filter(
      (d) => d.trangThai === 'DA_DUYET' || d.trangThai === 'Đã duyệt'
    ).length
    const soDonTuChoi = danhSachDonDangKy.filter(
      (d) => d.trangThai === 'TU_CHOI' || d.trangThai === 'Từ chối'
    ).length

    return { tongSoDon, soDonChoDuyet, soDonDaDuyet, soDonTuChoi }
  }, [danhSachDonDangKy])

  /**
   * Mở modal xét duyệt đơn đăng ký.
   * @param don - Đơn đăng ký cần duyệt hoặc từ chối.
   * @param isChapNhan - Mặc định chấp nhận hay từ chối.
   */
  const moDialogXetDuyet = (don: DangKyDto, isChapNhan: boolean): void => {
    setDonDangXetDuyet(don)
    setFormDuyetDon({
      chapNhan: isChapNhan,
      ghiChu: isChapNhan ? 'Đủ điều kiện tiếp nhận vào KTX.' : '',
    })
    setIsMoDialogDuyet(true)
  }

  /**
   * Xử lý gửi phê duyệt đơn đăng ký lên Backend.
   */
  const xuLyDuyetDon = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!donDangXetDuyet) return

    setIsDangXuLyDuyet(true)
    try {
      const ketQua = await duyetDonDangKy(donDangXetDuyet.maDangKy, formDuyetDon)
      toast.success(ketQua.message || 'Xử lý xét duyệt đơn thành công!')
      setIsMoDialogDuyet(false)
      taiDanhSachDon()
    } catch {
      // Interceptor hiển thị lỗi
    } finally {
      setIsDangXuLyDuyet(false)
    }
  }

  /**
   * Mở modal xếp phòng cho sinh viên có đơn đã duyệt.
   * @param don - Đơn đăng ký đã duyệt.
   */
  const moDialogXepPhongLuuTru = async (don: DangKyDto): Promise<void> => {
    setDonDangXepPhong(don)
    setIsMoDialogXepPhong(true)
    setIsLoadingPhongConCho(true)
    try {
      // Lấy danh sách các phòng đang hoạt động và còn chỗ trống (chiConCho = true)
      const dsPhong = await layDanhSachPhong(undefined, undefined, true)
      setDanhSachPhongConCho(dsPhong)
      if (dsPhong.length > 0) {
        setFormXepPhong({
          maPhong: dsPhong[0].maPhong,
          ngayBatDau: ngayHomNay,
          ngayKetThuc: ngayKetThucMacDinh,
          dieuKhoan:
            'Sinh viên chấp hành nghiêm chỉnh nội quy ký túc xá và hoàn thành nghĩa vụ tài chính đúng thời hạn.',
        })
      }
    } catch {
      toast.error('Không thể lấy danh sách phòng còn chỗ trống')
    } finally {
      setIsLoadingPhongConCho(false)
    }
  }

  /**
   * Xử lý xếp phòng và tự động lập hợp đồng lưu trú cho sinh viên.
   */
  const xuLyXepPhong = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!donDangXepPhong) return

    if (!formXepPhong.maPhong || formXepPhong.maPhong <= 0) {
      toast.warning('Vui lòng chọn một phòng còn chỗ trống')
      return
    }

    if (formXepPhong.ngayKetThuc <= formXepPhong.ngayBatDau) {
      toast.warning('Ngày kết thúc lưu trú phải sau ngày bắt đầu')
      return
    }

    setIsDangXuLyXepPhong(true)
    try {
      const ketQua = await xepPhongLuuTru(donDangXepPhong.maDangKy, formXepPhong)
      toast.success(
        `Xếp phòng thành công! Tạo phân phòng #${ketQua.maPhanPhong} & Hợp đồng #${ketQua.maHopDong}`
      )
      setIsMoDialogXepPhong(false)
      taiDanhSachDon()
    } catch {
      // Interceptor hiển thị lỗi trigger từ backend
    } finally {
      setIsDangXuLyXepPhong(false)
    }
  }

  /**
   * Hiển thị Huy hiệu Trạng thái đơn trực quan.
   * @param trangThai - Trạng thái của đơn đăng ký.
   */
  const renderBadgeTrangThai = (trangThai: string) => {
    switch (trangThai) {
      case 'CHO_DUYET':
      case 'Chờ duyệt':
        return (
          <Badge
            variant="outline"
            className="border-amber-300 bg-amber-50 text-amber-700 font-medium"
          >
            <Clock className="mr-1 h-3 w-3" />
            Chờ duyệt
          </Badge>
        )
      case 'DA_DUYET':
      case 'Đã duyệt':
        return (
          <Badge
            variant="outline"
            className="border-emerald-300 bg-emerald-50 text-emerald-700 font-medium"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Đã duyệt
          </Badge>
        )
      case 'TU_CHOI':
      case 'Từ chối':
        return (
          <Badge
            variant="outline"
            className="border-rose-300 bg-rose-50 text-rose-700 font-medium"
          >
            <XCircle className="mr-1 h-3 w-3" />
            Từ chối
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
            Xét duyệt Đơn Đăng ký Lưu trú
          </h2>
          <p className="text-sm text-slate-500">
            Tiếp nhận hồ sơ đăng ký KTX trực tuyến, phê duyệt chính sách và xếp phòng cho sinh viên
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={taiDanhSachDon}
            disabled={isLoadingDanhSachDon}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingDanhSachDon ? 'animate-spin' : ''}`} />
            <span>Làm mới danh sách</span>
          </Button>
        </div>
      </div>

      {/* 4 Thẻ Thống kê Trạng thái Đơn */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tổng số đơn</span>
              <FileText className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{thongKeDon.tongSoDon}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Đơn chờ duyệt</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600">{thongKeDon.soDonChoDuyet}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Đã phê duyệt</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{thongKeDon.soDonDaDuyet}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Đã từ chối</span>
              <XCircle className="h-4 w-4 text-rose-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-rose-600">{thongKeDon.soDonTuChoi}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bộ lọc Tra cứu */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {/* Lọc theo trạng thái */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Trạng thái duyệt
              </label>
              <select
                value={trangThaiLoc}
                onChange={(e) => setTrangThaiLoc(e.target.value)}
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="TAT_CA">Tất cả trạng thái</option>
                <option value="CHO_DUYET">Chờ xét duyệt</option>
                <option value="DA_DUYET">Đã chấp thuận</option>
                <option value="TU_CHOI">Đã từ chối</option>
              </select>
            </div>

            {/* Tìm kiếm theo Mã SV */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Mã sinh viên
              </label>
              <Input
                placeholder="Tìm theo MSSV..."
                value={tuKhoaMaSV}
                onChange={(e) => setTuKhoaMaSV(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Tìm kiếm theo Họ tên */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Họ tên sinh viên
              </label>
              <Input
                placeholder="Tìm theo tên..."
                value={tuKhoaHoTen}
                onChange={(e) => setTuKhoaHoTen(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Nút đặt lại */}
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={datLaiBoLoc}
                className="h-8 w-full text-xs text-slate-600 hover:text-slate-900"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Đặt lại lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bảng danh sách Đơn đăng ký */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 py-3.5 px-6">
          <CardTitle className="text-base font-semibold text-slate-900">
            Danh sách Đơn đăng ký ({danhSachDonSauLoc.length} đơn)
          </CardTitle>
        </CardHeader>

        {isLoadingDanhSachDon ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              <p className="text-sm">Đang tải danh sách đơn...</p>
            </div>
          </div>
        ) : danhSachDonSauLoc.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <ClipboardCheck className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">Không có đơn đăng ký nào</p>
            <p className="text-xs text-slate-400 mt-1">
              Thử chuyển đổi bộ lọc trạng thái hoặc xóa từ khóa tìm kiếm
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/75">
                  <TableHead className="w-20">Mã đơn</TableHead>
                  <TableHead>Sinh viên</TableHead>
                  <TableHead>Nguyện vọng loại phòng</TableHead>
                  <TableHead>Ngày gửi</TableHead>
                  <TableHead>Ghi chú của SV</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSachDonSauLoc.map((don) => {
                  const isChoDuyet =
                    don.trangThai === 'CHO_DUYET' || don.trangThai === 'Chờ duyệt'
                  const isDaDuyet =
                    don.trangThai === 'DA_DUYET' || don.trangThai === 'Đã duyệt'

                  return (
                    <TableRow key={don.maDangKy} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono text-xs font-semibold text-slate-900">
                        #{don.maDangKy}
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-slate-900">{don.hoTen}</p>
                        <p className="text-xs text-slate-500">MSSV: {don.maSV}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal text-xs">
                          {don.tenLoaiPhong || don.maLoaiPhong || 'Tự do'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{don.ngayDangKy}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-xs text-slate-500">
                        {don.ghiChu || '—'}
                      </TableCell>
                      <TableCell>{renderBadgeTrangThai(don.trangThai)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isChoDuyet && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moDialogXetDuyet(don, true)}
                                className="h-7 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              >
                                <Check className="mr-1 h-3.5 w-3.5" />
                                Duyệt
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moDialogXetDuyet(don, false)}
                                className="h-7 text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
                              >
                                <X className="mr-1 h-3.5 w-3.5" />
                                Từ chối
                              </Button>
                            </>
                          )}

                          {isDaDuyet && (
                            <Button
                              size="sm"
                              onClick={() => moDialogXepPhongLuuTru(don)}
                              className="h-7 text-xs bg-slate-900 text-white hover:bg-slate-800"
                            >
                              <BedDouble className="mr-1 h-3.5 w-3.5" />
                              Xếp phòng
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

      {/* Modal 1: Xét duyệt đơn đăng ký (Chấp thuận / Từ chối) */}
      <Dialog open={isMoDialogDuyet} onOpenChange={setIsMoDialogDuyet}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {formDuyetDon.chapNhan ? 'Chấp thuận' : 'Từ chối'} Đơn Đăng ký #{donDangXetDuyet?.maDangKy}
            </DialogTitle>
            <DialogDescription>
              Sinh viên: {donDangXetDuyet?.hoTen} (MSSV: {donDangXetDuyet?.maSV})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={xuLyDuyetDon} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-slate-700">Quyết định xét duyệt</label>
              <div className="mt-1 flex gap-2">
                <Button
                  type="button"
                  variant={formDuyetDon.chapNhan ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setFormDuyetDon({
                      ...formDuyetDon,
                      chapNhan: true,
                      ghiChu: 'Đủ điều kiện tiếp nhận vào KTX.',
                    })
                  }
                  className={`flex-1 text-xs ${
                    formDuyetDon.chapNhan ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                  }`}
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Chấp nhận duyệt
                </Button>
                <Button
                  type="button"
                  variant={!formDuyetDon.chapNhan ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setFormDuyetDon({
                      ...formDuyetDon,
                      chapNhan: false,
                      ghiChu: 'Không đủ điều kiện tiếp nhận đợt này.',
                    })
                  }
                  className="flex-1 text-xs"
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Từ chối đơn
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">
                Ghi chú / Lý do phản hồi cho sinh viên
              </label>
              <textarea
                rows={3}
                placeholder="Nhập nội dung phản hồi cho sinh viên..."
                value={formDuyetDon.ghiChu || ''}
                onChange={(e) =>
                  setFormDuyetDon({ ...formDuyetDon, ghiChu: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-slate-200 p-2.5 text-xs focus:border-slate-400 focus:outline-none"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMoDialogDuyet(false)}
                disabled={isDangXuLyDuyet}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isDangXuLyDuyet}
                className={`text-white ${
                  formDuyetDon.chapNhan
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isDangXuLyDuyet ? 'Đang xử lý...' : 'Xác nhận kết quả'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Xếp phòng cho đơn đã duyệt & Lập Hợp đồng (Task A-05) */}
      <Dialog open={isMoDialogXepPhong} onOpenChange={setIsMoDialogXepPhong}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 text-slate-900">
              <BedDouble className="h-5 w-5" />
              <DialogTitle>Xếp phòng Lưu trú cho Sinh viên</DialogTitle>
            </div>
            <DialogDescription>
              Sinh viên: {donDangXepPhong?.hoTen} (MSSV: {donDangXepPhong?.maSV}) • Đơn #{donDangXepPhong?.maDangKy}
            </DialogDescription>
          </DialogHeader>

          {isLoadingPhongConCho ? (
            <div className="flex h-36 items-center justify-center">
              <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
              <span className="ml-2 text-xs text-slate-500">Đang tìm các phòng còn chỗ...</span>
            </div>
          ) : danhSachPhongConCho.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
              <p className="text-sm font-semibold text-amber-900">
                Hiện tại không còn phòng nào trống chỗ!
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Tất cả các phòng ký túc xá đang hoạt động đã đủ số lượng người ở tối đa.
              </p>
            </div>
          ) : (
            <form onSubmit={xuLyXepPhong} className="space-y-4 py-2">
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Chọn phòng còn chỗ trống <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formXepPhong.maPhong}
                  onChange={(e) =>
                    setFormXepPhong({
                      ...formXepPhong,
                      maPhong: parseInt(e.target.value, 10),
                    })
                  }
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-slate-400 focus:outline-none"
                >
                  {danhSachPhongConCho.map((p) => (
                    <option key={p.maPhong} value={p.maPhong}>
                      Phòng {p.soPhong} - Khu {p.maKhu} ({p.tenLoaiPhong}) - Còn {p.soChoTrong} chỗ [
                      {new Intl.NumberFormat('vi-VN').format(p.donGia)} đ/kỳ]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Ngày bắt đầu ở <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    required
                    value={formXepPhong.ngayBatDau}
                    onChange={(e) =>
                      setFormXepPhong({ ...formXepPhong, ngayBatDau: e.target.value })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    required
                    value={formXepPhong.ngayKetThuc}
                    onChange={(e) =>
                      setFormXepPhong({ ...formXepPhong, ngayKetThuc: e.target.value })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Điều khoản hợp đồng</label>
                <textarea
                  rows={3}
                  value={formXepPhong.dieuKhoan || ''}
                  onChange={(e) =>
                    setFormXepPhong({ ...formXepPhong, dieuKhoan: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 p-2.5 text-xs focus:border-slate-400 focus:outline-none"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMoDialogXepPhong(false)}
                  disabled={isDangXuLyXepPhong}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isDangXuLyXepPhong}
                  className="bg-slate-900 text-white hover:bg-slate-800"
                >
                  {isDangXuLyXepPhong ? 'Đang xếp phòng...' : 'Xác nhận xếp phòng & Tạo HĐ'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DangKyPage
