import React, { useState, useEffect, useMemo } from 'react'
import {
  CreditCard,
  Receipt,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Wallet,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
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
  layDanhSachHoaDonCuaToi,
  layChiTietHoaDonCuaToi,
  thanhToanHoaDonCuaToi,
} from '@/api/studentApi'
import type {
  HoaDonSinhVienDto,
  ChiTietHoaDonDto,
  ThanhToanRequest,
} from '@/types/student.types'

/**
 * Màn hình Tra cứu & Thanh toán Hóa đơn của Sinh viên (Task A-11).
 * Hỗ trợ sinh viên theo dõi công nợ, xem chi tiết từng khoản thu và thực hiện thanh toán trực tuyến.
 * @returns Giao diện tra cứu hóa đơn và thanh toán sinh viên.
 */
export const StudentInvoicesPage: React.FC = () => {
  // Trạng thái danh sách hóa đơn
  const [danhSachHoaDon, setDanhSachHoaDon] = useState<HoaDonSinhVienDto[]>([])
  const [isLoadingHoaDon, setIsLoadingHoaDon] = useState<boolean>(true)

  // Trạng thái Dialog Chi tiết Hóa đơn
  const [hoaDonXemChiTiet, setHoaDonXemChiTiet] = useState<HoaDonSinhVienDto | null>(null)
  const [chiTietCacKhoanThu, setChiTietCacKhoanThu] = useState<ChiTietHoaDonDto[]>([])
  const [isLoadingChiTiet, setIsLoadingChiTiet] = useState<boolean>(false)
  const [isMoDialogChiTiet, setIsMoDialogChiTiet] = useState<boolean>(false)

  // Trạng thái Dialog Thanh toán Hóa đơn
  const [hoaDonDangThanhToan, setHoaDonDangThanhToan] = useState<HoaDonSinhVienDto | null>(null)
  const [isMoDialogThanhToan, setIsMoDialogThanhToan] = useState<boolean>(false)
  const [isDangXuLyThanhToan, setIsDangXuLyThanhToan] = useState<boolean>(false)
  const [isTraToanBo, setIsTraToanBo] = useState<boolean>(true)
  const [formThanhToan, setFormThanhToan] = useState<ThanhToanRequest>({
    soTien: 0,
    phuongThuc: 'Chuyển khoản',
    maGiaoDich: '',
  })

  /**
   * Tải danh sách hóa đơn từ Backend (/api/me/hoadon).
   */
  const taiDanhSachHoaDon = async (): Promise<void> => {
    setIsLoadingHoaDon(true)
    try {
      const ketQua = await layDanhSachHoaDonCuaToi()
      setDanhSachHoaDon(ketQua)
    } catch {
      toast.error('Không thể tải danh sách hóa đơn của bạn')
    } finally {
      setIsLoadingHoaDon(false)
    }
  }

  useEffect(() => {
    taiDanhSachHoaDon()
  }, [])

  /**
   * Tính toán tổng công nợ và tổng tiền của sinh viên.
   */
  const thongKeTaiChinh = useMemo(() => {
    const tongTien = danhSachHoaDon.reduce((t, h) => t + Number(h.tongTien || 0), 0)
    const daThanhToan = danhSachHoaDon.reduce((t, h) => t + Number(h.daThanhToan || 0), 0)
    const conNo = danhSachHoaDon.reduce((t, h) => t + Number(h.conNo || 0), 0)
    return { tongTien, daThanhToan, conNo }
  }, [danhSachHoaDon])

  /**
   * Định dạng tiền tệ VND.
   * @param soTien - Giá trị số tiền.
   */
  const dinhDangTien = (soTien: number): string => {
    return new Intl.NumberFormat('vi-VN').format(soTien) + ' đ'
  }

  /**
   * Mở modal xem chi tiết từng khoản thu trong hóa đơn.
   * @param hoaDon - Hóa đơn cần xem.
   */
  const moDialogXemChiTiet = async (hoaDon: HoaDonSinhVienDto): Promise<void> => {
    setHoaDonXemChiTiet(hoaDon)
    setIsMoDialogChiTiet(true)
    setIsLoadingChiTiet(true)
    try {
      const ketQua = await layChiTietHoaDonCuaToi(hoaDon.maHoaDon)
      setChiTietCacKhoanThu(ketQua.chiTiet || [])
    } catch {
      toast.error('Không thể tải chi tiết hóa đơn')
      setChiTietCacKhoanThu([])
    } finally {
      setIsLoadingChiTiet(false)
    }
  }

  /**
   * Mở modal thanh toán hóa đơn trực tuyến.
   * @param hoaDon - Hóa đơn cần thanh toán.
   */
  const moDialogThanhToan = (hoaDon: HoaDonSinhVienDto): void => {
    setHoaDonDangThanhToan(hoaDon)
    setIsTraToanBo(true)
    setFormThanhToan({
      soTien: Number(hoaDon.conNo),
      phuongThuc: 'Chuyển khoản',
      maGiaoDich: 'PAY' + Date.now().toString().slice(-8),
    })
    setIsMoDialogThanhToan(true)
  }

  /**
   * Xử lý xác nhận thanh toán hóa đơn gửi lên Backend.
   */
  const xuLyXacNhanThanhToan = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!hoaDonDangThanhToan) return

    const soNoHienTai = Number(hoaDonDangThanhToan.conNo)
    const soTienNop = Number(formThanhToan.soTien)

    if (soTienNop <= 0) {
      toast.warning('Số tiền thanh toán phải lớn hơn 0.')
      return
    }

    if (soTienNop > soNoHienTai) {
      toast.warning(
        `Số tiền thanh toán không được vượt quá số nợ hiện tại (${dinhDangTien(soNoHienTai)}).`
      )
      return
    }

    // Quy tắc: Nộp 100% số nợ còn lại HOẶC Nộp bội số của 10.000 VNĐ
    const isTraHetToanBo = isTraToanBo || soTienNop === soNoHienTai
    const isBoiSo10000 = soTienNop % 10000 === 0

    if (!isTraHetToanBo && !isBoiSo10000) {
      toast.warning(
        'Khi thanh toán từng phần, số tiền nộp phải là bội số của 10.000 VNĐ (ví dụ: 10.000, 50.000, 100.000...). Nếu muốn thanh toán số tiền khác, vui lòng tích chọn "Trả 100% số tiền còn nợ".'
      )
      return
    }

    setIsDangXuLyThanhToan(true)
    try {
      const ketQua = await thanhToanHoaDonCuaToi(
        hoaDonDangThanhToan.maHoaDon,
        formThanhToan.soTien,
        formThanhToan.phuongThuc,
        formThanhToan.maGiaoDich?.trim() || undefined
      )

      toast.success(
        ketQua.message ||
          `Thanh toán thành công! Mã giao dịch #${ketQua.maThanhToan}`
      )
      setIsMoDialogThanhToan(false)
      taiDanhSachHoaDon()
    } catch {
      // Toast hiển thị qua interceptor
    } finally {
      setIsDangXuLyThanhToan(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang & Nút tải lại */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Hóa đơn & Thanh toán KTX
          </h2>
          <p className="text-sm text-slate-500">
            Tra cứu tiền phòng, phí điện nước sinh hoạt và nộp lệ phí trực tuyến
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={taiDanhSachHoaDon}
            disabled={isLoadingHoaDon}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingHoaDon ? 'animate-spin' : ''}`} />
            <span>Làm mới hóa đơn</span>
          </Button>
        </div>
      </div>

      {/* 3 Thẻ Thống kê Công nợ Tài chính */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tổng tiền phát sinh</span>
              <Receipt className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {dinhDangTien(thongKeTaiChinh.tongTien)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Đã thanh toán</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {dinhDangTien(thongKeTaiChinh.daThanhToan)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Số tiền còn nợ</span>
              <AlertCircle className="h-4 w-4 text-rose-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-rose-600">
              {dinhDangTien(thongKeTaiChinh.conNo)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bảng danh sách Hóa đơn */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 py-3.5 px-6">
          <CardTitle className="text-base font-semibold text-slate-900">
            Danh sách Hóa đơn ({danhSachHoaDon.length} hóa đơn)
          </CardTitle>
        </CardHeader>

        {isLoadingHoaDon ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              <p className="text-sm">Đang tải danh sách hóa đơn...</p>
            </div>
          </div>
        ) : danhSachHoaDon.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center p-6">
            <Receipt className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">Chưa có hóa đơn nào phát sinh</p>
            <p className="text-xs text-slate-400 mt-1">
              Các hóa đơn tiền phòng và điện nước sẽ hiển thị tại đây khi tới kỳ thu phí
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/75">
                  <TableHead className="w-20">Mã HĐ</TableHead>
                  <TableHead>Loại hóa đơn</TableHead>
                  <TableHead>Ngày lập</TableHead>
                  <TableHead>Hạn thanh toán</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                  <TableHead className="text-right">Đã nộp</TableHead>
                  <TableHead className="text-right">Còn nợ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {danhSachHoaDon.map((hd) => {
                  const isConNo = Number(hd.conNo) > 0
                  return (
                    <TableRow key={hd.maHoaDon} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono text-xs font-semibold text-slate-900">
                        #{hd.maHoaDon}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {hd.loaiHoaDon}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{hd.ngayLap}</TableCell>
                      <TableCell className="text-xs text-slate-600">{hd.hanThanhToan}</TableCell>
                      <TableCell className="text-right font-medium text-xs">
                        {dinhDangTien(hd.tongTien)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-emerald-600 font-medium">
                        {dinhDangTien(hd.daThanhToan)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-rose-600">
                        {dinhDangTien(hd.conNo)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isConNo ? 'destructive' : 'default'}
                          className={!isConNo ? 'bg-emerald-600 text-xs' : 'text-xs'}
                        >
                          {hd.trangThai || (isConNo ? 'Chưa thanh toán' : 'Đã thanh toán')}
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
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            Chi tiết
                          </Button>

                          {isConNo && (
                            <Button
                              size="sm"
                              onClick={() => moDialogThanhToan(hd)}
                              className="h-7 text-xs bg-slate-900 text-white hover:bg-slate-800"
                            >
                              <CreditCard className="mr-1 h-3.5 w-3.5" />
                              Thanh toán
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

      {/* Modal 1: Chi tiết các khoản thu trong Hóa đơn */}
      <Dialog open={isMoDialogChiTiet} onOpenChange={setIsMoDialogChiTiet}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-slate-700" />
              <span>Chi tiết Hóa đơn #{hoaDonXemChiTiet?.maHoaDon}</span>
            </DialogTitle>
            <DialogDescription>
              {hoaDonXemChiTiet?.loaiHoaDon} • Hạn nộp: {hoaDonXemChiTiet?.hanThanhToan}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {isLoadingChiTiet ? (
              <div className="flex h-36 items-center justify-center">
                <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                <span className="ml-2 text-xs text-slate-500">Đang tải các khoản thu...</span>
              </div>
            ) : chiTietCacKhoanThu.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-6">
                Chưa có danh mục khoản thu chi tiết cho hóa đơn này
              </p>
            ) : (
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 text-xs">
                      <TableHead>Khoản thu</TableHead>
                      <TableHead className="text-center">Số lượng</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead className="text-right">Miễn giảm</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chiTietCacKhoanThu.map((khoan, index) => (
                      <TableRow key={index} className="text-xs">
                        <TableCell className="font-medium text-slate-900">
                          {khoan.tenKhoanThu}
                        </TableCell>
                        <TableCell className="text-center">{khoan.soLuong}</TableCell>
                        <TableCell className="text-right">{dinhDangTien(khoan.donGia)}</TableCell>
                        <TableCell className="text-right text-emerald-600">
                          {khoan.mienGiam > 0 ? `-${dinhDangTien(khoan.mienGiam)}` : '0 đ'}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {dinhDangTien(khoan.thanhTien)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {hoaDonXemChiTiet && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng hóa đơn:</span>
                  <span className="font-semibold text-slate-900">
                    {dinhDangTien(hoaDonXemChiTiet.tongTien)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Đã thanh toán:</span>
                  <span className="font-medium text-emerald-600">
                    {dinhDangTien(hoaDonXemChiTiet.daThanhToan)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                  <span className="text-slate-900">Số tiền còn nợ:</span>
                  <span className="text-rose-600">
                    {dinhDangTien(hoaDonXemChiTiet.conNo)}
                  </span>
                </div>
              </div>
            )}
          </div>

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

      {/* Modal 2: Thanh toán Hóa đơn trực tuyến */}
      <Dialog open={isMoDialogThanhToan} onOpenChange={setIsMoDialogThanhToan}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-slate-900">
              <Wallet className="h-5 w-5" />
              <DialogTitle>Thanh toán Hóa đơn #{hoaDonDangThanhToan?.maHoaDon}</DialogTitle>
            </div>
            <DialogDescription>
              {hoaDonDangThanhToan?.loaiHoaDon} • Số nợ hiện tại:{' '}
              <strong className="text-rose-600">
                {dinhDangTien(hoaDonDangThanhToan?.conNo || 0)}
              </strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={xuLyXacNhanThanhToan} className="space-y-4 py-2 text-xs">
            {/* Tùy chọn 1: Trả 100% số tiền còn nợ */}
            <div className="flex items-center space-x-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <input
                type="checkbox"
                id="traToanBo"
                checked={isTraToanBo}
                onChange={(e) => {
                  const isChecked = e.target.checked
                  setIsTraToanBo(isChecked)
                  if (isChecked && hoaDonDangThanhToan) {
                    setFormThanhToan({
                      ...formThanhToan,
                      soTien: Number(hoaDonDangThanhToan.conNo),
                    })
                  }
                }}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
              <label htmlFor="traToanBo" className="cursor-pointer font-medium text-slate-700">
                Trả 100% số tiền còn nợ ({dinhDangTien(hoaDonDangThanhToan?.conNo || 0)})
              </label>
            </div>

            {/* Tùy chọn 2: Nhập số tiền nộp từng phần */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Số tiền nộp (VNĐ) <span className="text-red-500">*</span>
                </label>
                {!isTraToanBo && (
                  <span className="text-[11px] text-amber-600 font-medium">
                    Yêu cầu bội số của 10.000 đ
                  </span>
                )}
              </div>
              <Input
                type="number"
                min={1}
                max={Number(hoaDonDangThanhToan?.conNo) || 100000000}
                step={isTraToanBo ? 1 : 10000}
                required
                disabled={isTraToanBo}
                value={formThanhToan.soTien}
                onChange={(e) => {
                  const giaTri = parseFloat(e.target.value) || 0
                  setFormThanhToan({
                    ...formThanhToan,
                    soTien: giaTri,
                  })
                }}
                className={`h-8 text-xs font-semibold ${
                  isTraToanBo ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                }`}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                {isTraToanBo
                  ? 'Đang chọn thanh toán toàn bộ số tiền còn nợ của hóa đơn.'
                  : 'Nhập số tiền là bội số của 10.000 VNĐ. Để trả dứt điểm số nợ lẻ, hãy tích vào "Trả 100% số tiền còn nợ".'}
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Phương thức thanh toán <span className="text-red-500">*</span>
              </label>
              <select
                value={formThanhToan.phuongThuc}
                onChange={(e) =>
                  setFormThanhToan({ ...formThanhToan, phuongThuc: e.target.value })
                }
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                <option value="Chuyển khoản">Chuyển khoản ngân hàng</option>
                <option value="Ví điện tử">Ví điện tử (Momo, VNPay, ZaloPay)</option>
                <option value="Tiền mặt">Nộp tiền mặt tại văn phòng</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Mã giao dịch / Mã tham chiếu ngân hàng
              </label>
              <Input
                placeholder="Nhập mã biên lai hoặc mã giao dịch..."
                value={formThanhToan.maGiaoDich || ''}
                onChange={(e) =>
                  setFormThanhToan({ ...formThanhToan, maGiaoDich: e.target.value })
                }
                className="h-8 text-xs font-mono"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMoDialogThanhToan(false)}
                disabled={isDangXuLyThanhToan}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isDangXuLyThanhToan}
                className="bg-slate-900 text-white hover:bg-slate-800 gap-1.5"
              >
                <span>{isDangXuLyThanhToan ? 'Đang thanh toán...' : 'Xác nhận nộp phí'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StudentInvoicesPage
